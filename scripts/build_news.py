"""data/*.json 으로 홈페이지 소식 칸(index.html)과 전체 목록 페이지를 다시 만든다.

- 세무뉴스: data/news.json → index.html(NEWS), news.html(NEWS, NEWS-LIST)
- 정부지원금: data/support.json → index.html(SUPPORT), support.html(SUPPORT, SUPPORT-LIST)
- 미술품 소식: data/art.json → index.html(ART), art.html(ART, ART-LIST)

새 항목에는 번호(no)가 자동으로 붙고 json 파일에 저장된다. 한 번 붙은 번호는 바뀌지 않는다.

사용법: python3 scripts/build_news.py
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
e = html.escape

FEEDS = [
    {"data": "data/news.json", "marker": "NEWS", "page": "news.html", "anchor": "news", "home": 6},
    {"data": "data/support.json", "marker": "SUPPORT", "page": "support.html", "anchor": "support", "home": 4},
    {"data": "data/art.json", "marker": "ART", "page": "art.html", "anchor": "art", "home": 3},
]


def dot(date):
    return date.replace("-", ".")


def card(item, feed, on_page):
    anchor = f'{feed["anchor"]}-{item["no"]}'
    title = e(item["title"])
    if not on_page:
        title = f'<a href="{feed["page"]}#{anchor}">{title}</a>'
    facts = ""
    if "deadline" in item:
        rows = [("신청기한", item["deadline"]), ("신청기관", item["agency"]), ("신청처", item["apply"])]
        facts = '\n            <dl class="news-facts">' + "".join(
            f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in rows) + "</dl>"
    id_attr = f' id="{anchor}"' if on_page else ""
    return f'''          <article class="news-item"{id_attr}>
            <div class="news-meta"><span class="news-no">No.{item["no"]}</span><span class="news-cat">{e(item["category"])}</span><time datetime="{e(item["date"])}">{dot(e(item["date"]))}</time></div>
            <h3>{title}</h3>
            <p>{e(item["summary"])}</p>{facts}
            <a class="news-source" href="{e(item["url"])}" target="_blank" rel="noopener">출처: {e(item["source"])} →</a>
          </article>'''


def archive(items, feed):
    rows = []
    for i in items:
        extra = f'<span class="arc-deadline">{e(i["deadline"])}</span>' if "deadline" in i else ""
        rows.append(
            f'            <li><a href="#{feed["anchor"]}-{i["no"]}"><span class="arc-no">{i["no"]}</span>'
            f'<span class="arc-date">{dot(e(i["date"]))}</span><span class="arc-cat">{e(i["category"])}</span>'
            f'<span class="arc-title">{e(i["title"])}</span>{extra}</a></li>')
    return "\n".join(rows)


def fill(text, marker, block):
    """<!-- MARKER:START --> 와 <!-- MARKER:END --> 사이를 block 으로 바꾼다."""
    pattern = rf"(<!-- {marker}:START -->).*?([ \t]*<!-- {marker}:END -->)"
    return re.sub(pattern, lambda m: m.group(1) + "\n" + block + "\n" + m.group(2), text, count=1, flags=re.S)


def load(feed):
    path = ROOT / feed["data"]
    items = json.loads(path.read_text(encoding="utf-8"))
    # 번호가 없는 항목은 날짜 순서대로 다음 번호를 받는다
    nxt = max((i.get("no", 0) for i in items), default=0) + 1
    for i in sorted((i for i in items if "no" not in i), key=lambda i: i["date"]):
        i["no"] = nxt
        nxt += 1
    items.sort(key=lambda i: (i["date"], i["no"]), reverse=True)
    path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return items


def main():
    index = ROOT / "index.html"
    itext = index.read_text(encoding="utf-8")
    sitemap = ROOT / "sitemap.xml"
    stext = sitemap.read_text(encoding="utf-8")

    for feed in FEEDS:
        items = load(feed)
        itext = fill(itext, feed["marker"], "\n".join(card(i, feed, False) for i in items[:feed["home"]]))

        page = ROOT / feed["page"]
        ptext = page.read_text(encoding="utf-8")
        ptext = fill(ptext, feed["marker"] + "-LIST", archive(items, feed))
        ptext = fill(ptext, feed["marker"], "\n".join(card(i, feed, True) for i in items))
        page.write_text(ptext, encoding="utf-8")

        latest = items[0]["date"] if items else ""
        loc = re.escape(f'https://syfas.com/{feed["page"]}')
        stext = re.sub(rf"(<loc>{loc}</loc>\s*<lastmod>)[^<]*", lambda m: m.group(1) + latest, stext)
        print(f'{feed["page"]}: {len(items)}건 반영 (홈 {min(len(items), feed["home"])}건)')

    index.write_text(itext, encoding="utf-8")
    sitemap.write_text(stext, encoding="utf-8")


if __name__ == "__main__":
    main()
