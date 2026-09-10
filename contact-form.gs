/**
 * Dvelupmint — contact / quote-request backend
 * =============================================================================
 * Receives the form on contact.html and appends one timestamped row per request
 * to a Google Sheet.
 *
 * DEPLOY (once, ~3 minutes)
 * -----------------------------------------------------------------------------
 *  1. Create a new Google Sheet. Name it something you will recognise, e.g.
 *     "Dvelupmint — Quote Requests". The tab name does not matter; this script
 *     creates its own tab (see SHEET_NAME below) and writes the header row.
 *  2. In that Sheet: Extensions > Apps Script. Delete the stub Code.gs contents.
 *  3. Paste this entire file in and save (the project is now bound to the Sheet,
 *     which is why no Sheet ID is hard-coded anywhere below).
 *  4. Deploy > New deployment > gear icon > Web app.
 *       Description:  Dvelupmint contact form
 *       Execute as:   Me  (your Google account — it needs to write the Sheet)
 *       Who has access: Anyone
 *     Deploy, then approve the permission prompt. Google will warn that the app
 *     is unverified — that is expected for your own script; continue.
 *  5. Copy the Web app URL it gives you. It ends in /exec, like:
 *       https://script.google.com/macros/s/AKfycbx..................vQ/exec
 *  6. Open contact.html and replace REPLACE_ME_APPS_SCRIPT_URL with that URL,
 *     keeping the quotes. That is the only edit — one line.
 *  7. Load contact.html, submit a test request, confirm the row lands in the Sheet.
 *
 * AFTER ANY EDIT to this script: Deploy > Manage deployments > edit (pencil) >
 * Version: New version > Deploy. Editing without redeploying changes nothing —
 * the /exec URL keeps serving the old version. The URL itself does not change.
 *
 * NOTE ON THE PAGE'S FETCH
 * -----------------------------------------------------------------------------
 * contact.html posts with mode:"no-cors" and a text/plain body, because an Apps
 * Script web app cannot answer a CORS preflight. The body therefore arrives as
 * a JSON string in e.postData.contents (doPost below also accepts ordinary form
 * parameters, so a plain HTML form post still works). The browser cannot read
 * the response, so the Sheet — and the execution log — are the real proof a
 * submission landed.
 *
 * View the log: Apps Script editor > Executions.
 * =============================================================================
 */

/** Tab this script writes to. Created automatically if it does not exist. */
var SHEET_NAME = 'Quote Requests';

/** Column order. Changing this changes the header row on the next fresh tab. */
var HEADERS = [
  'Timestamp',
  'Name',
  'Email',
  'Project Type',
  'Budget',
  'Message',
  'Submitted From',
  'Client Timestamp'
];

/**
 * Handles the form post from contact.html.
 */
function doPost(e) {
  try {
    var data = parseRequest_(e);

    // A request with neither an email nor a message is not a lead — it is a
    // scraper hitting the /exec URL directly. Reject rather than log a blank row.
    if (!data.email && !data.message) {
      return jsonResponse_({ status: 'error', message: 'Empty submission.' });
    }

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.projectType,
      data.budget,
      data.message,
      data.page,
      data.submittedAt
    ]);

    // Shows up under Executions in the editor, which is the only place to see
    // what happened when the browser gets an opaque response.
    console.log('Quote request appended: ' + data.email + ' / ' + data.projectType);

    return jsonResponse_({ status: 'ok' });
  } catch (err) {
    console.error('doPost failed: ' + err);
    return jsonResponse_({ status: 'error', message: String(err) });
  }
}

/**
 * Health check. Opening the /exec URL in a browser should show {"status":"ok"} —
 * that is the fastest way to confirm the deployment is live and public before
 * pasting the URL into contact.html.
 */
function doGet() {
  return jsonResponse_({ status: 'ok', service: 'Dvelupmint contact form' });
}

/**
 * Accepts either a JSON body (what contact.html sends) or ordinary form
 * parameters, so the endpoint keeps working if the page ever switches to a
 * plain form post.
 */
function parseRequest_(e) {
  var raw = {};

  if (e && e.postData && e.postData.contents) {
    try {
      raw = JSON.parse(e.postData.contents) || {};
    } catch (ignored) {
      raw = {};
    }
  }

  if (!raw.email && e && e.parameter) {
    raw = e.parameter;
  }

  return {
    name: clean_(raw.name),
    email: clean_(raw.email),
    projectType: clean_(raw.projectType),
    budget: clean_(raw.budget),
    message: clean_(raw.message),
    page: clean_(raw.page),
    submittedAt: clean_(raw.submittedAt)
  };
}

/**
 * Trims, caps length, and strips a leading =, +, - or @ so a submitted value
 * can never be evaluated as a formula when the Sheet is opened.
 */
function clean_(value) {
  if (value === null || value === undefined) return '';
  var text = String(value).trim();
  if (text.length > 5000) text = text.substring(0, 5000);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

/**
 * Returns the target tab, creating it with a frozen header row the first time.
 */
function getSheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
