(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');

  function setMenu(open) {
    menu.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', function () {
    setMenu(!menu.classList.contains('open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
  });

  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Pre-select the inquiry topic when arriving from a section page (e.g. ?topic=art)
  var topic = new URLSearchParams(location.search).get('topic');
  var option = topic && document.querySelector('.contact-form option[data-topic="' + topic + '"]');
  if (option) option.selected = true;

  // ♥ 좋아요 · 조회수: 뉴스레터(inherit-newsletter-N) · 작가 이야기(art-story-N) 글에 자동으로 붙습니다.
  // 숫자는 Supabase(supabase/likes.sql)에 저장됩니다.
  // 좋아요는 같은 브라우저에서 한 번만(다시 누르면 취소), 조회수는 같은 브라우저에서 하루 한 번만 올라갑니다.
  var LIKES = {
    url: 'https://qtmonyvtbxtmowkypqro.supabase.co',
    key: 'sb_publishable_s4oGHYXgTsreeAzo_o5klA_vnu4TLE9'  // 공개용 키(publishable). 비밀 키(secret / service_role)는 절대 넣지 마세요.
  };
  var article = document.querySelector('article.story');
  var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (article && /^(art-story|inherit-newsletter)-\d{1,3}$/.test(slug)) {
    var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
    var set = function (k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
    var store = 'syfas-like:' + slug;
    var liked = get(store) === '1';
    var count = null;
    var views = null;
    var ready = !!(LIKES.url && LIKES.key);
    var fmt = function (n) { return n.toLocaleString('ko-KR'); };

    var box = document.createElement('div');
    box.className = 'like-box';
    box.innerHTML = '<p class="like-text">이 글이 도움이 되셨나요?</p>' +
      '<button type="button" class="like-btn"><span class="like-heart" aria-hidden="true">♥</span>' +
      '<span class="like-label">좋아요</span><span class="like-count"></span></button>' +
      '<p class="view-count"></p>';
    var btn = box.querySelector('.like-btn');
    var countEl = box.querySelector('.like-count');
    var viewEl = box.querySelector('.view-count');
    var meta = article.querySelector('.story-meta');
    var metaView = null;
    if (meta) {
      metaView = document.createElement('span');
      metaView.className = 'meta-views';
      meta.appendChild(metaView);
    }

    var render = function () {
      btn.classList.toggle('liked', liked);
      btn.setAttribute('aria-pressed', String(liked));
      btn.setAttribute('aria-label', liked ? '좋아요 취소' : '좋아요');
      countEl.textContent = count === null ? '' : fmt(count);
      viewEl.textContent = views === null ? '' : '조회 ' + fmt(views);
      if (metaView) metaView.textContent = views === null ? '' : ' · 조회 ' + fmt(views);
    };
    var api = function (path, body) {
      var opts = { headers: { apikey: LIKES.key, 'Content-Type': 'application/json' } };
      if (!/^sb_/.test(LIKES.key)) opts.headers.Authorization = 'Bearer ' + LIKES.key;
      if (body) { opts.method = 'POST'; opts.body = JSON.stringify(body); }
      return fetch(LIKES.url.replace(/\/$/, '') + '/rest/v1/' + path, opts).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    };

    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      liked = !liked;
      set(store, liked ? '1' : null);
      if (count !== null) count = Math.max(0, count + (liked ? 1 : -1));
      btn.classList.remove('pop'); void btn.offsetWidth; if (liked) btn.classList.add('pop');
      render();
      if (!ready) return;
      btn.disabled = true;
      api('rpc/like_post', { p_slug: slug, p_delta: liked ? 1 : -1 })
        .then(function (n) { if (typeof n === 'number') count = n; })
        .catch(function () {})
        .then(function () { btn.disabled = false; render(); });
    });

    var anchor = article.querySelector('.nl-consult') || article.querySelector('.story-sources') || article.querySelector('.story-back');
    if (anchor) anchor.parentNode.insertBefore(box, anchor);
    else (article.querySelector('.story-inner') || article).appendChild(box);
    render();

    if (ready) {
      var viewKey = 'syfas-view:' + slug;
      var today = new Date().toISOString().slice(0, 10);
      var apply = function (row) { if (row) { views = row.views; count = row.likes; } else { views = 0; count = 0; } render(); };
      if (get(viewKey) !== today) {
        api('rpc/view_post', { p_slug: slug })
          .then(function (row) { set(viewKey, today); apply(row); })
          .catch(function () {});
      } else {
        api('post_stats?select=views,likes&slug=eq.' + encodeURIComponent(slug))
          .then(function (rows) { apply(rows[0]); })
          .catch(function () {});
      }
    }
  }

  // Fade sections in as they scroll into view
  if ('IntersectionObserver' in window) {
    var items = document.querySelectorAll('.strength, .service, .person, .office, .about-text, .contact-form, .news-item, .art-card, .art-step, .art-point');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }
})();
