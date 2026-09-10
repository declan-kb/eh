/* ============================================================
   Print binder — renders content.js as paged A4 sheets.
   ============================================================ */

(function () {
  'use strict';

  var C = window.BINDER_CONTENT;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // Every media block flattened to plain figures — no interaction on paper.
  function flatten(section) {
    var out = [];
    (section.media || []).forEach(function (b) {
      if (b.type === 'image') {
        out.push({ src: b.src, alt: b.alt, caption: b.caption, wide: true });
      } else if (b.type === 'figures') {
        b.items.forEach(function (it) { out.push(it); });
      } else if (b.type === 'compare') {
        out.push({ src: b.before.src, alt: b.before.alt, caption: b.before.tag });
        out.push({ src: b.after.src,  alt: b.after.alt,  caption: b.after.tag });
      } else if (b.type === 'highlight') {
        b.views.forEach(function (v) {
          out.push({ src: v.src, alt: v.alt, caption: v.note ? v.tag + ' — ' + v.note : v.tag });
        });
      } else if (b.type === 'iterations') {
        b.versions.forEach(function (v) {
          out.push({ src: v.src, alt: v.alt, caption: v.tag + ' — ' + v.note });
        });
      } else if (b.type === 'carousel') {
        b.items.forEach(function (it) {
          out.push({ src: it.src, alt: it.alt, caption: it.tag ? it.tag + ' — ' + (it.caption || '') : it.caption });
        });
      }
    });
    return out;
  }

  function figs(items) {
    if (!items.length) return '';
    var cols = items.length >= 5 ? 3 : 2;
    return '<div class="p-figs c' + cols + '">' + items.map(function (it) {
      return '<figure class="' + (it.wide ? 'wide' : '') + '">' +
        '<div class="box"><img src="' + esc(it.src) + '" alt="' + esc(it.alt) + '"></div>' +
        (it.caption ? '<figcaption>' + esc(it.caption) + '</figcaption>' : '') +
      '</figure>';
    }).join('') + '</div>';
  }

  function sheet(inner, cls) {
    return '<div class="sheet ' + (cls || '') + '">' + inner + '</div>';
  }

  function boot() {
    var t = C.team;
    document.title = t.number + ' ' + t.name + ' — ' + t.season + ' Technical Binder (print)';
    var root = document.documentElement;
    if (t.accent) root.style.setProperty('--accent', t.accent);

    var numbered = C.sections.map(function (s, i) {
      var c = Object.create(s); c.n = i + 1; return c;
    });

    var pages = [];

    // Cover — page 1
    pages.push(sheet(
      (t.logo ? '<img src="' + esc(t.logo) + '" alt="">' : '') +
      '<p class="kicker">Team ' + esc(t.number) + '</p>' +
      '<h1>' + esc(t.name) + '</h1>' +
      '<div class="rule"></div>' +
      '<p class="kicker">' + esc(t.season) + ' Technical Binder</p>' +
      '<p class="sub" style="margin-top:8mm">' + fmt(t.tagline) + '</p>', 'cover'));

    // Contents — page 2. Sections start on page 3.
    var toc = C.categories.map(function (cat) {
      var rows = numbered.filter(function (s) { return s.category === cat.id; }).map(function (s) {
        return '<div class="row"><span class="n">' + pad(s.n) + '</span>' +
               '<span>' + esc(s.title) + '</span><span class="d"></span>' +
               '<span class="pg">p' + (s.n + 2) + '</span></div>';
      }).join('');
      return rows ? '<div class="grp">' + esc(cat.label) + '</div>' + rows : '';
    }).join('');

    pages.push(sheet('<div class="p-toc"><h2>Contents</h2>' + toc + '</div>' +
      '<div class="p-foot"><span>' + esc(t.number) + ' · ' + esc(t.name) + '</span><span>p2</span></div>'));

    // One sheet per section
    numbered.forEach(function (s) {
      var cat = C.categories.find(function (c) { return c.id === s.category; });

      var feats = (s.features && s.features.length)
        ? '<div class="p-cols solo"><div><div class="p-lab">Features</div><ul class="p-feat">' +
            s.features.map(function (f) {
              var kids = (f.children && f.children.length)
                ? '<ul>' + f.children.map(function (k) { return '<li>' + fmt(k) + '</li>'; }).join('') + '</ul>' : '';
              return '<li>' + fmt(f.text) + kids + '</li>';
            }).join('') + '</ul></div></div>' : '';

      pages.push(sheet(
        '<div class="p-sec">' +
          '<p class="eyebrow">' + esc(cat ? cat.label : '') + ' · ' + pad(s.n) + '</p>' +
          '<h2>' + esc(s.title) + '.</h2>' +
          '<p class="thesis">' + fmt(s.thesis) + '</p>' +
          feats +
          figs(flatten(s)) +
        '</div>' +
        '<div class="p-foot"><span>' + esc(t.number) + ' · ' + esc(s.title) + '</span><span>p' + (s.n + 2) + '</span></div>'));
    });

    document.getElementById('stack').innerHTML = pages.join('');
    document.getElementById('meta').innerHTML =
      '<b>' + esc(t.number) + '</b> ' + esc(t.name) + ' — ' + esc(t.season) +
      ' Technical Binder · ' + pages.length + ' pages';
    document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
