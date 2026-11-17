/* 個體經濟學期中考 衝刺講義 — 共用程式
   內容頁只要寫 <main class="page">，這支程式負責：
   目錄與進度、互動圖表、顯示性偏好檢查器、逐步解答、小測驗、數學式排版。 */
(function () {
  'use strict';

  /* ================= 1. 站台資料 ================= */
  // 2026-11-18 上午 10:10 開考（月份從 0 起算）。
  // timed 改成 false 的話只看日期，倒數到當天 0:00。
  var EXAM = { y: 2026, m: 10, d: 18, hh: 10, mm: 10, timed: true };
  var LS_KEY = 'micro-mid-v1';

  // hw：這一章對應的作業；probs：那份作業的題號
  var PAGES = [
    { id: 'index', file: 'index.html', num: '', title: '首頁 · 讀書計畫' },
    { id: 'basics', file: 'basics.html', num: '暖身', title: '預算線、無異曲線與最適選擇', group: '暖身（Ch2–Ch5 快速複習）', study: true },
    { id: 'ch7', file: 'ch7.html', num: 'Ch7', title: '顯示性偏好與指數', group: '考試範圍', study: true, hw: 'HW6', probs: [1, 2, 3] },
    { id: 'ch8', file: 'ch8.html', num: 'Ch8', title: 'Slutsky 方程式：替代效果與所得效果', study: true, hw: 'HW7', probs: [1, 2, 3] },
    { id: 'ch9', file: 'ch9.html', num: 'Ch9', title: '買與賣：稟賦、淨需求與勞動供給', study: true, hw: 'HW8', probs: [1, 2, 3] },
    { id: 'ch10', file: 'ch10.html', num: 'Ch10', title: '跨期選擇：現值、利率與證券', study: true, hw: 'HW9', probs: [1, 2, 3] },
    { id: 'formulas', file: 'formulas.html', num: '', title: '公式總表、中英名詞對照與考前檢查', group: '考前' }
  ];

  var pageId = document.body.getAttribute('data-page') || 'index';
  var curIndex = Math.max(0, PAGES.findIndex(function (p) { return p.id === pageId; }));
  var cur = PAGES[curIndex];

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(LS_KEY));
      if (s && typeof s === 'object') return { pages: s.pages || {}, probs: s.probs || {} };
    } catch (e) { /* 無痕模式等情況：進度只留在本次瀏覽 */ }
    return { pages: {}, probs: {} };
  }
  function saveState() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* 同上 */ }
  }
  var state = loadState();

  function allProbs() {
    var out = [];
    PAGES.forEach(function (p) {
      (p.probs || []).forEach(function (n) { out.push({ id: p.hw + '-' + n, sec: p.hw, n: n, page: p }); });
    });
    return out;
  }

  function mk(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  /* ================= 2. 頂列、目錄、頁尾 ================= */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  // 回傳 { label, time, live }：live 表示還在倒數，需要每秒更新
  function countdownParts(now) {
    var start = new Date(EXAM.y, EXAM.m, EXAM.d, EXAM.timed ? EXAM.hh : 0, EXAM.timed ? EXAM.mm : 0, 0);
    var dayEnd = new Date(EXAM.y, EXAM.m, EXAM.d + 1);
    var ms = start - now;
    if (ms > 0) {
      var s = Math.ceil(ms / 1000);
      var d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600); s -= h * 3600;
      var m = Math.floor(s / 60); s -= m * 60;
      return {
        label: EXAM.timed ? '距離考試' : '距離考試日',
        time: (d > 0 ? d + ' 天 ' : '') + pad2(h) + ':' + pad2(m) + ':' + pad2(s),
        live: true
      };
    }
    if (now < dayEnd) return { label: '', time: EXAM.timed ? '考試已開始' : '今天考試', live: false };
    return { label: '', time: '考試已結束', live: false };
  }
  function startCountdown(el) {
    var labelEl = el.querySelector('.cd-label');
    var timeEl = el.querySelector('.cd-time');
    var timer = null;
    function tick() {
      clearTimeout(timer);
      var now = new Date();
      var p = countdownParts(now);
      if (labelEl.textContent !== p.label) labelEl.textContent = p.label;
      el.classList.toggle('is-over', !p.live);
      if (timeEl.textContent !== p.time) timeEl.textContent = p.time;
      el.setAttribute('aria-label', (p.label ? p.label + ' ' : '') + p.time);
      // 對齊到下一個整秒；倒數結束後改成每分鐘檢查一次（今天考試 → 考試已結束）
      timer = setTimeout(tick, p.live ? 1000 - (now.getTime() % 1000) + 20 : 60000);
    }
    tick();
    // 分頁切回來時立刻更新（背景分頁的計時器會被瀏覽器放慢）
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  }

  function buildChrome() {
    document.body.classList.add('has-side');

    var top = mk('header', 'topbar');
    top.innerHTML =
      '<button type="button" class="menu-btn" aria-controls="sidebar" aria-expanded="false"><span class="menu-ico" aria-hidden="true"></span>目錄</button>' +
      '<a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">x*</span><span>個體經濟學期中考<small>衝刺講義</small></span></a>' +
      '<span class="top-spacer"></span>' +
      '<a class="top-link" href="formulas.html#glossary">中英名詞對照</a>' +
      '<a class="top-link" href="formulas.html">公式總表</a>' +
      '<span class="countdown" role="timer"><span class="cd-label"></span><span class="cd-short">倒數</span><span class="cd-time"></span></span>';

    var side = mk('nav', 'sidebar');
    side.id = 'sidebar';
    side.setAttribute('aria-label', '章節目錄');
    var html = '<div class="side-head"><p class="side-title">章節目錄</p><p class="side-prog" id="sideProg"></p><div class="side-bar"><i id="sideBar"></i></div></div><ul class="side-list">';
    PAGES.forEach(function (p) {
      if (p.group) html += '<li class="side-group">' + esc(p.group) + '</li>';
      html += '<li><a class="side-link' + (p.id === pageId ? ' is-current' : '') + '" data-id="' + p.id + '" href="' + p.file + '"' +
        (p.id === pageId ? ' aria-current="page"' : '') + '><span class="num">' + esc(p.num) + '</span><span class="ttl">' + esc(p.title) +
        '</span><span class="tick" aria-hidden="true">✓</span></a></li>';
    });
    html += '</ul>';
    side.innerHTML = html;

    var scrim = mk('div', 'scrim');
    scrim.hidden = true;

    document.body.prepend(scrim);
    document.body.prepend(side);
    document.body.prepend(top);
    startCountdown(top.querySelector('.countdown'));

    var menuBtn = top.querySelector('.menu-btn');
    function setNav(open) {
      document.body.classList.toggle('nav-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      scrim.hidden = !open;
    }
    menuBtn.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
    scrim.addEventListener('click', function () { setNav(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') setNav(false); });
    side.addEventListener('click', function (ev) { if (ev.target.closest('a')) setNav(false); });
  }

  function refreshProgress() {
    var studyPages = PAGES.filter(function (p) { return p.study; });
    var doneP = studyPages.filter(function (p) { return state.pages[p.id]; }).length;
    var probs = allProbs();
    var doneQ = probs.filter(function (q) { return state.probs[q.id]; }).length;

    document.querySelectorAll('.side-link').forEach(function (a) {
      a.classList.toggle('is-done', !!state.pages[a.getAttribute('data-id')]);
    });
    var sp = document.getElementById('sideProg');
    if (sp) sp.textContent = '讀完 ' + doneP + ' / ' + studyPages.length + ' 章　·　作業題 ' + doneQ + ' / ' + probs.length;
    var sb = document.getElementById('sideBar');
    if (sb) sb.style.width = Math.round(((doneP + doneQ) / (studyPages.length + probs.length)) * 100) + '%';

    document.querySelectorAll('.sec-card[data-id]').forEach(function (c) {
      var done = !!state.pages[c.getAttribute('data-id')];
      c.classList.toggle('is-done', done);
      var meta = c.querySelector('.meta');
      if (meta) meta.textContent = (done ? '✓ 已讀完' : '還沒讀') + (c.getAttribute('data-probs') ? '　·　' + c.getAttribute('data-probs') : '');
    });
    document.querySelectorAll('.chip[data-prob]').forEach(function (c) {
      var done = !!state.probs[c.getAttribute('data-prob')];
      c.classList.toggle('is-done', done);
      c.setAttribute('aria-label', '作業 ' + c.getAttribute('data-prob').replace('-', ' 第 ') + ' 題' + (done ? '（已標記會了）' : ''));
    });
    var hp = document.getElementById('homeProg');
    if (hp) hp.textContent = '目前進度：讀完 ' + doneP + ' / ' + studyPages.length + ' 章，作業題會了 ' + doneQ + ' / ' + probs.length + ' 題。';
  }

  function buildPageEnd() {
    var main = document.querySelector('main.page');
    if (!main) return;
    var end = mk('div', 'page-end');
    if (cur.study) {
      var btn = mk('button', 'btn done-btn');
      btn.type = 'button';
      var paint = function () {
        var done = !!state.pages[cur.id];
        btn.setAttribute('aria-pressed', done ? 'true' : 'false');
        btn.textContent = done ? '✓ 這一章讀完了（再按一次取消）' : '標記：這一章我讀完了';
      };
      btn.addEventListener('click', function () {
        state.pages[cur.id] = !state.pages[cur.id];
        saveState(); paint(); refreshProgress();
      });
      paint();
      end.appendChild(btn);
    }
    var pager = mk('div', 'pager');
    var prev = PAGES[curIndex - 1], next = PAGES[curIndex + 1];
    if (prev) pager.innerHTML += '<a class="prev" href="' + prev.file + '"><small>← 上一頁</small>' + esc((prev.num ? prev.num + '　' : '') + prev.title) + '</a>';
    if (next) pager.innerHTML += '<a class="next" href="' + next.file + '"><small>下一頁 →</small>' + esc((next.num ? next.num + '　' : '') + next.title) + '</a>';
    end.appendChild(pager);
    end.appendChild(mk('p', 'site-note', '自製的考前複習筆記。內容依據課堂簡報（Ch1–Ch5、Ch7–Ch10）與作業 HW6–HW9 整理，題目敘述已用中文重新寫過，解答是自己算的，不是老師公布的版本；若有出入，以老師上課講的為準。'));
    main.appendChild(end);
  }

  function buildToc() {
    var main = document.querySelector('main.page');
    if (!main) return;
    var hs = Array.prototype.slice.call(main.querySelectorAll('h2'));
    hs.forEach(function (h, i) {
      if (!h.id) h.id = 'sec-' + (i + 1);
      if (!h.querySelector('.hl')) h.innerHTML = '<span class="hl">' + h.innerHTML + '</span>';
    });
    var slot = main.querySelector('[data-toc]');
    if (!slot || hs.length < 2) return;
    var ul = mk('ul', 'toc');
    hs.forEach(function (h) {
      var li = mk('li');
      var a = mk('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });
    slot.replaceWith(ul);
  }

  /* ================= 3. 算式解析器 =================
     支援：數字、x（或 t）、滑桿變數 a、+ - * / ^、括號、
     sqrt cbrt exp ln log abs sin cos tan min max、常數 e pi。
     注意 -x^2 會算成 -(x^2)，跟數學習慣一致。 */
  var FUNCS = {
    sqrt: Math.sqrt, cbrt: Math.cbrt, exp: Math.exp, ln: Math.log, log: Math.log10,
    abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, min: Math.min, max: Math.max,
    floor: Math.floor, sign: Math.sign
  };
  var CONSTS = { pi: Math.PI, e: Math.E };
  var exprCache = {};
  var missingVar = {};

  function compile(src) {
    if (typeof src === 'number') return function () { return src; };
    var key = String(src);
    if (exprCache[key]) return exprCache[key];
    var s = key.replace(/\s+/g, '').replace(/−/g, '-');
    var i = 0;

    function fail(msg) { throw new Error(msg + '（位置 ' + i + '）'); }

    function parseExpr() {
      var l = parseTerm();
      while (s[i] === '+' || s[i] === '-') {
        var op = s[i++];
        l = (function (a, b, plus) {
          return plus ? function (v) { return a(v) + b(v); } : function (v) { return a(v) - b(v); };
        })(l, parseTerm(), op === '+');
      }
      return l;
    }
    function parseTerm() {
      var l = parseUnary();
      while (s[i] === '*' || s[i] === '/') {
        var op = s[i++];
        l = (function (a, b, mul) {
          return mul ? function (v) { return a(v) * b(v); } : function (v) { return a(v) / b(v); };
        })(l, parseUnary(), op === '*');
      }
      return l;
    }
    function parseUnary() {
      if (s[i] === '-') { i++; var u = parseUnary(); return function (v) { return -u(v); }; }
      if (s[i] === '+') { i++; return parseUnary(); }
      return parsePower();
    }
    function parsePower() {
      var base = parseAtom();
      if (s[i] === '^') {
        i++;
        var ex = parseUnary();
        return function (v) { return Math.pow(base(v), ex(v)); };
      }
      return base;
    }
    function parseAtom() {
      var m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (m) { i += m[0].length; var n = parseFloat(m[0]); return function () { return n; }; }
      if (s[i] === '(') {
        i++;
        var inner = parseExpr();
        if (s[i] !== ')') fail('少了右括號');
        i++;
        return inner;
      }
      m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
      if (!m) fail('看不懂的符號 "' + (s[i] || '結尾') + '"');
      var name = m[0];
      i += name.length;
      if (s[i] === '(') {
        var fn = FUNCS[name];
        if (!fn) fail('沒有這個函數 ' + name);
        i++;
        var args = [parseExpr()];
        while (s[i] === ',') { i++; args.push(parseExpr()); }
        if (s[i] !== ')') fail('少了右括號');
        i++;
        if (args.length === 1) { var a0 = args[0]; return function (v) { return fn(a0(v)); }; }
        return function (v) { return fn.apply(null, args.map(function (g) { return g(v); })); };
      }
      if (name === 'x' || name === 't') return function (v) { return v.x; };
      if (CONSTS.hasOwnProperty(name)) { var c = CONSTS[name]; return function () { return c; }; }
      // 其餘名字都當成滑桿變數（a、b、c、d 或自己取的名字），畫圖時才查值
      return function (v) {
        var val = v[name];
        if (val === undefined) {
          if (!missingVar[name]) { missingVar[name] = true; console.error('[算式] 沒有這個變數 ' + name + '（出現在「' + key + '」）'); }
          return NaN;
        }
        return val;
      };
    }

    var out;
    try {
      out = parseExpr();
      if (i < s.length) fail('多出來的內容 "' + s.slice(i) + '"');
    } catch (err) {
      console.error('[算式] 無法解析「' + key + '」：' + err.message);
      out = function () { return NaN; };
    }
    exprCache[key] = out;
    return out;
  }

  /* ================= 4. 互動圖表 ================= */
  var UID = 0;

  function fmtNum(v, digits) {
    if (!isFinite(v)) return '無定義';
    if (digits === undefined) digits = 2;
    if (Math.abs(v) < 0.5 * Math.pow(10, -digits)) v = 0;
    return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace('-', '−');
  }
  function niceStep(range, count) {
    var raw = range / Math.max(1, count);
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / pow;
    var step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
    return +step.toPrecision(10);
  }
  function tickList(lo, hi, step) {
    var out = [];
    var k = Math.ceil(lo / step - 1e-9);
    for (; k * step <= hi + step * 1e-9; k++) out.push(+(k * step).toPrecision(12));
    return out;
  }
  function tickText(v, step) {
    var dec = (String(+step.toPrecision(10)).split('.')[1] || '').length;
    return fmtNum(v, Math.min(dec, 6));
  }
  function r1(v) { return Math.round(v * 10) / 10; }
  // 估計標籤寬度（12.5px 字級）：中日韓與全形字算一個字寬，其餘算半個多一點
  function textW(str) {
    var w = 0;
    for (var i = 0; i < str.length; i++) w += str.charCodeAt(i) > 0x2E7F ? 12.6 : 7.2;
    return w;
  }
  // 依對齊方式把文字的 x 座標推回 [2, W − 2] 之內
  function fitX(x, tw, anchor, W) {
    if (tw >= W - 4) return anchor === 'start' ? 2 : anchor === 'end' ? W - 2 : W / 2;
    if (anchor === 'start') return Math.max(2, Math.min(W - 2 - tw, x));
    if (anchor === 'end') return Math.min(W - 2, Math.max(2 + tw, x));
    return Math.max(2 + tw / 2, Math.min(W - 2 - tw / 2, x));
  }

  function initFigure(fig) {
    var scr = fig.querySelector('script[type="application/json"]');
    if (!scr) return;
    var cfg;
    try { cfg = JSON.parse(scr.textContent); }
    catch (err) {
      console.error('[圖表] 設定不是合法的 JSON：' + err.message, scr.textContent.slice(0, 160));
      fig.insertBefore(mk('p', 'fig-error', '這張圖載入失敗。'), fig.firstChild);
      return;
    }

    var panels = cfg.panels || [cfg];
    // 滑桿可以有好幾支：sliders: [...]，變數名依序是 a、b、c、d（也可以用 "v" 自己取名）
    var sls = cfg.sliders || (cfg.slider ? [cfg.slider] : []);
    var hidden = {};
    var vars = { x: 0 };
    sls.forEach(function (s, i) {
      s.v = s.v || 'abcd'.charAt(i);
      if (s.steps) { s.min = 1; s.max = s.steps.length; s.step = 1; if (s.value === undefined) s.value = 1; }
      vars[s.v] = Number(s.value);
    });
    var cap = fig.querySelector('figcaption');
    var altText = cfg.alt || (cap ? cap.textContent : '圖形');

    function N(v) { vars.x = 0; return compile(v)(vars); }
    // 圖上任何東西都可以加 "if": "算式"，算出來大於 0 才畫（用來做一步一步出現的圖）
    function on(o) { return o['if'] === undefined || N(o['if']) > 0; }
    function fnOf(pi, fi) {
      var p = panels[pi] || panels[0];
      var f = (p.fns || [])[fi];
      return f ? compile(f.f) : function () { return NaN; };
    }
    function fAt(c, x) { vars.x = x; return c(vars); }
    function dAt(c, x) {
      var h = 1e-4 * Math.max(1, Math.abs(x));
      return (fAt(c, x + h) - fAt(c, x - h)) / (2 * h);
    }
    function d2At(c, x) {
      var h = 1e-3 * Math.max(1, Math.abs(x));
      return (fAt(c, x + h) - 2 * fAt(c, x) + fAt(c, x - h)) / (h * h);
    }
    function tpl(str) {
      return String(str).replace(/\{\{([^}|]+)(?:\|(\d+))?\}\}/g, function (_, ex, dg) {
        return fmtNum(N(ex), dg === undefined ? 0 : parseInt(dg, 10));
      });
    }

    var body = mk('div', 'fig-body');
    fig.insertBefore(body, cap);
    var stage = mk('div', 'fig-stage');
    body.appendChild(stage);

    var holders = panels.map(function (p) {
      var wrap = mk('div', 'fig-panel' + (p.narrow ? ' is-narrow' : ''));
      if (p.title) { var t = mk('p', 'fig-panel-title'); t.textContent = p.title; wrap.appendChild(t); }
      var holder = mk('div', 'fig-svg');
      wrap.appendChild(holder);
      stage.appendChild(wrap);
      return holder;
    });

    /* ---- 畫一個面板 ---- */
    function drawPanel(holder, p, pi) {
      var W = Math.floor(holder.clientWidth);
      if (W < 60) return;
      var H = Math.round(Math.min(p.h || 300, Math.max(190, W * 0.95)));
      var axes = p.axes !== false;
      var m = axes ? { l: 40, r: 14, t: p.ylabel ? 28 : 12, b: p.xlabel ? 44 : 28 } : { l: 6, r: 6, t: 6, b: 6 };
      var x0 = N(p.x[0]), x1 = N(p.x[1]), y0 = N(p.y[0]), y1 = N(p.y[1]);
      var ph = H - m.t - m.b;
      var yt = [], xt = [], ys = 1, xs = 1;

      if (axes && !p.equal) {
        ys = niceStep(y1 - y0, Math.max(3, Math.floor(ph / 42)));
        yt = tickList(y0, y1, ys);
        var maxLen = yt.reduce(function (mx, v) { return Math.max(mx, tickText(v, ys).length); }, 1);
        m.l = Math.max(30, Math.round(12 + maxLen * 7));
      }
      var pw = W - m.l - m.r;
      if (p.equal) {
        var sc = Math.min(pw / (x1 - x0), ph / (y1 - y0));
        var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        x0 = cx - pw / sc / 2; x1 = cx + pw / sc / 2;
        y0 = cy - ph / sc / 2; y1 = cy + ph / sc / 2;
        if (axes) { ys = niceStep(y1 - y0, Math.max(3, Math.floor(ph / 42))); yt = tickList(y0, y1, ys); }
      }
      if (axes) {
        var cnt = Math.max(2, Math.floor(pw / 62));
        xs = niceStep(x1 - x0, cnt);
        xt = tickList(x0, x1, xs);
        var xl = xt.reduce(function (mx, v) { return Math.max(mx, tickText(v, xs).length); }, 1);
        while (xt.length > 2 && (xl * 7 + 14) * xt.length > pw) {
          cnt = Math.max(1, cnt - 1);
          xs = niceStep(x1 - x0, cnt);
          xt = tickList(x0, x1, xs);
          if (cnt === 1) break;
        }
      }

      function X(v) { return m.l + (v - x0) / (x1 - x0) * pw; }
      function Y(v) { return m.t + (y1 - v) / (y1 - y0) * ph; }
      holder._scale = { x0: x0, x1: x1, l: m.l, pw: pw, W: W };

      var uid = 'clip' + (++UID);
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(altText) + '">';
      s += '<defs><clipPath id="' + uid + '"><rect x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/></clipPath></defs>';

      if (axes) {
        s += '<rect class="bg" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/>';
        xt.forEach(function (v) { var px = r1(X(v)); s += '<line class="gridline" x1="' + px + '" y1="' + m.t + '" x2="' + px + '" y2="' + (m.t + ph) + '"/>'; });
        yt.forEach(function (v) { var py = r1(Y(v)); s += '<line class="gridline" x1="' + m.l + '" y1="' + py + '" x2="' + (m.l + pw) + '" y2="' + py + '"/>'; });
        s += '<rect class="frame" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '"/>';
        if (y0 <= 0 && y1 >= 0) s += '<line class="axis" x1="' + m.l + '" y1="' + r1(Y(0)) + '" x2="' + (m.l + pw) + '" y2="' + r1(Y(0)) + '"/>';
        if (x0 <= 0 && x1 >= 0) s += '<line class="axis" x1="' + r1(X(0)) + '" y1="' + m.t + '" x2="' + r1(X(0)) + '" y2="' + (m.t + ph) + '"/>';
        xt.forEach(function (v) {
          var label = tickText(v, xs), px = X(v), half = label.length * 3.4;
          var anchor = px + half > W - 2 ? 'end' : px - half < 2 ? 'start' : 'middle';
          if (anchor === 'end') px = Math.min(W - 2, px + half * 0.6); else if (anchor === 'start') px = Math.max(2, px - half * 0.6);
          s += '<text class="tick" text-anchor="' + anchor + '" x="' + r1(px) + '" y="' + (m.t + ph + 17) + '">' + label + '</text>';
        });
        yt.forEach(function (v) { s += '<text class="tick" text-anchor="end" x="' + (m.l - 6) + '" y="' + r1(Y(v) + 4) + '">' + tickText(v, ys) + '</text>'; });
      }

      s += '<g clip-path="url(#' + uid + ')">';

      /* 幾何形狀 */
      (p.shapes || []).forEach(function (sh) {
        if (sh.type === 'text' || !on(sh)) return;
        var col = sh.color || 'ink';
        var sw = sh.w || 2;
        var dash = sh.dash ? ' stroke-dasharray="6 5"' : '';
        var fillCls = sh.fill ? ' f-' + col + (sh.solid ? '' : ' soft') : ' nofill';
        if (sh.type === 'line') {
          s += '<line class="s-' + col + '" stroke-width="' + sw + '" stroke-linecap="round"' + dash + ' x1="' + r1(X(N(sh.x1))) + '" y1="' + r1(Y(N(sh.y1))) + '" x2="' + r1(X(N(sh.x2))) + '" y2="' + r1(Y(N(sh.y2))) + '"/>';
        } else if (sh.type === 'arrow') {
          // 箭頭：線段加上箭頭尖端（太短就不畫，免得只剩一個三角形）
          var ax1 = X(N(sh.x1)), ay1 = Y(N(sh.y1)), ax2 = X(N(sh.x2)), ay2 = Y(N(sh.y2));
          var alen = Math.sqrt((ax2 - ax1) * (ax2 - ax1) + (ay2 - ay1) * (ay2 - ay1));
          if (isFinite(alen) && alen > 3) {
            var ux = (ax2 - ax1) / alen, uy = (ay2 - ay1) / alen;
            var hl = Math.min(11, alen * 0.6), hw = hl * 0.48;
            var bx = ax2 - ux * hl, by = ay2 - uy * hl;
            s += '<line class="s-' + col + '" stroke-width="' + (sh.w || 2.6) + '" stroke-linecap="round"' + dash + ' x1="' + r1(ax1) + '" y1="' + r1(ay1) + '" x2="' + r1(bx) + '" y2="' + r1(by) + '"/>';
            s += '<polygon class="f-' + col + '" points="' + r1(ax2) + ',' + r1(ay2) + ' ' + r1(bx - uy * hw) + ',' + r1(by + ux * hw) + ' ' + r1(bx + uy * hw) + ',' + r1(by - ux * hw) + '"/>';
          }
        } else if (sh.type === 'rect') {
          var rx = N(sh.x), ry = N(sh.y), rw = N(sh.w0 !== undefined ? sh.w0 : sh.width), rh = N(sh.height);
          s += '<rect class="s-' + col + fillCls + '" stroke-width="' + sw + '"' + dash + ' x="' + r1(X(rx)) + '" y="' + r1(Y(ry + rh)) + '" width="' + r1(Math.max(0, X(rx + rw) - X(rx))) + '" height="' + r1(Math.max(0, Y(ry) - Y(ry + rh))) + '"/>';
        } else if (sh.type === 'circle') {
          var rr = sh.rpx !== undefined ? sh.rpx : Math.abs(X(N(sh.r)) - X(0));
          s += '<circle class="s-' + col + fillCls + '" stroke-width="' + sw + '"' + dash + ' cx="' + r1(X(N(sh.cx))) + '" cy="' + r1(Y(N(sh.cy))) + '" r="' + r1(rr) + '"/>';
        } else if (sh.type === 'semi') {
          var scx = N(sh.cx), scy = N(sh.cy), sr = N(sh.r);
          var rpx = Math.abs(X(scx + sr) - X(scx));
          s += '<path class="s-' + col + fillCls + '" stroke-width="' + sw + '"' + dash + ' d="M' + r1(X(scx - sr)) + ' ' + r1(Y(scy)) + ' A' + r1(rpx) + ' ' + r1(rpx) + ' 0 0 1 ' + r1(X(scx + sr)) + ' ' + r1(Y(scy)) + (sh.fill ? ' Z' : '') + '"/>';
        } else if (sh.type === 'poly') {
          var d = (sh.pts || []).map(function (pt, k) { return (k ? 'L' : 'M') + r1(X(N(pt[0]))) + ' ' + r1(Y(N(pt[1]))); }).join(' ');
          s += '<path class="s-' + col + fillCls + '" stroke-width="' + sw + '" stroke-linejoin="round"' + dash + ' d="' + d + (sh.close ? ' Z' : '') + '"/>';
        }
      });

      /* 參考線 */
      (p.vlines || []).forEach(function (L) {
        if (!on(L)) return;
        var px = r1(X(N(L.x)));
        s += '<line class="s-' + (L.color || 'mute') + '" stroke-width="1.6"' + (L.dash === false ? '' : ' stroke-dasharray="6 5"') + ' x1="' + px + '" y1="' + m.t + '" x2="' + px + '" y2="' + (m.t + ph) + '"/>';
      });
      (p.hlines || []).forEach(function (L) {
        if (!on(L)) return;
        var py = r1(Y(N(L.y)));
        s += '<line class="s-' + (L.color || 'mute') + '" stroke-width="1.6"' + (L.dash === false ? '' : ' stroke-dasharray="6 5"') + ' x1="' + m.l + '" y1="' + py + '" x2="' + (m.l + pw) + '" y2="' + py + '"/>';
      });

      /* 曲線 */
      var samples = Math.max(160, Math.min(520, Math.round(pw)));
      (p.fns || []).forEach(function (fn, fi) {
        if (hidden[pi + ':' + fi] || !on(fn)) return;
        var c = compile(fn.f);
        var lo = x0, hi = x1;
        if (fn.domain) { lo = Math.max(x0, N(fn.domain[0])); hi = Math.min(x1, N(fn.domain[1])); }
        if (!(hi > lo)) return;
        var d = '', pen = false, prev = 0;
        var top = m.t - ph, bot = m.t + 2 * ph;
        for (var k = 0; k <= samples; k++) {
          var xv = lo + (hi - lo) * k / samples;
          var yv = fAt(c, xv);
          if (!isFinite(yv)) { pen = false; continue; }
          var py = Y(yv);
          var out = py < m.t - 2 || py > m.t + ph + 2;
          if (py < top) py = top; else if (py > bot) py = bot;
          if (pen && ((prev <= m.t && py >= m.t + ph) || (prev >= m.t + ph && py <= m.t)) && out) pen = false;
          d += (pen ? 'L' : 'M') + r1(X(xv)) + ' ' + r1(py) + ' ';
          pen = true; prev = py;
        }
        s += '<path class="curve s-' + (fn.color || 'f') + '"' + (fn.dash ? ' stroke-dasharray="7 6"' : '') + (fn.w ? ' style="stroke-width:' + fn.w + '"' : '') + ' d="' + d + '"/>';
      });

      /* 切線 */
      if (p.tangent) {
        var tg = p.tangent;
        var tc = fnOf(pi, tg.fn || 0);
        var tx = N(tg.at === undefined ? 'a' : tg.at);
        var ty = fAt(tc, tx), slope = dAt(tc, tx);
        if (isFinite(ty) && isFinite(slope)) {
          s += '<line class="s-' + (tg.color || 'd1') + '" stroke-width="2.4" stroke-linecap="round" x1="' + r1(X(x0)) + '" y1="' + r1(Y(ty + slope * (x0 - tx))) + '" x2="' + r1(X(x1)) + '" y2="' + r1(Y(ty + slope * (x1 - tx))) + '"/>';
          s += '<circle class="f-' + (tg.color || 'd1') + '" stroke="#fff" stroke-width="2" cx="' + r1(X(tx)) + '" cy="' + r1(Y(ty)) + '" r="6.5"/>';
        }
      }
      s += '</g>';

      /* 參考線標籤（不裁切） */
      (p.vlines || []).forEach(function (L) {
        if (!L.label || !on(L)) return;
        s += '<text class="lbl f-' + (L.color || 'mute') + '" text-anchor="middle" x="' + r1(X(N(L.x))) + '" y="' + (m.t + (L.low ? ph - 8 : 15)) + '">' + esc(tpl(L.label)) + '</text>';
      });
      (p.hlines || []).forEach(function (L) {
        if (!L.label || !on(L)) return;
        s += '<text class="lbl f-' + (L.color || 'mute') + '" text-anchor="' + (L.left ? 'start' : 'end') + '" x="' + (L.left ? m.l + 8 : m.l + pw - 8) + '" y="' + r1(Y(N(L.y)) - 7) + '">' + esc(tpl(L.label)) + '</text>';
      });

      /* 點 */
      var POS = { tr: [9, -9, 'start'], tl: [-9, -9, 'end'], br: [9, 18, 'start'], bl: [-9, 18, 'end'], t: [0, -12, 'middle'], b: [0, 22, 'middle'], r: [11, 4, 'start'], l: [-11, 4, 'end'] };
      (p.points || []).forEach(function (pt) {
        if (!on(pt)) return;
        var px = N(pt.x);
        var py = pt.y !== undefined ? N(pt.y) : fAt(fnOf(pi, pt.on || 0), px);
        if (!isFinite(px) || !isFinite(py)) return;
        var sx = X(px), sy = Y(py);
        if (sx < m.l - 1 || sx > m.l + pw + 1 || sy < m.t - 1 || sy > m.t + ph + 1) return;
        var col = pt.color || 'ink';
        s += pt.open
          ? '<circle class="s-' + col + '" fill="#fff" stroke-width="2.4" cx="' + r1(sx) + '" cy="' + r1(sy) + '" r="5"/>'
          : '<circle class="f-' + col + '" stroke="#fff" stroke-width="2" cx="' + r1(sx) + '" cy="' + r1(sy) + '" r="5.5"/>';
        if (pt.label) {
          var o = POS[pt.pos] || POS.tr;
          var ptxt = tpl(pt.label), ptw = textW(ptxt);
          var anc = o[2], lx = sx + o[0], ly = sy + o[1];
          // 標籤會超出左右邊界就翻到點的另一側；置中的標籤則往內推
          if (anc === 'start' && lx + ptw > W - 2) { anc = 'end'; lx = sx - Math.max(9, Math.abs(o[0])); }
          else if (anc === 'end' && lx - ptw < 2) { anc = 'start'; lx = sx + Math.max(9, Math.abs(o[0])); }
          if (anc === 'middle') lx = Math.max(2 + ptw / 2, Math.min(W - 2 - ptw / 2, lx));
          else if (anc === 'start') lx = Math.max(2, Math.min(W - 2 - ptw, lx));
          else lx = Math.min(W - 2, Math.max(2 + ptw, lx));
          if (ly < 13) ly = sy + 19; else if (ly > H - 3) ly = sy - 9;
          s += '<text class="lbl f-' + col + '" text-anchor="' + anc + '" x="' + r1(lx) + '" y="' + r1(ly) + '">' + esc(ptxt) + '</text>';
        }
      });

      /* 線段標籤與文字 */
      (p.shapes || []).forEach(function (sh) {
        if (!on(sh)) return;
        var col = sh.color || 'ink';
        if ((sh.type === 'line' || sh.type === 'arrow') && sh.label) {
          var lo = sh.lo || [0, -8];
          var ltxt = tpl(sh.label);
          var mx = fitX((X(N(sh.x1)) + X(N(sh.x2))) / 2 + lo[0], textW(ltxt), sh.anchor || 'middle', W), my = (Y(N(sh.y1)) + Y(N(sh.y2))) / 2 + lo[1];
          s += '<text class="lbl f-' + col + '" text-anchor="' + (sh.anchor || 'middle') + '" x="' + r1(mx) + '" y="' + r1(my) + '">' + esc(ltxt) + '</text>';
        } else if (sh.type === 'text') {
          var ttxt = tpl(sh.t);
          s += '<text class="lbl f-' + col + '" text-anchor="' + (sh.anchor || 'middle') + '"' + (sh.size ? ' style="font-size:' + sh.size + 'px"' : '') + ' x="' + r1(fitX(X(N(sh.x)), textW(ttxt) * (sh.size || 12.5) / 12.5, sh.anchor || 'middle', W)) + '" y="' + r1(Y(N(sh.y))) + '">' + esc(ttxt) + '</text>';
        }
      });

      if (axes) {
        if (p.xlabel) s += '<text class="axlabel" text-anchor="end" x="' + (m.l + pw) + '" y="' + (H - 6) + '">' + esc(p.xlabel) + ' →</text>';
        if (p.ylabel) s += '<text class="axlabel" text-anchor="start" x="' + Math.max(2, m.l - 26) + '" y="' + (m.t - 11) + '">↑ ' + esc(p.ylabel) + '</text>';
      }
      s += '</svg>';
      holder.innerHTML = s;
    }

    /* ---- 圖例（可切換的曲線是按鈕） ---- */
    var legendItems = [];
    panels.forEach(function (p, pi) {
      (p.fns || []).forEach(function (fn, fi) {
        if (!fn.label) return;
        if (fn.show === false) hidden[pi + ':' + fi] = true;
        legendItems.push({ pi: pi, fi: fi, fn: fn });
      });
    });
    if (legendItems.length) {
      var lg = mk('div', 'fig-legend');
      legendItems.forEach(function (it) {
        var key = it.pi + ':' + it.fi;
        var node;
        if (it.fn.toggle) {
          node = mk('button', 'lg');
          node.type = 'button';
          node.setAttribute('aria-pressed', hidden[key] ? 'false' : 'true');
          node.addEventListener('click', function () {
            hidden[key] = !hidden[key];
            node.setAttribute('aria-pressed', hidden[key] ? 'false' : 'true');
            render();
          });
        } else {
          node = mk('span', 'lg');
        }
        node.innerHTML = '<span class="sw b-' + (it.fn.color || 'f') + '"></span>' + esc(it.fn.label);
        lg.appendChild(node);
      });
      body.appendChild(lg);
    }

    /* ---- 數值讀數 ---- */
    var readBox = null;
    if (cfg.readouts && cfg.readouts.length) {
      readBox = mk('div', 'fig-read');
      readBox.setAttribute('aria-live', 'off');
      body.appendChild(readBox);
    }
    function readValue(r) {
      if (r.expr !== undefined) return N(r.expr);
      var at = N(r.at === undefined ? 'a' : r.at);
      var pi = r.panel || 0;
      if (r.f !== undefined) return fAt(fnOf(pi, r.f), at);
      if (r.d !== undefined) return dAt(fnOf(pi, r.d), at);
      if (r.d2 !== undefined) return d2At(fnOf(pi, r.d2), at);
      return NaN;
    }
    function paintReadouts() {
      if (!readBox) return;
      var html = '';
      cfg.readouts.forEach(function (r) {
        var v = readValue(r);
        if (r.pos !== undefined || r.neg !== undefined) {
          var eps = r.eps === undefined ? 0.01 : r.eps;
          var kind = !isFinite(v) ? 'zero' : v > eps ? 'pos' : v < -eps ? 'neg' : 'zero';
          var txt = kind === 'pos' ? r.pos : kind === 'neg' ? r.neg : (r.zero || '');
          html += '<span class="ro is-text t-' + kind + '">' + esc(r.label) + '<b>' + esc(txt) + '</b></span>';
        } else {
          html += '<span class="ro' + (r.color ? ' t-' + r.color : '') + '">' + esc(r.label) + '<b>' + esc(r.pre || '') + fmtNum(v, r.digits) + esc(r.unit || '') + '</b></span>';
        }
      });
      readBox.innerHTML = html;
    }

    /* ---- 滑桿（可多支）、步驟按鈕、播放、快速跳到 ---- */
    var ctrls = [];
    var playing = null, rafId = 0;
    function stopPlay() {
      if (!playing) return;
      cancelAnimationFrame(rafId);
      playing.textContent = '▶ 播放';
      playing.setAttribute('aria-pressed', 'false');
      playing = null;
    }
    // 只更新控制項的外觀（數字、哪個步驟被按下），不重畫
    function paintCtrl(si) {
      var s = sls[si], c = ctrls[si], v = vars[s.v];
      if (c.output) c.output.textContent = fmtNum(v * (s.scale || 1), s.digits === undefined ? 2 : s.digits) + (s.unit || '');
      if (c.stepBtns) c.stepBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k + 1 === Math.round(v) ? 'true' : 'false'); });
    }
    function setVal(si, v, fromInput) {
      var s = sls[si], c = ctrls[si];
      v = Math.min(Number(s.max), Math.max(Number(s.min), v));
      vars[s.v] = v;
      if (c.input && !fromInput) c.input.value = v;
      paintCtrl(si);
      render();
    }
    sls.forEach(function (s, si) {
      var c = {};
      ctrls.push(c);
      var ctrl = mk('div', 'fig-ctrl');
      if (s.steps) {
        // 步驟按鈕：一格一個畫面，值是 1、2、3…
        ctrl.classList.add('fig-steps');
        ctrl.setAttribute('role', 'group');
        ctrl.setAttribute('aria-label', s.label || '步驟');
        if (s.label) { var sp = mk('span', 'fig-steps-label'); sp.textContent = s.label; ctrl.appendChild(sp); }
        c.stepBtns = s.steps.map(function (text, k) {
          var b = mk('button', 'btn step-btn');
          b.type = 'button';
          b.textContent = text;
          b.addEventListener('click', function () { stopPlay(); setVal(si, k + 1); });
          ctrl.appendChild(b);
          return b;
        });
      } else {
        var id = 'sl' + (++UID);
        var lab = mk('label');
        lab.htmlFor = id;
        lab.textContent = s.label || s.v;
        c.input = mk('input');
        c.input.type = 'range';
        c.input.id = id;
        c.input.min = s.min; c.input.max = s.max; c.input.step = s.step || 'any'; c.input.value = s.value;
        c.output = mk('output');
        c.output.htmlFor = id;
        ctrl.appendChild(lab); ctrl.appendChild(c.input); ctrl.appendChild(c.output);
        c.input.addEventListener('input', function () { stopPlay(); setVal(si, parseFloat(c.input.value), true); });

        if (s.play) {
          var pb = mk('button', 'btn play-btn');
          pb.type = 'button';
          pb.textContent = '▶ 播放';
          pb.setAttribute('aria-pressed', 'false');
          pb.addEventListener('click', function () {
            if (playing === pb) { stopPlay(); return; }
            stopPlay();
            playing = pb;
            pb.textContent = '❚❚ 暫停';
            pb.setAttribute('aria-pressed', 'true');
            var lo = Number(s.min), hi = Number(s.max);
            var dur = (s.duration || 7) * 1000;
            var from = vars[s.v] >= hi - (hi - lo) * 0.01 ? lo : vars[s.v];
            var t0 = performance.now() - (from - lo) / (hi - lo) * dur;
            var tick = function (now) {
              if (playing !== pb) return;
              var k = Math.min(1, (now - t0) / dur);
              setVal(si, lo + (hi - lo) * k);
              if (k >= 1) { stopPlay(); return; }
              rafId = requestAnimationFrame(tick);
            };
            rafId = requestAnimationFrame(tick);
          });
          ctrl.appendChild(pb);
        }
        if (s.presets && s.presets.length) {
          var pr = mk('div', 'fig-presets');
          s.presets.forEach(function (ps) {
            var b = mk('button', 'btn');
            b.type = 'button';
            b.textContent = ps.label;
            b.addEventListener('click', function () { stopPlay(); setVal(si, Number(ps.value)); });
            pr.appendChild(b);
          });
          ctrl.appendChild(pr);
        }
      }
      body.appendChild(ctrl);
    });

    // 一次設定好幾支滑桿的按鈕：presets: [{ label, set: { a: 1, b: 2 } }]
    if (cfg.presets && cfg.presets.length && sls.length) {
      var pc = mk('div', 'fig-ctrl fig-multi');
      var prs = mk('div', 'fig-presets');
      cfg.presets.forEach(function (ps) {
        var b = mk('button', 'btn');
        b.type = 'button';
        b.textContent = ps.label;
        b.addEventListener('click', function () {
          stopPlay();
          sls.forEach(function (s, si) {
            if (ps.set && ps.set[s.v] !== undefined) setVal(si, Number(ps.set[s.v]));
          });
        });
        prs.appendChild(b);
      });
      pc.appendChild(prs);
      body.appendChild(pc);
    }

    // 拖曳圖面改第一支滑桿（那支滑桿剛好是橫軸座標時才打開："drag": true）
    if (sls.length && sls[0].drag === true && !sls[0].steps) {
      var h0 = holders[sls[0].dragPanel || 0];
      h0.parentNode.classList.add('is-drag');
      var dragging = false;
      var move = function (ev) {
        var sc = h0._scale;
        if (!sc) return;
        var rect = h0.getBoundingClientRect();
        var px = (ev.clientX - rect.left) * (sc.W / rect.width);
        var xv = sc.x0 + (px - sc.l) / sc.pw * (sc.x1 - sc.x0);
        var st = Number(sls[0].step) || 0;
        if (st) xv = Math.round(xv / st) * st;
        stopPlay();
        setVal(0, xv);
      };
      h0.addEventListener('pointerdown', function (ev) {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        dragging = true;
        try { h0.setPointerCapture(ev.pointerId); } catch (e) { /* 舊瀏覽器 */ }
        move(ev);
      });
      h0.addEventListener('pointermove', function (ev) { if (dragging) move(ev); });
      var end = function () { dragging = false; };
      h0.addEventListener('pointerup', end);
      h0.addEventListener('pointercancel', end);
    }

    function render() {
      panels.forEach(function (p, pi) { drawPanel(holders[pi], p, pi); });
      paintReadouts();
    }

    sls.forEach(function (s, si) { paintCtrl(si); });
    render();
    fig.addEventListener('fig:render', render);

    var pending = false;
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; render(); });
      }).observe(stage);
    } else {
      window.addEventListener('resize', render);
    }
  }

  /* ================= 5. 符號圖 =================
     <div class="signline" data-label="f′(x)" data-marks="-1=0, 5=0" data-signs="+ - +" data-kind="mono"></div>
     kind：mono（遞增遞減）、concave（凹向）、none（只畫正負）
     marks 的等號右邊：0 代表該點值為 0，x 代表不存在（無定義） */
  function initSignline(node) {
    var label = node.getAttribute('data-label') || '';
    var kind = node.getAttribute('data-kind') || 'mono';
    var marks = (node.getAttribute('data-marks') || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) {
      var k = t.lastIndexOf('=');
      return k < 0 ? { x: t, v: '0' } : { x: t.slice(0, k).trim(), v: t.slice(k + 1).trim() };
    });
    var signs = (node.getAttribute('data-signs') || '').trim().split(/\s+/).filter(Boolean);
    var notes = node.getAttribute('data-notes') ? node.getAttribute('data-notes').split('|') : null;
    var NOTE = {
      mono: { '+': '↗ 遞增', '-': '↘ 遞減' },
      concave: { '+': '∪ 凹向上', '-': '∩ 凹向下' },
      none: { '+': '', '-': '' }
    }[kind] || { '+': '', '-': '' };

    var html = '<div class="sl-label">' + esc(label) + ' 的符號圖</div><div class="sl-row">';
    signs.forEach(function (sg, i) {
      var plus = sg === '+';
      var note = notes ? (notes[i] || '') : NOTE[plus ? '+' : '-'];
      html += '<div class="sl-run ' + (plus ? 'pos' : 'neg') + '"><span class="sl-signs">' + (plus ? '+ + +' : '− − −') + '</span><span class="sl-bar"></span><span class="sl-note">' + esc(note) + '</span></div>';
      if (i < marks.length) {
        var mkv = marks[i];
        var und = mkv.v !== '0';
        html += '<div class="sl-mark"><span class="sl-val' + (und ? ' und' : '') + '">' + (und ? '不存在' : '0') + '</span><span class="sl-tick"></span><span class="sl-x">' + esc(mkv.x.replace(/-/g, '−')) + '</span></div>';
      }
    });
    html += '</div>';
    node.innerHTML = html;
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', label + ' 的符號圖：' + signs.map(function (sg, i) { return (sg === '+' ? '正' : '負') + (marks[i] ? '，在 ' + marks[i].x + ' 變號' : ''); }).join('；'));
  }

  /* ================= 6. 逐步解答、小測驗、指定題 ================= */
  function redrawFigures(root) {
    root.querySelectorAll('figure.fig').forEach(function (f) { f.dispatchEvent(new CustomEvent('fig:render')); });
  }
  function initSolution(sol) {
    var steps = Array.prototype.filter.call(sol.children, function (c) { return c.classList.contains('step'); });
    if (!steps.length) return;
    var shown = 0;
    var bar = mk('div', 'sol-bar');
    var nextBtn = mk('button', 'btn btn-primary'); nextBtn.type = 'button';
    var allBtn = mk('button', 'btn'); allBtn.type = 'button'; allBtn.textContent = '全部顯示';
    var resetBtn = mk('button', 'btn btn-quiet'); resetBtn.type = 'button'; resetBtn.textContent = '收起解答';
    var count = mk('span', 'sol-count'); count.setAttribute('aria-live', 'polite');
    bar.appendChild(nextBtn); bar.appendChild(allBtn); bar.appendChild(resetBtn); bar.appendChild(count);
    sol.insertBefore(bar, sol.firstChild);
    steps.forEach(function (st, i) { st.setAttribute('data-n', i + 1); });

    function paint() {
      steps.forEach(function (st, i) {
        var was = st.hidden;
        st.hidden = i >= shown;
        if (was && !st.hidden) redrawFigures(st);
      });
      nextBtn.textContent = shown === 0 ? '看第 1 步' : shown < steps.length ? '看下一步（第 ' + (shown + 1) + ' 步）' : '已經是最後一步';
      nextBtn.disabled = shown >= steps.length;
      allBtn.disabled = shown >= steps.length;
      resetBtn.hidden = shown === 0;
      count.textContent = shown + ' / ' + steps.length + ' 步';
    }
    nextBtn.addEventListener('click', function () {
      if (shown < steps.length) shown++;
      paint();
      var st = steps[shown - 1];
      if (st && st.scrollIntoView) st.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    allBtn.addEventListener('click', function () { shown = steps.length; paint(); });
    resetBtn.addEventListener('click', function () {
      shown = 0; paint();
      if (bar.scrollIntoView) bar.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    paint();
  }

  function initQuiz(q) {
    var correct = parseInt(q.getAttribute('data-answer'), 10) - 1;
    var opts = Array.prototype.filter.call(q.children, function (c) { return c.tagName === 'BUTTON'; });
    var why = q.querySelector('.quiz-why');
    if (why) why.hidden = true;
    var res = mk('p', 'quiz-res');
    res.hidden = true;
    res.setAttribute('aria-live', 'polite');
    q.insertBefore(res, why || null);
    opts.forEach(function (b, i) {
      b.type = 'button';
      b.classList.add('opt');
      b.innerHTML = '<span class="opt-k" aria-hidden="true">' + 'ABCDEF'[i] + '</span><span class="opt-t">' + b.innerHTML + '</span>';
      b.addEventListener('click', function () {
        opts.forEach(function (o) { o.classList.remove('is-ok', 'is-no'); });
        var ok = i === correct;
        b.classList.add(ok ? 'is-ok' : 'is-no');
        if (!ok && opts[correct]) opts[correct].classList.add('is-ok');
        res.hidden = false;
        res.className = 'quiz-res ' + (ok ? 'ok' : 'no');
        res.textContent = ok ? '答對了。' : '還差一點，正確答案是 ' + 'ABCDEF'[correct] + '。';
        if (why) why.hidden = false;
      });
    });
  }

  function initProb(card) {
    var id = card.getAttribute('data-prob');
    var parts = id.split('-');
    card.id = 'q-' + id;
    var head = mk('div', 'prob-head');
    var stamp = mk('span', 'prob-stamp');
    stamp.textContent = '作業 ' + parts[0] + ' · 第 ' + parts[1] + ' 題';
    var btn = mk('button', 'prob-done');
    btn.type = 'button';
    function paint() {
      var done = !!state.probs[id];
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
      btn.textContent = done ? '✓ 這題我會了' : '標記：這題我會了';
      card.classList.toggle('is-done', done);
    }
    btn.addEventListener('click', function () {
      state.probs[id] = !state.probs[id];
      saveState(); paint(); refreshProgress();
    });
    head.appendChild(stamp); head.appendChild(btn);
    card.insertBefore(head, card.firstChild);
    paint();
  }

  /* ================= 6b. 顯示性偏好檢查器 =================
     <div class="rptool"><script type="application/json">{ "presets": [ { "label": "…", "obs": [ { "p": [2,1,3], "x": [4,2,1] }, … 共 3 筆 ] } ] }</script></div>
     填三期的價格和選擇，自動算花費表、直接／間接顯示性偏好，並判斷 WARP、SARP。
     每筆 obs 的 p、x 長度是 2 或 3（兩種或三種商品）。 */
  function initRpTool(node) {
    var scr = node.querySelector('script[type="application/json"]');
    var cfg;
    try { cfg = JSON.parse(scr.textContent); }
    catch (err) {
      console.error('[顯示性偏好檢查器] 設定不是合法的 JSON：' + err.message);
      node.appendChild(mk('p', 'fig-error', '這個工具載入失敗。'));
      return;
    }
    var NAMES = ['A', 'B', 'C'];
    var SUB = ['₁', '₂', '₃'];
    var goods = 3;
    var inputs = [];
    var presetBtns = [];

    var bar = mk('div', 'rp-presets');
    bar.appendChild(mk('span', 'rp-presets-label', '載入例子'));
    var tbl = mk('table', 'rp-in');
    var out = mk('div', 'rp-out');
    out.setAttribute('aria-live', 'polite');

    var head = '<thead><tr><th scope="col">時期</th><th scope="col" class="h-p" colspan="3">當時的價格</th><th scope="col" class="h-x" colspan="3">那一期選的組合</th></tr><tr><th></th>';
    ['p', 'x'].forEach(function (kind) {
      for (var g = 0; g < 3; g++) head += '<th scope="col" class="g' + g + ' k-' + kind + '">' + kind + SUB[g] + '</th>';
    });
    tbl.innerHTML = head + '</tr></thead>';
    var tb = mk('tbody');
    NAMES.forEach(function (nm, i) {
      var tr = mk('tr');
      var th = mk('th', '', '第 ' + (i + 1) + ' 期<small>選了 ' + nm + '</small>');
      th.scope = 'row';
      tr.appendChild(th);
      var row = { p: [], x: [] };
      ['p', 'x'].forEach(function (kind) {
        for (var g = 0; g < 3; g++) {
          var td = mk('td', 'g' + g + ' k-' + kind);
          var inp = mk('input');
          inp.type = 'number'; inp.min = '0'; inp.step = 'any';
          inp.setAttribute('inputmode', 'decimal');
          inp.setAttribute('aria-label', '第 ' + (i + 1) + ' 期的' + (kind === 'p' ? '價格 p' : '數量 x') + (g + 1));
          inp.addEventListener('input', function () { markPreset(-1); compute(); });
          td.appendChild(inp);
          tr.appendChild(td);
          row[kind].push(inp);
        }
      });
      inputs.push(row);
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    var wrap = mk('div', 'rp-in-wrap');
    wrap.appendChild(tbl);

    function markPreset(k) {
      presetBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === k ? 'true' : 'false'); });
    }
    function load(k) {
      var ps = cfg.presets[k];
      goods = ps.obs[0].p.length === 2 ? 2 : 3;
      node.classList.toggle('two-goods', goods === 2);
      tbl.querySelector('.h-p').colSpan = goods;
      tbl.querySelector('.h-x').colSpan = goods;
      ps.obs.forEach(function (o, i) {
        for (var g = 0; g < 3; g++) {
          inputs[i].p[g].value = g < goods ? o.p[g] : 0;
          inputs[i].x[g].value = g < goods ? o.x[g] : 0;
        }
      });
      markPreset(k);
      compute();
    }
    (cfg.presets || []).forEach(function (ps, k) {
      var b = mk('button', 'btn');
      b.type = 'button';
      b.textContent = ps.label;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { load(k); });
      presetBtns.push(b);
      bar.appendChild(b);
    });

    function num(v) { return String(Math.round(v * 100) / 100).replace('-', '−'); }
    function vec(arr) { return '(' + arr.map(num).join(', ') + ')'; }
    function rel(i, j, kind) { return '<b class="rp-rel">' + NAMES[i] + ' ≻<sub>' + kind + '</sub> ' + NAMES[j] + '</b>'; }

    function compute() {
      var P = [], Q = [], okInput = true;
      inputs.forEach(function (row, i) {
        P[i] = []; Q[i] = [];
        for (var g = 0; g < goods; g++) {
          var pv = parseFloat(row.p[g].value), xv = parseFloat(row.x[g].value);
          if (!(pv >= 0) || !(xv >= 0)) okInput = false;
          P[i].push(pv); Q[i].push(xv);
        }
      });
      if (!okInput) {
        out.innerHTML = '<p class="rp-warn">每一格都要填 0 以上的數字，填好就會自動重算。</p>';
        return;
      }
      var n = 3, i, j, k;
      // cost[i][j]：用第 i 期的價格買第 j 期選的組合要花多少
      var cost = [];
      for (i = 0; i < n; i++) {
        cost[i] = [];
        for (j = 0; j < n; j++) {
          var sum = 0;
          for (k = 0; k < goods; k++) sum += P[i][k] * Q[j][k];
          cost[i][j] = sum;
        }
      }
      function same(u, w) { return Q[u].every(function (v, g) { return v === Q[w][g]; }); }
      // D[i][j]：i 直接顯示偏好於 j（第 i 期買得起 j 卻選了 i）
      var D = [], R = [];
      for (i = 0; i < n; i++) {
        D[i] = []; R[i] = [];
        for (j = 0; j < n; j++) {
          D[i][j] = i !== j && !same(i, j) && cost[i][j] <= cost[i][i] + 1e-9;
          R[i][j] = D[i][j];
        }
      }
      // 遞移：R 是「直接或間接」
      for (k = 0; k < n; k++) for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (R[i][k] && R[k][j] && i !== j && !same(i, j)) R[i][j] = true;
      var indirect = [];
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        if (i === j || same(i, j)) continue;
        for (k = 0; k < n; k++) if (k !== i && k !== j && D[i][k] && D[k][j]) indirect.push([i, k, j]);
      }
      var warp = [], sarp = [];
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        if (D[i][j] && D[j][i]) warp.push([i, j]);
        if (R[i][j] && R[j][i]) sarp.push([i, j]);
      }

      var h = '<h4>① 花費表</h4><div class="tbl-wrap"><table class="tbl rp-tbl"><thead><tr><th>用哪一期的價格</th>';
      for (j = 0; j < n; j++) h += '<th class="n">買 ' + NAMES[j] + ' ' + vec(Q[j]) + '</th>';
      h += '</tr></thead><tbody>';
      for (i = 0; i < n; i++) {
        h += '<tr><th scope="row">第 ' + (i + 1) + ' 期 ' + vec(P[i]) + '</th>';
        for (j = 0; j < n; j++) {
          if (i === j) h += '<td class="n chosen">' + num(cost[i][j]) + '</td>';
          else if (D[i][j]) h += '<td class="n"><span class="circ">' + num(cost[i][j]) + '</span></td>';
          else h += '<td class="n no">' + num(cost[i][j]) + '</td>';
        }
        h += '</tr>';
      }
      h += '</tbody></table></div><p class="rp-key"><span class="chosen">紅字</span>＝那一期實際選的組合（實際花費）　<span class="circ">圈起來</span>＝買得起卻沒選　<span class="no">灰字</span>＝買不起，無法比較</p>';

      h += '<div class="rp-cols"><div><h4>② 顯示性偏好關係</h4>';
      var any = false, items = '';
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (D[i][j]) {
        any = true;
        items += '<li>' + rel(i, j, 'D') + '：第 ' + (i + 1) + ' 期花 ' + num(cost[i][i]) + ' 選了 ' + NAMES[i] + '，當時 ' + NAMES[j] + ' 只要 ' + num(cost[i][j]) + '，買得起卻沒選。</li>';
      }
      h += any ? '<p class="rp-sub">直接（Direct）</p><ul>' + items + '</ul>' : '<p>沒有任何直接顯示性偏好：每一期都買不起另外兩個組合，資料沒有透露誰比較好。</p>';
      if (indirect.length) {
        h += '<p class="rp-sub">間接（Indirect，靠遞移性）</p><ul>';
        indirect.forEach(function (t) {
          h += '<li>' + rel(t[0], t[2], 'I') + '：因為 ' + NAMES[t[0]] + ' ≻<sub>D</sub> ' + NAMES[t[1]] + ' 且 ' + NAMES[t[1]] + ' ≻<sub>D</sub> ' + NAMES[t[2]] + '。</li>';
        });
        h += '</ul>';
      } else if (any) {
        h += '<p class="rp-sub">間接（Indirect）</p><p>沒有可以用遞移性串起來的關係。</p>';
      }
      h += '</div><div>';

      // 關係圖：箭頭 A → B 代表 A 直接顯示偏好於 B；紅色代表反方向也成立（矛盾）
      var pos = [[150, 40], [258, 196], [42, 196]];
      var svg = '<svg class="rp-graph" viewBox="0 0 300 236" role="img" aria-label="顯示性偏好關係圖">';
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (D[i][j]) {
        var dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1];
        var len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
        var ox = -uy * 9, oy = ux * 9;
        var sx = pos[i][0] + ux * 32 + ox, sy = pos[i][1] + uy * 32 + oy;
        var ex = pos[j][0] - ux * 32 + ox, ey = pos[j][1] - uy * 32 + oy;
        var bx = ex - ux * 12, by = ey - uy * 12;
        svg += '<g class="' + (R[j][i] ? 'bad' : 'ok') + '"><line x1="' + r1(sx) + '" y1="' + r1(sy) + '" x2="' + r1(bx) + '" y2="' + r1(by) + '"/><polygon points="' + r1(ex) + ',' + r1(ey) + ' ' + r1(bx - uy * 6) + ',' + r1(by + ux * 6) + ' ' + r1(bx + uy * 6) + ',' + r1(by - ux * 6) + '"/></g>';
      }
      for (i = 0; i < n; i++) svg += '<circle class="node" cx="' + pos[i][0] + '" cy="' + pos[i][1] + '" r="25"/><text class="node-t" x="' + pos[i][0] + '" y="' + (pos[i][1] + 7) + '" text-anchor="middle">' + NAMES[i] + '</text>';
      svg += '</svg>';
      h += '<h4>③ 關係圖</h4>' + svg + '<p class="rp-key">箭頭 A → B 表示「A 直接顯示偏好於 B」。<span class="chosen">紅色箭頭</span>表示反方向（直接或間接）也成立，彼此矛盾。</p></div></div>';

      h += '<h4>④ 結論</h4><div class="rp-verdicts">';
      h += warp.length
        ? '<p class="rp-v bad"><b>WARP：違反 ✗</b>' + warp.map(function (pr) { return NAMES[pr[0]] + ' ≻<sub>D</sub> ' + NAMES[pr[1]] + '，同時 ' + NAMES[pr[1]] + ' ≻<sub>D</sub> ' + NAMES[pr[0]]; }).join('；') + '。兩個組合互相「直接」打敗對方。</p>'
        : '<p class="rp-v ok"><b>WARP：沒有違反 ✓</b>找不到「X ≻<sub>D</sub> Y 而且 Y ≻<sub>D</sub> X」的一對組合。</p>';
      h += sarp.length
        ? '<p class="rp-v bad"><b>SARP：違反 ✗</b>' + sarp.map(function (pr) { return NAMES[pr[0]] + ' 與 ' + NAMES[pr[1]]; }).join('、') + ' 互相被顯示（直接或間接）偏好於對方' + (warp.length ? '。違反 WARP 就一定違反 SARP。' : '，偏好繞成一圈，沒有任何行為良好的偏好可以解釋這些選擇。') + '</p>'
        : '<p class="rp-v ok"><b>SARP：沒有違反 ✓</b>把間接關係也算進來，還是沒有矛盾，存在行為良好的偏好可以解釋這些選擇。</p>';
      h += '</div>';
      out.innerHTML = h;
    }

    node.appendChild(bar);
    node.appendChild(wrap);
    node.appendChild(out);
    if (cfg.presets && cfg.presets.length) load(0); else compute();
  }

  /* ================= 7. 首頁元件 ================= */
  function buildHome() {
    var sg = document.getElementById('secGrid');
    if (sg) {
      var html = '';
      PAGES.filter(function (p) { return p.study; }).forEach(function (p) {
        var pr = p.probs ? '作業 ' + p.hw + '（' + p.probs.length + ' 題）' : '';
        html += '<a class="sec-card" data-id="' + p.id + '" data-probs="' + pr + '" href="' + p.file + '"><span class="num">' + esc(p.num) + '</span><span class="ttl">' + esc(p.title) + '</span><span class="meta"></span></a>';
      });
      sg.innerHTML = html;
    }
    var pg = document.getElementById('probGrid');
    if (pg) {
      var rows = '';
      PAGES.filter(function (p) { return p.probs; }).forEach(function (p) {
        rows += '<div class="prob-row"><span class="sec">' + esc(p.hw) + '<small>' + esc(p.num) + '</small></span><div class="chips">' + p.probs.map(function (n) {
          return '<a class="chip" data-prob="' + p.hw + '-' + n + '" href="' + p.file + '#q-' + p.hw + '-' + n + '">第 ' + n + ' 題</a>';
        }).join('') + '</div></div>';
      });
      pg.innerHTML = rows;
    }
    var rb = document.getElementById('resetProgress');
    if (rb) {
      rb.addEventListener('click', function () {
        if (!window.confirm('要把「已讀完」和「我會了」的標記全部清掉嗎？')) return;
        state = { pages: {}, probs: {} };
        saveState();
        refreshProgress();
      });
    }
  }

  /* ================= 8. 啟動 ================= */
  function renderMath() {
    if (typeof window.renderMathInElement !== 'function') return;
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }

  function jumpToHash() {
    if (!location.hash || location.hash.length < 2) return;
    var target = null;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { /* 壞掉的網址片段 */ }
    if (target) target.scrollIntoView();
  }

  function start() {
    buildChrome();
    buildToc();
    buildHome();
    document.querySelectorAll('.prob[data-prob]').forEach(initProb);
    document.querySelectorAll('.solution').forEach(initSolution);
    document.querySelectorAll('.quiz').forEach(initQuiz);
    document.querySelectorAll('.signline').forEach(initSignline);
    buildPageEnd();
    renderMath();
    document.querySelectorAll('.rptool').forEach(initRpTool);
    document.querySelectorAll('figure.fig').forEach(initFigure);
    refreshProgress();
    document.addEventListener('toggle', function (ev) {
      if (ev.target && ev.target.open && ev.target.querySelectorAll) redrawFigures(ev.target);
    }, true);
    jumpToHash();
    window.addEventListener('load', jumpToHash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
