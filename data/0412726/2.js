// ============================================================
// OWL BOT - OPTIMIZED (SAFE VERSION - NO LOGIC CHANGE)
// ============================================================

// ========================
// GLOBALS
// ========================
const owl_data = [];
let message = [];
let username = "mysticriddlehurricane";
let comment = "";

// Action state
let clickonce = false;
let sent_once = false;
let isProceeding = false;
let isWorking = false;
let clickPerActionCount = 0;
let clickPerActionTarget = 0;
let countSelect = 0;

// Breaker
let breakerTimeout = null;
const BREAKER_CONFIG = "breaker_config";
const BREAKER_STATE = "breaker_state";
const BREAKER_STOP = "breaker_stop";

// Storage
const STORAGE_KEY = "myExtensionData";

// Observers
let mainObserver = null;
let commentObserver = null;
let restrictObserver = null;
let debounceTimer = null;

// Countdown
let countdownInterval = null;
let version = "0.2";

// ========================
// CACHE SELECTORS
// ========================
const $mints = $('[mints]');
const $time = $('[time]');
const $manypost = $('[manypost]');
const $loops = $('[loops]');
const $comments = $('[comments]');
const $refresh = $('[refresh_status]');
const $remaining = $('[manypost_remaining]');

// ========================
// FAST ID GENERATOR
// ========================
function generateID(length = 15) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[(Math.random() * chars.length) | 0];
  }
  return result;
}

// ========================
// RESET FLAGS (NEW)
// ========================
function resetFlags() {
  clickonce = false;
  isProceeding = false;
  isWorking = false;
}

// ========================
// TIMER WORKER
// ========================
const workerBlob = new Blob([`
  self.onmessage = function(e) {
    const { id, ms } = e.data;
    setTimeout(function() { self.postMessage({ id: id }); }, ms);
  };
`], { type: "application/javascript" });

const timerWorker = new Worker(URL.createObjectURL(workerBlob));
const pendingTimers = {};

timerWorker.onmessage = function(e) {
  const { id } = e.data;
  if (pendingTimers[id]) {
    pendingTimers[id]();
    delete pendingTimers[id];
  }
};

function wait(ms) {
  return new Promise(resolve => {
    const id = generateID();
    pendingTimers[id] = resolve;
    timerWorker.postMessage({ id, ms });
  });
}

// ========================
// SETTINGS
// ========================
function saveData() {
  const data = {
    mints: $mints.val(),
    time: $time.val(),
    manypost: $manypost.val(),
    loops: $loops.val(),
    comments: $comments.val(),
    refresh_status: $refresh.is(':checked')
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  $mints.val(data.mints || '');
  $time.val(data.time || '');
  $manypost.val(data.manypost || '');
  $loops.val(data.loops || '');
  $comments.val(data.comments || '');
  $refresh.prop('checked', data.refresh_status || false);
}

let saveTimeout;
function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveData, 300);
}

$(document).on('input change', '[mints],[time],[manypost],[loops],[comments],[refresh_status]', autoSave);
loadData();

// ========================
// HELPERS
// ========================
function timerConverter_mil({ status, timer }) {
  const map = { hrs: 3600000, mins: 60000, sec: 1000 };
  return (map[status] || 0) * Number(timer);
}

// ========================
// IMAGE HANDLING (FIXED)
// ========================
function getAvatar(imgEl) {
  if (!imgEl) return "";
  if (imgEl.currentSrc) return imgEl.currentSrc.replace(/\.pnj/g, ".png");

  const srcset = imgEl.getAttribute("srcset");
  if (srcset) {
    const match = srcset.split(",").pop().match(/https:[^ ]+/);
    if (match) return match[0].replace(/\.pnj/g, ".png");
  }
  return (imgEl.getAttribute("src") || "").replace(/\.pnj/g, ".png");
}

function waitForImage(imgEl, callback, retries = 15) {
  if (!imgEl) return callback("");

  const interval = setInterval(() => {
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      clearInterval(interval);
      callback(getAvatar(imgEl));
    } else if (--retries <= 0) {
      clearInterval(interval);
      callback(getAvatar(imgEl));
    }
  }, 300);
}

// ========================
// ARTICLES (OPTIMIZED)
// ========================
function articles_gen() {
  const existingIDs = new Set(owl_data.map(x => x.owl_gen));

  document.querySelectorAll("article:not([owl_gen])").forEach(article => {
    const genID = generateID();
    article.setAttribute("owl_gen", genID);

    if (existingIDs.has(genID)) return;

    const commentBtn = article.querySelector('button[aria-label="Comment"]');
    let comID = null;

    if (commentBtn) {
      comID = generateID();
      commentBtn.setAttribute("owl_coms", comID);
    }

    const userEl = article.querySelector('a[rel="author"]');
    const uname = userEl ? userEl.textContent.trim() : "unknown";
    const imgEl = article.querySelector('figure[aria-label="Avatar"] img');

    waitForImage(imgEl, img => {
      owl_data.push({
        owl_username: uname,
        owl_img: img,
        owl_gen: genID,
        owl_coms: comID,
        timestamp: Date.now()
      });
    });
  });
}

// ========================
// COMMENT RANDOMIZER (OPTIMIZED)
// ========================
let cachedComments = [];

function parseComments(text) {
  const matches = text.match(/\[(.*?)\]/g);
  cachedComments = matches
    ? matches.map(x => x.replace(/[\[\]]/g, '').trim())
    : [];
}

function getRandomComment() {
  if (!cachedComments.length) return "";
  return cachedComments[(Math.random() * cachedComments.length) | 0];
}

// ========================
// SAFE CLICK
// ========================
function safeClick(selector) {
  const el = document.querySelector(selector);
  if (el) el.click();
}

// ========================
// MAIN CLICK FLOW FIXES
// ========================
$(document).on("click", "[openthis]", function () {
  if (clickonce) return;
  clickonce = true;

  try {
    delayOppner(1);

    waitForCommentBox(box => {
      waitForMessage(msg => {

        const isDuplicate = msg.some(x =>
          (window._allComments || []).includes(x.comment.trim().toLowerCase())
        );

        if (isDuplicate) {
          safeClick("[owl_clsoe_com]");
          resetFlags();
          setTimeout(() => triggerNext("duplicate skip"), 2000);
          return;
        }

        const freshComment = getRandomComment();
        setTextareaValue(box, freshComment);

        setTimeout(() => {
          clickPerActionCount++;

          const remaining = clickPerActionTarget - clickPerActionCount;
          $remaining.val(remaining >= 0 ? remaining : 0);

          if (!sent_once) {
            sent_once = true;
            safeClick("[owl_sent]");
            setTimeout(() => sent_once = false, 600);
          }

          resetFlags();
          triggerNext("success");

        }, 500);

      });
    });

  } catch (e) {
    console.error("Error:", e);
    resetFlags();
  }
});

// ========================
// START BUTTON
// ========================
$(document).on("click", "[starts]", function () {

  countSelect = 0;
  clickPerActionCount = 0;
  resetFlags();
  sent_once = false;

  const cfg = {
    mints: $mints.val(),
    time: $time.val(),
    manypost: $manypost.val(),
    loops: $loops.val(),
    comments: $comments.val(),
    refresh_status: $refresh.is(':checked')
  };

  parseComments(cfg.comments);

  window._allComments = cachedComments.map(x => x.toLowerCase());

  $remaining.val(Number(cfg.manypost));

  breakerSet(
    timerConverter_mil({ status: cfg.mints, timer: cfg.time }),
    Number(cfg.loops),
    cfg.refresh_status
  );

  clickPerAction(cfg.manypost);
});

// ========================
// STOP BUTTON
// ========================
$(document).on("click", "[stopoperation]", function () {
  breakerStop();
  fullStop();
});
