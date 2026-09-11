/*
 * Close button for the sticky "Free Quote" button. Load synchronously right
 * after its markup so a button closed earlier in the visit never flashes on.
 * Closing it hides it for the rest of the browser session (sessionStorage).
 * ES5, no dependencies.
 */
(function () {
  "use strict";

  var KEY = "dvm.quote.hidden";
  var fab = document.getElementById("dvm-quote-fab");
  if (!fab) return;

  try {
    if (window.sessionStorage.getItem(KEY) === "1") { fab.hidden = true; return; }
  } catch (e) { /* storage blocked: the button shows on every page */ }

  fab.querySelector(".dvm-quote-fab__close").addEventListener("click", function () {
    fab.hidden = true;
    try { window.sessionStorage.setItem(KEY, "1"); } catch (e) { /* hidden on this page only */ }
  });
})();
