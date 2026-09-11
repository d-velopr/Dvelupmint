/*
 * Dvelupmint site-wide nav search.
 * Vanilla JS, no jQuery. Safe to load on any page: no-ops if the markup is absent.
 * The index is inline on purpose - 21 entries do not justify a request, and a
 * fetch() would fail outright when the site is opened over file://.
 */
(function () {
  "use strict";

  var MAX_RESULTS = 6;

  var ENTRIES = [
    // ----- Projects -----
    { title: "AE-OC", subtitle: "AutomotiveEntOC.com", url: "https://automotiveentertainmentoc.com/", kind: "project", keywords: "automotive entertainment events orange county car show client site", external: true },
    { title: "Never Ending A&R", subtitle: "neverendingar.com", url: "https://neverending-ar.com/", kind: "project", keywords: "music label artists records a&r client site", external: true },
    { title: "L.A.U.R.A", subtitle: "laurala.org", url: "https://www.laurala.org/", kind: "project", keywords: "nonprofit charity foundation community los angeles client site", external: true },
    { title: "Online Store", subtitle: "slattson.com", url: "https://d-velopr.github.io/Slattson/", kind: "project", keywords: "shop store ecommerce retail cart merch client site", external: true },
    { title: "R.H.A.C.", subtitle: "rhacla.org", url: "https://d-velopr.github.io/RHAC/", kind: "project", keywords: "nonprofit advocacy support community client site", external: true },
    { title: "TG6", subtitle: "teamglitch6.com", url: "https://teamglitch6.com/", kind: "project", keywords: "team glitch6 streaming gaming agency client site", external: true },
    { title: "TG6-DEV", subtitle: "tg6-dev.com", url: "https://tg6-dev.com/", kind: "project", keywords: "digital services web design seo infrastructure security client site", external: true },
    { title: "NVOCC", subtitle: "meridiannvocc.app", url: "https://github.com/d-velopr/nvocc", kind: "project", keywords: "shipping logistics freight ocean carrier app repo code github", external: true },

    // ----- Packages -----
    { title: "Landing Page", subtitle: "One page, built to convert", url: "browse.html", kind: "package", keywords: "package pricing quote single page marketing", external: false },
    { title: "Basic", subtitle: "A small site, done properly", url: "browse.html", kind: "package", keywords: "package pricing quote starter simple small", external: false },
    { title: "Business", subtitle: "Multi-page site for a working business", url: "browse.html", kind: "package", keywords: "package pricing quote brochure multi page seo", external: false },
    { title: "Enterprise", subtitle: "Large build, custom scope", url: "browse.html", kind: "package", keywords: "package pricing quote custom large scale", external: false },
    { title: "E-Commerce", subtitle: "Online store with checkout", url: "browse.html", kind: "package", keywords: "package pricing quote shop store ecommerce cart checkout payments", external: false },
    { title: "Web Application", subtitle: "Custom app, not a template", url: "browse.html", kind: "package", keywords: "package pricing quote webapp software dashboard database login", external: false },

    // ----- Pages -----
    { title: "Home", subtitle: "Dvelupmint portfolio", url: "index.html", kind: "page", keywords: "index start homepage portfolio work", external: false },
    { title: "Browse", subtitle: "Packages and top projects", url: "browse.html", kind: "page", keywords: "packages pricing quote projects portfolio catalog", external: false },
    { title: "Analytics", subtitle: "Per-project analytics", url: "analytics.html", kind: "page", keywords: "analytics stats metrics traffic users launched status", external: false },
    { title: "Details", subtitle: "What you get, and live client sites", url: "details.html", kind: "page", keywords: "included services outcomes live client sites details what you get", external: false },
    { title: "Contact", subtitle: "Request a free quote", url: "contact.html", kind: "page", keywords: "quote contact form email hire get in touch social links", external: false },
    { title: "Privacy Policy", subtitle: "Your data and cookie choice", url: "privacy.html", kind: "page", keywords: "privacy policy cookies cookie settings analytics consent gdpr ccpa personal data information rights delete", external: false },
    { title: "Terms & Conditions", subtitle: "Prices, content and liability", url: "terms.html", kind: "page", keywords: "terms conditions terms of use legal warranty liability prices quotes estimates governing law", external: false }
  ];

  var NO_MATCH = { title: "No matches — get a free quote →", subtitle: "", url: "contact.html#quote", kind: "quote", keywords: "", external: false };

  // A match at the start of the field, or at the start of a word inside it,
  // outranks a match buried mid-word.
  function isPrefix(haystack, at) {
    if (at === 0) { return true; }
    return !/[a-z0-9]/.test(haystack.charAt(at - 1));
  }

  // Lower score = better. 0/1 = title hit, 2/3 = subtitle or keyword hit.
  function score(entry, q) {
    var at = entry.title.toLowerCase().indexOf(q);
    if (at !== -1) { return isPrefix(entry.title.toLowerCase(), at) ? 0 : 1; }
    var best = -1;
    ["subtitle", "keywords"].forEach(function (field) {
      var hay = (entry[field] || "").toLowerCase();
      var i = hay.indexOf(q);
      if (i === -1) { return; }
      var s = isPrefix(hay, i) ? 2 : 3;
      if (best === -1 || s < best) { best = s; }
    });
    return best;
  }

  function search(q) {
    var scored = [];
    ENTRIES.forEach(function (entry, i) {
      var s = score(entry, q);
      if (s !== -1) { scored.push({ entry: entry, s: s, i: i }); }
    });
    scored.sort(function (a, b) { return a.s - b.s || a.i - b.i; });
    return scored.slice(0, MAX_RESULTS).map(function (r) { return r.entry; });
  }

  function init() {
    var form = document.getElementById("search");
    var input = document.getElementById("searchText");
    var list = document.getElementById("searchResults");
    if (!form || !input || !list) { return; }

    var results = [];
    var active = -1;

    function close() {
      list.hidden = true;
      list.innerHTML = "";
      results = [];
      active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function highlight(next) {
      var rows = list.children;
      if (!rows.length) { return; }
      if (active >= 0 && rows[active]) {
        rows[active].classList.remove("is-active");
        rows[active].setAttribute("aria-selected", "false");
      }
      active = next;
      if (active >= 0 && rows[active]) {
        rows[active].classList.add("is-active");
        rows[active].setAttribute("aria-selected", "true");
        input.setAttribute("aria-activedescendant", rows[active].id);
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function go(entry) {
      if (!entry) { return; }
      if (entry.external) {
        window.open(entry.url, "_blank", "noopener,noreferrer");
        close();
      } else {
        window.location.href = entry.url;
      }
    }

    function row(entry, i) {
      var a = document.createElement("a");
      a.className = "site-search-row" + (entry.kind === "quote" ? " is-quote" : "");
      a.id = "site-search-opt-" + i;
      a.setAttribute("role", "option");
      a.setAttribute("aria-selected", "false");
      a.href = entry.url;
      if (entry.external) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }

      var main = document.createElement("span");
      main.className = "site-search-main";

      var title = document.createElement("span");
      title.className = "site-search-title";
      title.textContent = entry.title;
      main.appendChild(title);

      if (entry.subtitle) {
        var sub = document.createElement("span");
        sub.className = "site-search-sub";
        sub.textContent = entry.subtitle;
        main.appendChild(sub);
      }
      a.appendChild(main);

      if (entry.kind !== "quote") {
        var kind = document.createElement("span");
        kind.className = "site-search-kind";
        kind.textContent = entry.kind;
        a.appendChild(kind);
      }
      if (entry.external) {
        var ext = document.createElement("span");
        ext.className = "site-search-ext";
        ext.setAttribute("aria-hidden", "true");
        ext.textContent = "↗";
        a.appendChild(ext);
        // Screen readers get the same information as the arrow conveys.
        var sr = document.createElement("span");
        sr.className = "site-search-sr";
        sr.textContent = " (opens in a new tab)";
        a.appendChild(sr);
      }

      a.addEventListener("mousemove", function () { highlight(i); });
      a.addEventListener("click", function (e) {
        e.preventDefault();
        go(entry);
      });
      return a;
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      if (!q) { close(); return; }

      results = search(q);
      if (!results.length) { results = [NO_MATCH]; }

      list.innerHTML = "";
      active = -1;
      results.forEach(function (entry, i) { list.appendChild(row(entry, i)); });
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      input.removeAttribute("aria-activedescendant");
    }

    input.addEventListener("input", render);

    input.addEventListener("focus", function () {
      if (input.value.trim() && list.hidden) { render(); }
    });

    input.addEventListener("keydown", function (e) {
      var open = !list.hidden && results.length > 0;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) { render(); return; }
        highlight(active + 1 >= results.length ? 0 : active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) { return; }
        highlight(active - 1 < 0 ? results.length - 1 : active - 1);
      } else if (e.key === "Enter") {
        // The form must never submit; Enter opens the highlighted row, or the top hit.
        e.preventDefault();
        if (open) { go(results[active >= 0 ? active : 0]); }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
        input.focus();
      }
    });

    form.addEventListener("submit", function (e) { e.preventDefault(); });

    document.addEventListener("click", function (e) {
      if (!form.contains(e.target) && !list.contains(e.target)) { close(); }
    });

    close();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
