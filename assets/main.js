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

  // ♥ 좋아요: 뉴스레터(inherit-newsletter-N) · 작가 이야기(art-story-N) 글에 자동으로 붙습니다.
  // 숫자는 Supabase(supabase/likes.sql)에 저장되고, 같은 브라우저에서는 한 번만 누를 수 있습니다(다시 누르면 취소).
  var LIKES = {
    url: '',  // 예: https://abcd1234.supabase.co
    key: ''   // Supabase의 공개용 키(anon / publishable). 비밀 키(service_role)는 절대 넣지 마세요.
  };
  var article = document.querySelector('article.story');
  var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (article && /^(art-story|inherit-newsletter)-\d{1,3}$/.test(slug)) {
    var store = 'syfas-like:' + slug;
    var liked = false;
    try { liked = localStorage.getItem(store) === '1'; } catch (e) {}
    var count = null;
    var ready = !!(LIKES.url && LIKES.key);

    var box = document.createElement('div');
    box.className = 'like-box';
    box.innerHTML = '<p class="like-text">이 글이 도움이 되셨나요?</p>' +
      '<button type="button" class="like-btn"><span class="like-heart" aria-hidden="true">♥</span>' +
      '<span class="like-label">좋아요</span><span class="like-count"></span></button>';
    var btn = box.querySelector('.like-btn');
    var countEl = box.querySelector('.like-count');

    var render = function () {
      btn.classList.toggle('liked', liked);
      btn.setAttribute('aria-pressed', String(liked));
      btn.setAttribute('aria-label', liked ? '좋아요 취소' : '좋아요');
      countEl.textContent = count === null ? '' : count.toLocaleString('ko-KR');
    };
    var api = function (path, opts) {
      opts = opts || {};
      opts.headers = { apikey: LIKES.key, Authorization: 'Bearer ' + LIKES.key, 'Content-Type': 'application/json' };
      return fetch(LIKES.url.replace(/\/$/, '') + '/rest/v1/' + path, opts).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    };

    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      liked = !liked;
      try { liked ? localStorage.setItem(store, '1') : localStorage.removeItem(store); } catch (e) {}
      if (count !== null) count = Math.max(0, count + (liked ? 1 : -1));
      btn.classList.remove('pop'); void btn.offsetWidth; if (liked) btn.classList.add('pop');
      render();
      if (!ready) return;
      btn.disabled = true;
      api('rpc/like_post', { method: 'POST', body: JSON.stringify({ p_slug: slug, p_delta: liked ? 1 : -1 }) })
        .then(function (n) { if (typeof n === 'number') count = n; })
        .catch(function () {})
        .then(function () { btn.disabled = false; render(); });
    });

    var anchor = article.querySelector('.nl-consult') || article.querySelector('.story-sources') || article.querySelector('.story-back');
    if (anchor) anchor.parentNode.insertBefore(box, anchor);
    else (article.querySelector('.story-inner') || article).appendChild(box);
    render();

    if (ready) {
      api('post_likes?select=count&slug=eq.' + encodeURIComponent(slug))
        .then(function (rows) { count = rows.length ? rows[0].count : 0; render(); })
        .catch(function () {});
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
