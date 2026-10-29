/* HumanAPI Docs — progressive enhancement only.
   Copy buttons, lightweight syntax highlighting, sidebar active state. */
(function () {
  'use strict';

  /* ---------- 1. Copy buttons ---------- */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) { /* clipboard unavailable */ }
    document.body.removeChild(ta);
  }

  function flashButton(btn) {
    var label = btn.querySelector('.copy-label');
    var previous = label ? label.textContent : '';
    btn.classList.add('copied');
    if (label) label.textContent = '已复制';
    window.setTimeout(function () {
      btn.classList.remove('copied');
      if (label) label.textContent = previous;
    }, 1600);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.code-block'), function (block) {
    var btn = block.querySelector('.copy-btn');
    var code = block.querySelector('pre code');
    if (!btn || !code) return;
    btn.addEventListener('click', function () {
      var text = code.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          flashButton(btn);
        }, function () {
          fallbackCopy(text);
          flashButton(btn);
        });
      } else {
        fallbackCopy(text);
        flashButton(btn);
      }
    });
  });

  /* ---------- 2. Lightweight syntax highlighting ---------- */
  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  var JSON_RE = /("(?:[^"\\\n]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)/g;

  function highlightJson(text) {
    return escapeHtml(text).replace(JSON_RE, function (match, str, colon, bool, num) {
      if (str && colon) return '<span class="tok-key">' + str + '</span>' + colon;
      if (str) return '<span class="tok-str">' + str + '</span>';
      if (bool) return '<span class="tok-bool">' + bool + '</span>';
      return '<span class="tok-num">' + num + '</span>';
    });
  }

  var JS_RE = /(\/\/[^\n]*)|(`(?:[^`\\]|\\.)*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(const|let|var|await|async|function|return|new|if|else|import|from|export|try|catch|throw|typeof|of|in|for|while)\b|\b(\d+(?:\.\d+)?)\b/g;

  function highlightJs(text) {
    return escapeHtml(text).replace(JS_RE, function (match, comment, str, keyword, num) {
      if (comment) return '<span class="tok-comment">' + comment + '</span>';
      if (str) return '<span class="tok-str">' + str + '</span>';
      if (keyword) return '<span class="tok-kw">' + keyword + '</span>';
      return '<span class="tok-num">' + num + '</span>';
    });
  }

  var BASH_RE = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(npm|npx|git|cp|curl|docker|node|export|cd|wget|sudo|chmod)\b/g;

  function highlightBash(text) {
    return escapeHtml(text).replace(BASH_RE, function (match, comment, str, command) {
      if (comment) return '<span class="tok-comment">' + comment + '</span>';
      if (str) return '<span class="tok-str">' + str + '</span>';
      return '<span class="tok-kw">' + command + '</span>';
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('pre code[class*="lang-"]'), function (code) {
    var match = code.className.match(/lang-([a-z]+)/);
    if (!match) return;
    var highlighter = null;
    if (match[1] === 'json') highlighter = highlightJson;
    else if (match[1] === 'js') highlighter = highlightJs;
    else if (match[1] === 'bash') highlighter = highlightBash;
    if (!highlighter) return;
    try {
      code.innerHTML = highlighter(code.textContent);
    } catch (err) {
      /* keep the plain text if highlighting fails */
    }
  });

  /* ---------- 3. Sidebar active link (scroll-based, no IntersectionObserver) ---------- */
  var sidebar = document.querySelector('.doc-sidebar');
  if (sidebar) {
    var links = Array.prototype.slice.call(sidebar.querySelectorAll('.doc-nav a[href^="#"]'));
    var linkFor = {};
    var targets = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (target) {
        linkFor[id] = link;
        targets.push(target);
      }
    });

    if (targets.length > 0) {
      var setActive = function (id) {
        links.forEach(function (link) { link.classList.remove('active'); });
        if (id && linkFor[id]) linkFor[id].classList.add('active');
      };

      var currentSection = function () {
        var offset = 140; // sticky header + breathing room
        var best = null;
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].getBoundingClientRect().top - offset <= 0) {
            best = targets[i].id;
          }
        }
        if (!best) {
          // Top of the page: highlight the first section.
          if (window.scrollY <= 4) return targets[0].id;
          // Bottom of the page: highlight the last section.
          var atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
          if (atBottom) return targets[targets.length - 1].id;
        }
        return best;
      };

      var onScroll = function () { setActive(currentSection()); };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      window.addEventListener('hashchange', onScroll);
      onScroll();

      // Immediate feedback when a sidebar link is clicked (smooth scroll follows).
      links.forEach(function (link) {
        link.addEventListener('click', function () {
          setActive(link.getAttribute('href').slice(1));
        });
      });
    }
  }
})();
