/*
 * Dvelupmint cookie consent + Google Analytics loader.
 * Load synchronously in <head>, before anything else. ES5, no dependencies.
 * Basic Consent Mode: gtag.js is not requested at all until the visitor
 * accepts. Accept grants analytics_storage only; ad_* stay denied.
 * Bump ?v= on every page that loads this file whenever it changes.
 */
(function () {
  "use strict";

  var GA_ID = "G-HYSG6VK205";
  var STORE_KEY = "dvm.consent";
  var CONSENT_VERSION = 1;
  var MAX_AGE_DAYS = 365;
  var DISABLE_KEY = "ga-disable-" + GA_ID;

  var w = window, doc = document;
  var gaLoaded = false, current = "denied", banner = null, opener = null;

  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  function read() {
    var s;
    try { s = JSON.parse(w.localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
    if (!s || s.v !== CONSENT_VERSION || typeof s.ts !== "number") return null;
    if (s.analytics !== "granted" && s.analytics !== "denied") return null;
    var age = new Date().getTime() - s.ts;
    return age >= 0 && age < MAX_AGE_DAYS * 864e5 ? s : null;
  }

  function write(value) {
    try {
      w.localStorage.setItem(STORE_KEY, JSON.stringify({ v: CONSENT_VERSION, analytics: value, ts: new Date().getTime() }));
    } catch (e) { /* storage blocked: the choice holds for this page only */ }
  }

  function loadGA() {
    w[DISABLE_KEY] = false;
    if (gaLoaded) return;
    gaLoaded = true;
    var s = doc.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    doc.head.appendChild(s);
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  }

  function grant() {
    current = "granted";
    w.gtag("consent", "update", { analytics_storage: "granted" });
    loadGA();
  }

  function deny() {
    current = "denied";
    w[DISABLE_KEY] = true;
  }

  function clearGaCookies() {
    var host = w.location.hostname;
    var domains = ["", host, "." + host, ".dvelupmint.com"];
    var names = doc.cookie.split(";");
    for (var i = 0; i < names.length; i++) {
      var name = names[i].split("=")[0].replace(/^\s+|\s+$/g, "");
      if (name.indexOf("_ga") !== 0) continue;
      for (var j = 0; j < domains.length; j++) {
        doc.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (domains[j] ? "; domain=" + domains[j] : "");
      }
    }
  }

  function accept() { write("granted"); grant(); hide(); }

  function reject() {
    write("denied");
    deny();
    w.gtag("consent", "update", { analytics_storage: "denied" });
    clearGaCookies();
    hide();
  }

  function build() {
    if (banner) return banner;
    banner = doc.createElement("div");
    banner.id = "dvm-consent";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.hidden = true;
    banner.innerHTML =
      '<div class="dvm-consent__inner">' +
        '<div class="dvm-consent__copy">' +
          '<p class="dvm-consent__text">I\'d like to use Google Analytics cookies to count visits and see which pages get read. ' +
          'They stay off unless you accept. <a href="privacy.html">Privacy Policy</a></p>' +
          '<p class="dvm-consent__status" hidden></p>' +
        '</div>' +
        '<div class="dvm-consent__actions">' +
          '<button type="button" class="dvm-consent__btn" data-consent="accept">Accept</button>' +
          '<button type="button" class="dvm-consent__btn" data-consent="reject">Reject</button>' +
        '</div>' +
      '</div>';
    banner.addEventListener("click", function (e) {
      var kind = e.target && e.target.getAttribute && e.target.getAttribute("data-consent");
      if (kind === "accept") accept();
      else if (kind === "reject") reject();
    });
    // First in the DOM so keyboard and screen-reader users reach it first;
    // CSS pins it to the bottom of the viewport.
    doc.body.insertBefore(banner, doc.body.firstChild);
    return banner;
  }

  function show(withStatus) {
    var b = build();
    var status = b.querySelector(".dvm-consent__status");
    status.textContent = "Analytics: " + (current === "granted" ? "on" : "off");
    status.hidden = !withStatus;
    b.hidden = false;
  }

  function hide() {
    if (banner) banner.hidden = true;
    if (opener && doc.body.contains(opener)) opener.focus();
    opener = null;
  }

  function open() {
    show(true);
    banner.querySelector(".dvm-consent__btn").focus();
  }

  function getState() {
    var s = read();
    return {
      analytics: current,
      stored: s ? s.analytics : null,
      gpc: navigator.globalPrivacyControl === true,
      gaLoaded: gaLoaded
    };
  }

  doc.addEventListener("click", function (e) {
    var el = e.target;
    while (el && el.nodeType === 1) {
      if (el.hasAttribute("data-consent-open")) {
        e.preventDefault();
        opener = el;
        open();
        return;
      }
      el = el.parentNode;
    }
  });

  w.dvmConsent = { open: open, getState: getState };

  var stored = read();
  if (stored && stored.analytics === "granted") {
    grant();
  } else if (stored || navigator.globalPrivacyControl === true) {
    deny(); // explicit Reject, or GPC with no stored choice (GPC is never stored)
  } else if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () { show(false); });
  } else {
    show(false);
  }
})();
