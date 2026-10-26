"""data/news.json 으로 홈페이지 세무뉴스 칸(index.html)과 전체 목록(news.html)을 다시 만든다.

사용법: python3 scripts/build_news.py
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOME_LIMIT = 6


def card(item):
    e = html.escape
    return f'''          <article class="news-item">
            <div class="news-meta"><span class="news-cat">{e(item["category"])}</span><time datetime="{e(item["date"])}">{e(item["date"].replace("-", "."))}</time></div>
            <h3>{e(item["title"])}</h3>
            <p>{e(item["summary"])}</p>
            <a class="news-source" href="{e(item["url"])}" target="_blank" rel="noopener">출처: {e(item["source"])} →</a>
          </article>'''


def fill(text, block):
    """NEWS:START 와 NEWS:END 표시 사이를 block 으로 바꾼다."""
    pattern = r"(<!-- NEWS:START -->).*?([ \t]*<!-- NEWS:END -->)"
    return re.sub(pattern, lambda m: m.group(1) + "\n" + block + "\n" + m.group(2), text, count=1, flags=re.S)


def main():
    items = json.loads((ROOT / "data/news.json").read_text(encoding="utf-8"))
    items.sort(key=lambda i: i["date"], reverse=True)

    index = ROOT / "index.html"
    text = index.read_text(encoding="utf-8")
    block = "\n".join(card(i) for i in items[:HOME_LIMIT])
    text = fill(text, block)
    index.write_text(text, encoding="utf-8")

    page = ROOT / "news.html"
    ptext = page.read_text(encoding="utf-8")
    pblock = "\n".join(card(i) for i in items)
    ptext = fill(ptext, pblock)
    page.write_text(ptext, encoding="utf-8")

    sitemap = ROOT / "sitemap.xml"
    latest = items[0]["date"] if items else ""
    stext = sitemap.read_text(encoding="utf-8")
    stext = re.sub(r"(<loc>https://syfas.com/news.html</loc>\s*<lastmod>)[^<]*", lambda m: m.group(1) + latest, stext)
    sitemap.write_text(stext, encoding="utf-8")
    print(f"{len(items)}건 반영 (홈 {min(len(items), HOME_LIMIT)}건)")


if __name__ == "__main__":
    main()
