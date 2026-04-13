// ========================
// GLOBALS
// ========================
const owl_data = [];
let message    = [];
let username   = "mysticriddlehurricane";
let comment    = "";

// Action state
let clickonce            = false;
let sent_once            = false;
let isProceeding         = false;
let isWorking            = false;
let clickPerActionCount  = 0;
let clickPerActionTarget = 0;
let countSelect          = 0;

// Breaker
let breakerTimeout = null;
const BREAKER_CONFIG = "breaker_config";
const BREAKER_STATE  = "breaker_state";
const BREAKER_STOP   = "breaker_stop";

// Settings storage
const STORAGE_KEY = "myExtensionData";

// Observers
let mainObserver      = null;
let commentObserver   = null;
let restrictObserver  = null;
let debounceTimer     = null;

// Countdown
let countdownInterval = null;
let version = "0.1"


// ========================
// WEB WORKER TIMER (background-safe)
// Prevents browser throttling when tab is inactive
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
// WEB WORKER COUNTDOWN (background-safe)
// ========================
const countdownWorkerBlob = new Blob([`
  var interval = null;
  self.onmessage = function(e) {
    if (e.data === 'stop') {
      clearInterval(interval);
      interval = null;
      return;
    }
    if (e.data === 'start') {
      clearInterval(interval);
      interval = setInterval(function() { self.postMessage('tick'); }, 1000);
    }
  };
`], { type: "application/javascript" });

const countdownWorker = new Worker(URL.createObjectURL(countdownWorkerBlob));


// ========================
// UI INJECT
// ========================
$("body").append(`
  <div style="position:fixed;bottom:20%;right:0%;padding:10px;border-radius:8px;z-index:9999;display:flex;flex-flow:column;align-items:end;">

    <div mainBox style="
      z-index:9999;
      width:100%;
      display:flex;
      justify-content: space-between;
      flex-flow:row;
      align-items: end;
    ">
      <div style="background:#10002bff; border: 1px solid white; border-bottom: none; padding:10px; color:#fff;">
        <span time_hr>00</span>:<span time_min>00</span>:<span time_sec>00</span>
      </div>

      <div>
          <div id="" style="padding:8px; font-size:9px; background:#7b2cbfff;color:#fff;border:none;cursor:pointer;">
         V ${version}
          </div>
      </div>
    </div>

    <div mainBox style="width:210px;background:#10002bff;padding:15px;border:1px solid white;border-radius:0px 0px 12px 12px;font-family:sans-serif;color:#fff;">

      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#c77dffff;">Break</label><br>
        <select mints style="width:100%;padding:5px;background:#240046ff;color:#fff;border:none;border-radius:6px;margin-top:5px;">
          <option value="hrs">hrs</option>
          <option value="mins">mins</option>
          <option value="sec">sec</option>
        </select>
        <input type="number" time placeholder="Enter value"
          style="width:100%;margin-top:5px;padding:5px;background:#3c096cff;color:#fff;border:none;border-radius:6px;">
      </div>

      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#c77dffff;">Post Count</label><br>
        <input type="number" manypost placeholder="How many posts"
          style="width:100%;margin-top:5px;padding:5px;background:#3c096cff;color:#fff;border:none;border-radius:6px;">
      </div>

      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#c77dffff;">Loop</label><br>
        <input type="number" loops placeholder="How many Loops"
          style="width:100%;margin-top:5px;padding:5px;background:#3c096cff;color:#fff;border:none;border-radius:6px;">
      </div>

      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#c77dffff;">Comment</label><br>
        <textarea comments placeholder="Write comment..."
          style="width:100%;margin-top:5px;height:130px;font-size:13px;padding:5px;background:#3c096cff;color:#fff;border:none;border-radius:6px;resize:vertical;"></textarea>
      </div>

      <div style="margin-bottom:10px;font-size:12px;">
        <span style="color:#c77dffff;">Refresh</span>
        <input refresh_status type="checkbox" style="margin-left:5px;">
      </div>

      <div style="width:100%; padding:10px;display:flex;justify-content:center;flex-direction:row;align-items:center;gap:5px;">
        <button starts style="flex:1;padding:8px;background:#7b2cbf;border:none;border-radius:8px;color:#fff;font-weight:bold;cursor:pointer;">START</button>
        <button stopoperation style="flex:1; width:40%;padding:8px;background:red;border:none;border-radius:8px;color:#fff;font-weight:bold;cursor:pointer;">STOP</button>
      </div>

    </div>

    <button openthis style="position:fixed;left:-400%;">open</button>
  </div>
`);

$(document).on("click", "#menuBtn", () => $("[mainBox]").toggle());


// ========================
// SETTINGS: SAVE / LOAD
// ========================
function saveData() {
  const data = {
    mints:          $('[mints]').val(),
    time:           $('[time]').val(),
    manypost:       $('[manypost]').val(),
    loops:          $('[loops]').val(),
    comments:       $('[comments]').val(),
    refresh_status: $('[refresh_status]').is(':checked')
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  $('[mints]').val(data.mints || '');
  $('[time]').val(data.time || '');
  $('[manypost]').val(data.manypost || '');
  $('[loops]').val(data.loops || '');
  $('[comments]').val(data.comments || '');
  $('[refresh_status]').prop('checked', data.refresh_status || false);
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
function generateID(length = 15) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function timerConverter_mil({ status, timer }) {
  const map = { hrs: 3600000, mins: 60000, sec: 1000 };
  return (map[status] || 0) * Number(timer);
}

function getAvatar(imgEl) {
  if (!imgEl) return "";
  if (imgEl.currentSrc)               return imgEl.currentSrc.replace(".pnj", ".png");
  const srcset = imgEl.getAttribute("srcset");
  if (srcset) {
    const match = srcset.split(",").pop().match(/https:[^ ]+/);
    if (match) return match[0].replace(".pnj", ".png");
  }
  return (imgEl.getAttribute("src") || "").replace(".pnj", ".png");
}

function waitForImage(imgEl, callback, retries = 15) {
  if (!imgEl) return callback("");
  const check = () => {
    if (imgEl.complete && imgEl.naturalWidth > 0) return callback(getAvatar(imgEl));
    if (retries-- <= 0)                           return callback(getAvatar(imgEl));
    setTimeout(check, 300);
  };
  check();
}


// ========================
// ARTICLE SCRAPER
// ========================
function articles_gen() {
  document.querySelectorAll("article:not([owl_gen])").forEach(article => {
    const genID = generateID();
    article.setAttribute("owl_gen", genID);

    const commentBtn = article.querySelector('button[aria-label="Comment"]');
    let comID = null;
    if (commentBtn) {
      comID = generateID();
      commentBtn.setAttribute("owl_coms", comID);
    }

    const userEl   = article.querySelector('a[rel="author"]');
    const uname    = userEl ? userEl.textContent.trim() : "unknown";
    const imgEl    = article.querySelector('figure[aria-label="Avatar"] img');

    waitForImage(imgEl, img => {
      if (!owl_data.some(item => item.owl_gen === genID)) {
        owl_data.push({ owl_username: uname, owl_img: img, owl_gen: genID, owl_coms: comID, timestamp: Date.now() });
      }
    });
  });
}

setTimeout(articles_gen, 2000);

new MutationObserver(mutations => {
  const hasArticle = mutations.some(m =>
    [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.("article") || n.querySelector?.("article")))
  );
  if (!hasArticle) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(articles_gen, 500);
}).observe(document.body, { childList: true, subtree: true });


// ========================
// COMMENT OBSERVER
// ========================
function startObserving() {
  if (mainObserver) return;

  let popupWasOpen = false;

  mainObserver = new MutationObserver(() => {
    const $container = $('div[data-testid="notes-root"]');
    const isOpen = $container.length > 0;

    if (isOpen) {
      if (!$('textarea[aria-label="Reply"]').attr('owl_comment'))
        $('textarea[aria-label="Reply"]').attr('owl_comment', '');
      if (!$('button[data-testid="reply-button"]').attr('owl_sent'))
        $('button[data-testid="reply-button"]').attr('owl_sent', '');
      if (!$('button[class="VmbqY r21y5 Li_00 zn53i KmpWV EF4A5 undefined"]').attr('owl_clsoe_com'))
        $('button[class="VmbqY r21y5 Li_00 zn53i KmpWV EF4A5 undefined"]').attr('owl_clsoe_com', '');
      if (!$(`div[aria-label="Reply restricted"]`).attr('sirado'))
        $(`div[aria-label="Reply restricted"]`).attr('sirado', '');

      if (!commentObserver) {
        commentObserver = new MutationObserver(() => {
          setTimeout(() => {
            const updated = [];
            $container.find('div.MI6Q7').each(function () {
              const user        = $(this).find('div[aria-label="Blog name"] a').text().trim();
              const commentText = $(this).find('.k31gt').text().trim();
              if (user && commentText) updated.push({ user, comment: commentText });
            });
            message = updated;
          }, 300);
        });
        commentObserver.observe($container[0], { childList: true, subtree: true, characterData: true });
      }

      popupWasOpen = true;

    } else if (popupWasOpen) {
      popupWasOpen = false;
      if (commentObserver) {
        commentObserver.disconnect();
        commentObserver = null;
      }
    }
  });

  mainObserver.observe(document.body, { childList: true, subtree: true });
}

startObserving();


// ========================
// WAIT HELPERS
// ========================
function waitForCommentBox(callback) {
  let tries = 0;
  const interval = setInterval(() => {
    const el = document.querySelector('textarea[aria-label="Reply"]');
    if (el) {
      if (!el.hasAttribute('owl_comment')) el.setAttribute('owl_comment', '');
      clearInterval(interval);
      callback(el);
      return;
    }
    if (++tries > 50) {
      clearInterval(interval);
      clickonce    = false;
      isProceeding = false;
      isWorking    = false;
      countSelect++;
      triggerNext("no comment box");
    }
  }, 300);
}

function waitForMessage(callback, onTimeout) {
  let tries = 0;
  const interval = setInterval(() => {
    const popup = document.querySelector('div[data-testid="notes-root"]');

    if (!popup) {
      if (++tries > 40) {
        clearInterval(interval);
        if (typeof onTimeout === "function") onTimeout();
      }
      return;
    }

    clearInterval(interval);
    setTimeout(() => {
      console.log(`💬 Messages loaded: ${message.length}`);
      callback(message);
    }, 1200);

  }, 400);
}


// ========================
// POST CLICK OPENER
// ========================
function findCommentButton(entry) {
  if (entry.owl_coms) {
    const byAttr = document.querySelector(`[owl_coms="${entry.owl_coms}"]`);
    if (byAttr) return byAttr;
  }

  if (entry.owl_gen) {
    const article = document.querySelector(`article[owl_gen="${entry.owl_gen}"]`);
    if (article) {
      const btn = article.querySelector('button[aria-label="Comment"]');
      if (btn) {
        if (!btn.hasAttribute("owl_coms") && entry.owl_coms) {
          btn.setAttribute("owl_coms", entry.owl_coms);
        }
        return btn;
      }
    }
  }

  return null;
}

function delayOppner(delaySec) {
  $("[owl_clsoe_com]").click();
  message = [];

  setTimeout(() => {
    const entry = owl_data[countSelect];

    if (!entry) {
      isWorking    = false;
      isProceeding = false;
      clickonce    = false;
      return;
    }

    try {
      const btn = findCommentButton(entry);

      if (btn) {
        btn.click();
        console.log(`✅ Clicked comment button for index ${countSelect}`);
      } else {
        isWorking    = false;
        isProceeding = false;
        clickonce    = false;
        countSelect++;
        setTimeout(() => triggerNext("skip"), 1000);
        return;
      }
    } catch (e) {
      isWorking    = false;
      isProceeding = false;
      clickonce    = false;
      countSelect++;
      setTimeout(() => triggerNext("skip"), 1000);
      return;
    }

    countSelect++;
  }, delaySec * 1000);
}


// ========================
// TEXTAREA HELPERS
// ========================
function setTextareaValue(box, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  setter.call(box, value);
  box.dispatchEvent(new Event("input", { bubbles: true }));
}

function clearMessageBox(box) {
  if (!box) return;
  setTextareaValue(box, "");
  box.blur();
  box.focus();
}


// ========================
// RESTRICT OBSERVER
// ========================
let isRestricted = false;

function startRestrictObserver() {
  isRestricted = false;
  if (restrictObserver) restrictObserver.disconnect();

  restrictObserver = new MutationObserver(() => {
    const el = document.querySelector("[sirado]");
    if (el && el.innerText.trim() !== "") {
      console.log("🚫 Restricted detected");
      $("[openthis]").click()
      isRestricted = true;
      restrictObserver.disconnect();
      restrictObserver = null;
    }
  });

  restrictObserver.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    if (restrictObserver) {
      restrictObserver.disconnect();
      restrictObserver = null;
    }
  }, 3000);
}


// ========================
// ACTION CONTROL
// ========================
function triggerNext(reason = "") {
  if (isProceeding || isWorking) return;

  if (clickPerActionTarget > 0 && clickPerActionCount >= clickPerActionTarget) {
    console.log(`✅ All ${clickPerActionTarget} posts done for this rep.`);
    isProceeding = false;
    clickonce    = false;
    onClickPerActionDone();
    breakerRunner();
    return;
  }

  isProceeding = true;
  clickonce    = false;

  console.log(`➡️ [${reason}] post ${clickPerActionCount + 1}/${clickPerActionTarget}`);

  setTimeout(() => {
    if (clickPerActionCount >= clickPerActionTarget) {
      isProceeding = false;
      return;
    }
    isProceeding = false;
    isWorking    = true;
    $("[openthis]").click();
  }, 2000);
}

function onClickPerActionDone() {
  // handled by breakerRunner now
}

function clickPerAction(n) {
  clickPerActionTarget = Number(n);
  clickPerActionCount  = 0;
  triggerNext("start");
}

function fullStop() {
  console.log("🛑 Full stop");
  clickPerActionTarget = 0;
  clickPerActionCount  = 0;
  isProceeding         = false;
  isWorking            = false;
  clickonce            = false;
  sent_once            = false;
  countSelect          = 0;
  if (breakerTimeout) { clearTimeout(breakerTimeout); breakerTimeout = null; }
  if (restrictObserver) { restrictObserver.disconnect(); restrictObserver = null; }

  stopCountdown();
  setStartBtn("idle");
}


// ========================
// COMMENT FLOW
// ========================
$(document).on("click", "[openthis]", function () {
  if (clickonce) return;
  clickonce = true;

  delayOppner(1);
  startRestrictObserver();

  try {
    waitForCommentBox(box => {

      waitForMessage(msg => {

          if (isRestricted) {
            console.log("🚫 Restricted — skipping post");
            $("[owl_clsoe_com]").click();
            if (commentObserver) { commentObserver.disconnect(); commentObserver = null; }
            clickonce    = false;
            isProceeding = false;
            isWorking    = false;
            setTimeout(() => triggerNext("restricted skip"), 2000);
            return;
          }

          const isDuplicate = msg.some(x => x.comment.trim().toLowerCase() === comment.trim().toLowerCase());
          if (isDuplicate) {
            console.log("🔄 Duplicate detected — skipping without typing");
            $("[owl_clsoe_com]").click();
            if (commentObserver) { commentObserver.disconnect(); commentObserver = null; }
            clickonce    = false;
            isProceeding = false;
            isWorking    = false;
            setTimeout(() => triggerNext("duplicate skip"), 2000);
            return;
          }

          console.log("✏️ No duplicate — typing comment");
          setTextareaValue(box, comment);

          setTimeout(() => {
            clickPerActionCount++;
            console.log(`✅ Post ${clickPerActionCount}/${clickPerActionTarget}`);

            if (!sent_once) {
              sent_once = true;
              $("[owl_sent]").click();
              setTimeout(() => { sent_once = false; }, 600);
            }

            if (commentObserver) { commentObserver.disconnect(); commentObserver = null; }
            if (restrictObserver) { restrictObserver.disconnect(); restrictObserver = null; }

            isWorking = false;
            triggerNext("success");
          }, 500);

        }, () => {
          $("[owl_clsoe_com]").click();
          if (commentObserver) { commentObserver.disconnect(); commentObserver = null; }
          if (restrictObserver) { restrictObserver.disconnect(); restrictObserver = null; }
          clickonce    = false;
          isProceeding = false;
          isWorking    = false;
          setTimeout(() => triggerNext("message timeout skip"), 2000);
        });
      });

  } catch (e) {
    console.error("❌ Error in comment flow:", e);
    clickonce    = false;
    isProceeding = false;
    isWorking    = false;
  }
});


// ========================
// COUNTDOWN DISPLAY (background-safe via Web Worker)
// ========================
function startCountdown(ms) {
  stopCountdown();

  let remaining = ms;
  updateCountdownDisplay(remaining);

  countdownWorker.onmessage = function() {
    remaining -= 1000;
    if (remaining <= 0) {
      remaining = 0;
      updateCountdownDisplay(remaining);
      countdownWorker.postMessage('stop');
      return;
    }
    updateCountdownDisplay(remaining);
  };

  countdownWorker.postMessage('start');
}

function updateCountdownDisplay(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  $("[time_hr]").text(h);
  $("[time_min]").text(m);
  $("[time_sec]").text(s);
}

function stopCountdown() {
  countdownWorker.postMessage('stop');
  $("[time_hr]").text("00");
  $("[time_min]").text("00");
  $("[time_sec]").text("00");
}


// ========================
// BREAKER (LOOP / BREAK)
// ========================
function breakerSet(delay, loop, refresh) {
  const config = { delay, loop, refresh };
  localStorage.setItem(BREAKER_CONFIG, JSON.stringify(config));
  localStorage.setItem(BREAKER_STATE, loop);
  localStorage.setItem(BREAKER_STOP, "false");
  console.log("Breaker config set:", config);
}

function breakerRunner() {
  const config      = JSON.parse(localStorage.getItem(BREAKER_CONFIG));
  const currentLoop = parseInt(localStorage.getItem(BREAKER_STATE));
  const isStopped   = localStorage.getItem(BREAKER_STOP) === "true";

  if (!config || isStopped || currentLoop <= 0) {
    console.log(isStopped ? "Breaker stopped." : "Breaker done / no config.");
    $('[loops]').val("");
    stopCountdown();
    setStartBtn("idle");
    breakerClear();
    return;
  }

  console.log(`⏳ Break ${config.delay / 1000}s | loops left: ${currentLoop}`);
  setStartBtn("break");
  startCountdown(config.delay);

  breakerTimeout = setTimeout(() => {
    const nextLoop = currentLoop - 1;
    $('[loops]').val(nextLoop);
    localStorage.setItem(BREAKER_STATE, nextLoop);
    setTimeout(autoSave, 300);

    breakerTimeout = setTimeout(() => {
      if (config.refresh) {
        console.log("🔄 Refreshing page...");
        setTimeout(() => location.reload(), 1000);
      } else {
        if (!sent_once) {
          sent_once = true;
          $("[starts]").click();
          setTimeout(() => { sent_once = false; }, 600);
        }
      }
    }, 1000);
  }, config.delay);
}

function breakerStop() {
  localStorage.setItem(BREAKER_STOP, "true");
  if (breakerTimeout) { clearTimeout(breakerTimeout); breakerTimeout = null; }
  console.log("Breaker stopped.");
}

function breakerClear() {
  localStorage.removeItem(BREAKER_CONFIG);
  localStorage.removeItem(BREAKER_STATE);
  localStorage.removeItem(BREAKER_STOP);
  if (breakerTimeout) { clearTimeout(breakerTimeout); breakerTimeout = null; }
  console.log("Breaker cleared.");
}


// ========================
// AUTO-RESUME ON REFRESH
// ========================
function looperRun() {
  const loopsVal  = $('[loops]').val();
  const isRefresh = $('[refresh_status]').is(':checked');

  if (!loopsVal || loopsVal.trim() === "" || Number(loopsVal) <= 0 || !isRefresh) return;

  setTimeout(() => $("[starts]").click(), 1500);
}

$(document).ready(looperRun);


// ========================
// START BUTTON
// ========================
$(document).on("click", "[starts]", function () {
  const loopsVal = $('[loops]').val();

  countSelect         = 0;
  clickPerActionCount = 0;
  isProceeding        = false;
  isWorking           = false;
  clickonce           = false;
  sent_once           = false;

  const cfg = {
    mints:          $('[mints]').val(),
    time:           $('[time]').val(),
    manypost:       $('[manypost]').val(),
    loops:          loopsVal,
    comments:       $('[comments]').val(),
    refresh_status: $('[refresh_status]').is(':checked')
  };

  comment = cfg.comments;

  breakerSet(
    timerConverter_mil({ status: cfg.mints, timer: cfg.time }),
    Number(cfg.loops),
    cfg.refresh_status
  );

  setStartBtn("running");
  clickPerAction(cfg.manypost);
});


// ========================
// STOP BUTTON
// ========================
$(document).on("click", "[stopoperation]", function () {
  breakerStop();
  fullStop();
  setStartBtn("idle");
});


// ========================
// START BUTTON INDICATOR
// ========================
function setStartBtn(state) {
  const btn = $("[starts]");
  if (state === "running") {
    btn.text("RUNNING...").css("background", "#2dc653"); // green
  } else if (state === "break") {
    btn.text("ON BREAK").css("background", "#e85d04");   // orange
  } else {
    btn.text("START").css("background", "#7b2cbf");      // default purple
  }
}










//======================================================================================================================================================= Messages 
// let isPopupOpen = false;
// let keepOpenInterval = null;

// function stopKeepingOpen() {
//   if (keepOpenInterval) {
//     clearInterval(keepOpenInterval);
//     keepOpenInterval = null;
//   }
// }

// function closePopup() {
//   stopKeepingOpen();
//   const popup = document.querySelector('.DxQ0f');
//   if (popup) popup.style.display = 'none';
//   isPopupOpen = false;
// }

// function openPopup() {
//   const popup = document.querySelector('.DxQ0f');

//   if (!popup) {
//     document.querySelector('[aria-label="Messages"]')?.click();
//   } else {
//     popup.style.display = 'block';
//   }

//   // Keep it open every 500ms
//   keepOpenInterval = setInterval(() => {
//     const p = document.querySelector('.DxQ0f');
//     if (!p) {
//       document.querySelector('[aria-label="Messages"]')?.click();
//     } else {
//       p.style.display = 'block';
//     }
//   }, 500);

//   isPopupOpen = true;
// }

// // Toggle on [messagestart] click
// $(document).on("click", "[messagestart]", function () {
//   if (isPopupOpen) {
//     closePopup();
//   } else {
//     openPopup();
//   }
// });



let collectedData = [];
let isScrolling = false;
let isSending = false;
let stopSending = false;
let observer = null;

const DB_NAME = 'TumblrScraper';
const DB_STORE = 'conversations';
const DB_VERSION = 1;

// ==================== IndexedDB ====================

function openDB() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'username' });
      }
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function (e) { reject(e.target.error); };
  });
}

function getAllFromDB() {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).getAll();
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  });
}

function saveToDB(item) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const getReq = store.get(item.username);
      getReq.onsuccess = function () {
        if (getReq.result) {
          resolve('exists');
        } else {
          const putReq = store.put(item);
          putReq.onsuccess = function () { resolve('saved'); };
          putReq.onerror = function () { reject(putReq.error); };
        }
      };
      getReq.onerror = function () { reject(getReq.error); };
    });
  });
}

function updateMsgInDB(username, msgStatus) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const getReq = store.get(username);
      getReq.onsuccess = function () {
        const record = getReq.result;
        if (record) {
          record.msg = msgStatus;
          const putReq = store.put(record);
          putReq.onsuccess = function () { resolve('updated'); };
          putReq.onerror = function () { reject(putReq.error); };
        } else {
          resolve('not found');
        }
      };
      getReq.onerror = function () { reject(getReq.error); };
    });
  });
}

// ==================== UI ====================

function injectUI() {
  if (document.getElementById('tsBtnWrapper')) return;

  const target = document.querySelector('.ACnga');
  if (!target) {
    // Retry kung wala pa ang .ACnga
    setTimeout(injectUI, 1000);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'tsBtnWrapper';
  wrapper.style.cssText = `
    display: flex;
    flex-flow: row;
    gap: 2px;
    align-items: center;
    margin-bottom:10px;
    width:100%;
  `;

  const startBtn = document.createElement('button');
  startBtn.id = 'tsStartBtn';
  startBtn.innerText = '▶ Start Messaging';
  startBtn.style.cssText = `
    padding: 10px 12px;
    cursor: pointer;
    background: #00b894;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 12px;
  `;

  const stopBtn = document.createElement('button');
  stopBtn.id = 'tsStopBtn';
  stopBtn.innerText = '⏹ Stop';
  stopBtn.style.cssText = `
    padding: 10px 12px;
    cursor: pointer;
    background: #d63031;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 12px;
  `;


  const purpleBtn = document.createElement('button');
purpleBtn.id = 'menuBtn';
purpleBtn.innerText = 'Bot Setup';
purpleBtn.style.cssText = `
  padding: 10px 12px;
  margin-bottom:10px;
  cursor: pointer;
  background: #7b2cbf;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
  width: 90%;
`;

wrapper.appendChild(startBtn);
wrapper.appendChild(stopBtn);
target.prepend(wrapper);
target.prepend(purpleBtn);

  purpleBtn.addEventListener('click', function () {
  // logic here
  });

  startBtn.addEventListener('click', function () {
    stopSending = false;
    sendToAllPending();
  });

  stopBtn.addEventListener('click', function () {
    stopSending = true;
    isSending = false;
    const btn = document.getElementById('tsStartBtn');
    if (btn) btn.innerText = '▶ Start Messaging';
  });
}

function setStatus(msg) {
  // ✅ console.log lang, wala nay UI display
  console.log('[Status]', msg);
}


// ==================== Scraper ====================

function extractConversations() {
  const buttons = document.querySelectorAll('.ftU4D button[aria-label="Conversation"]');
  console.log('🔍 Buttons found:', buttons.length);

  buttons.forEach(function (btn) {
    const username = btn.querySelector('.pTvJc')?.innerText.trim();
    const srcset = btn.querySelector('img.nLowv')?.getAttribute('srcset') || '';

    let image = '';
    srcset.split(',').map(s => s.trim()).forEach(part => {
      if (part.includes('512w')) image = part.replace('512w', '').trim();
    });

    if (!username) return;

    const inMemory = collectedData.some(d => d.username === username);
    if (!inMemory) {
      const item = { username, image, msg: false };
      collectedData.push(item);
      saveToDB(item).then(function (status) {
        console.log(status === 'saved' ? '💾 Saved:' : '⏭️ Exists:', username);
      });
    }
  });

  console.clear();
  console.log('📋 Total:', collectedData.length);
  console.table(collectedData);
}

function findScrollableContainer() {
  const ftU4D = document.querySelector('.ftU4D');
  if (!ftU4D) return null;
  let el = ftU4D;
  while (el) {
    if (el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

function startObserver(target) {
  if (observer) observer.disconnect();
  observer = new MutationObserver(function (mutations) {
    let hasNew = false;
    mutations.forEach(function (m) { if (m.addedNodes.length > 0) hasNew = true; });
    if (hasNew) extractConversations();
  });
  observer.observe(target, { childList: true, subtree: true });
}

// ==================== Messaging ====================

function waitForElement(selector, root, timeout) {
  root = root || document.body;
  timeout = timeout || 5000;
  return new Promise(function (resolve) {
    const existing = root.querySelector(selector);
    if (existing) { resolve(existing); return; }
    const obs = new MutationObserver(function () {
      const el = root.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(root, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); resolve(null); }, timeout);
  });
}

function findChatWindowByUsername(username) {
  const chatWindows = document.querySelectorAll('.hpABw');
  for (const win of chatWindows) {
    const links = win.querySelectorAll('.BSUG4');
    for (const link of links) {
      const name = (link.innerText || link.getAttribute('title') || '').trim();
      if (name === username) return win;
    }
  }
  return null;
}

async function sendMessageTo(username, message) {
  // Step 1: I-open ang Messages panel una
  const messagesBtn = document.querySelector('button[aria-label="Messages"]');
  if (!messagesBtn) {
    console.warn('❌ Messages button not found!');
    return false;
  }

  messagesBtn.click();
  console.log('🖱️ Clicked Messages button');

  // Step 2: Hulat ang .ftU4D ma-load
  setStatus(`Waiting for panel...`);
  let ftU4D = null;
  let panelTries = 0;

  while (!ftU4D && panelTries < 20) {
    await new Promise(r => setTimeout(r, 500));
    ftU4D = document.querySelector('.ftU4D');
    panelTries++;
  }

  if (!ftU4D) {
    console.warn('❌ .ftU4D never appeared!');
    return false;
  }

  console.log('✅ .ftU4D loaded!');

  // Step 3: Pangitaon ang conversation button sa list
  const buttons = ftU4D.querySelectorAll('button[aria-label="Conversation"]');
  let clicked = false;

  for (const btn of buttons) {
    const name = btn.querySelector('.pTvJc')?.innerText.trim();
    if (name === username) {
      btn.click();
      clicked = true;
      console.log('🖱️ Clicked conversation:', username);
      break;
    }
  }

  if (!clicked) {
    console.warn('❌ Conversation button not found:', username);
    return false;
  }

  // Step 4: Hulat ang chat window .hpABw ma-appear
  setStatus(`Opening: ${username}`);
  let chatWin = null;
  let tries = 0;

  while (!chatWin && tries < 20) {
    await new Promise(r => setTimeout(r, 500));
    chatWin = findChatWindowByUsername(username);
    tries++;
  }

  if (!chatWin) {
    console.warn('❌ Chat window not found:', username);
    return false;
  }

  console.log('✅ Chat window found:', username);

  // Step 5: Hulat textarea
  const textarea = await waitForElement('textarea.xXTjk', chatWin, 5000);
  if (!textarea) {
    console.warn('❌ Textarea not found:', username);
    return false;
  }

  // Step 6: Type ang message
  textarea.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeSetter.call(textarea, message);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));

  setStatus(`Typing: ${username}`);
  await new Promise(r => setTimeout(r, 1000));

  // Step 7: Hulat Send button ma-enable
  let sendBtn = null;
  let sendTries = 0;

  while (sendTries < 15) {
    sendBtn = chatWin.querySelector('button[aria-label="Send"]');
    if (sendBtn && !sendBtn.disabled) break;
    await new Promise(r => setTimeout(r, 300));
    sendTries++;
  }

  if (!sendBtn || sendBtn.disabled) {
    console.warn('❌ Send button not ready:', username);
    return false;
  }

  // Step 8: Send!
  sendBtn.click();
  setStatus(`Sent: ${username}`);
  console.log('📤 Sent:', username);

  // Step 9: Wait before closing
  await new Promise(r => setTimeout(r, 1000));

  return true;
}

async function sendToAllPending() {
  if (isSending) return;
  isSending = true;
  stopSending = false;

  const startBtn = document.getElementById('tsStartBtn');
  if (startBtn) startBtn.innerText = '⏳ Listening...';

  // ✅ Infinite loop — mo-stop lang kung gi-click ang Stop
  while (!stopSending) {
    const allData = await getAllFromDB();
    const pending = allData.filter(d => d.msg === false);

    if (pending.length === 0) {
      // Walay pending — mag-hulat lang ug 5s then check usab
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    let sentCount = 0;

    for (let i = 0; i < pending.length; i++) {
      if (stopSending) break;

      const item = pending[i];
      console.log(`➡️ [${i + 1}/${pending.length}] Sending to:`, item.username);

      const sent = await sendMessageTo(item.username, 'hi im Gwagrabledra');

      if (stopSending) break;

      if (sent) {
        sentCount++;
        const memItem = collectedData.find(d => d.username === item.username);
        if (memItem) memItem.msg = true;
        await updateMsgInDB(item.username, true);
        console.log('✅ msg=true:', item.username);
      } else {
        console.warn('⚠️ Failed:', item.username);
      }

      if (!stopSending && i < pending.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    if (!stopSending) {
      console.log(`✅ Batch done. Sent: ${sentCount}. Checking again in 5s...`);
      // ✅ Mag-hulat 5s then mag-check usab kung naay bag-o
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  isSending = false;
  if (startBtn) startBtn.innerText = '▶ Start Messaging';
  console.log('⏹ Stopped.');
}



// ==================== Scrape Flow ====================

function startScrape() {
  const ftU4D = document.querySelector('.ftU4D');
  if (!ftU4D) return false;

  getAllFromDB().then(function (existing) {
    collectedData = existing;
    console.log('📦 Loaded from DB:', existing.length);

    const scrollTarget = findScrollableContainer();
    extractConversations();
    startObserver(ftU4D);

    let lastCount = 0;
    let sameCountTimes = 0;

    const interval = setInterval(function () {
      if (scrollTarget) scrollTarget.scrollTop += 600;
      else window.scrollBy(0, 600);

      if (collectedData.length === lastCount) {
        sameCountTimes++;
      } else {
        sameCountTimes = 0;
        lastCount = collectedData.length;
      }

      if (sameCountTimes >= 5) {
        clearInterval(interval);
        isScrolling = false;
        if (observer) observer.disconnect();

        console.log('🎉 Scrape DONE! Total:', collectedData.length);
        console.table(collectedData);
        setStatus(`Scraped ${collectedData.length} users. Click Start Messaging.`);
        // ❌ TANGGALA ni — chrome.runtime.sendMessage({ action: 'scrape_done', count: collectedData.length });
      }
    }, 800);
  });

  return true;
}

function waitForContainerThenScrape() {
  console.log('👀 Waiting for .ftU4D...');
  const bodyObserver = new MutationObserver(function () {
    const ftU4D = document.querySelector('.ftU4D');
    if (ftU4D) {
      bodyObserver.disconnect();
      console.log('✅ .ftU4D appeared!');
      startScrape();
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
  setTimeout(function () {
    bodyObserver.disconnect();
    if (!document.querySelector('.ftU4D')) {
      console.warn('❌ .ftU4D never appeared');
      isScrolling = false;
    }
  }, 10000);
}

function autoScrollAndScrape() {
  if (isScrolling) return;
  isScrolling = true;
  collectedData = [];

  const ftU4D = document.querySelector('.ftU4D');
  if (ftU4D) startScrape();
  else waitForContainerThenScrape();
}

// ==================== Event Listeners ====================

$(document).on('click', 'button[aria-label="Messages"]', function () {
  autoScrollAndScrape();
});

document.addEventListener('click', function (e) {
  const btn = e.target.closest('button[aria-label="Messages"]');
  if (btn) autoScrollAndScrape();
}, true);

// ✅ Inject UI dayon pag load sa page
injectUI();