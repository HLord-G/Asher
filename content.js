// ============================================================
// OWL BOT - OPTIMIZED (Background Tab Fix)
// ============================================================

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
let version = "0.2"




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
        <label style="font-size:12px;color:#c77dffff;">Post Count</label>
        <div style="display:flex;gap:5px;margin-top:5px;">
          <input type="number" manypost placeholder="Total"
            style="width:50%;padding:5px;background:#3c096cff;color:#fff;border:none;border-radius:6px;">
          <input type="number" manypost_remaining placeholder="Remaining" disabled
            style="width:50%;padding:5px;background:#240046ff;color:#a0a0a0;border:none;border-radius:6px;cursor:not-allowed;pointer-events:none;">
        </div>
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
  updateLoopDisplay(0, 0);
  $('[manypost_remaining]').val("");
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

          const isDuplicate = msg.some(x => 
            (window._allComments || []).includes(x.comment.trim().toLowerCase())
          );
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
          const freshComment = getRandomComment($('[comments]').val());
          setTextareaValue(box, freshComment);

          setTimeout(() => {
            clickPerActionCount++;
            const remaining = clickPerActionTarget - clickPerActionCount;
            $('[manypost_remaining]').val(remaining >= 0 ? remaining : 0);
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
function updateLoopDisplay(remaining, total) {
  const display = $('[loop_display]');
  if (!total || total <= 0) {
    display.hide();
    $('[loops_used]').val("");
    return;
  }
  display.show().text(`${remaining} / ${total}`);
  $('[loops_used]').val(remaining);
}

function breakerSet(delay, loop, refresh) {
  const config = { delay, loop, refresh, total: loop };
  localStorage.setItem(BREAKER_CONFIG, JSON.stringify(config));
  localStorage.setItem(BREAKER_STATE, loop);
  localStorage.setItem(BREAKER_STOP, "false");
  updateLoopDisplay(loop, loop);
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
    updateLoopDisplay(0, 0);
    breakerClear();
    return;
  }

  console.log(`⏳ Break ${config.delay / 1000}s | loops left: ${currentLoop}`);
  updateLoopDisplay(currentLoop, config.total || currentLoop);
  setStartBtn("break");
  startCountdown(config.delay);

  breakerTimeout = setTimeout(() => {
    const nextLoop = currentLoop - 1;
    $('[loops]').val(nextLoop);
    localStorage.setItem(BREAKER_STATE, nextLoop);
    updateLoopDisplay(nextLoop, config.total || currentLoop);
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

  comment = getRandomComment(cfg.comments);

  // also store all possible comments
  window._allComments = (cfg.comments.match(/\[(.*?)\]/g) || [])
    .map(x => x.replace(/[\[\]]/g, '').trim().toLowerCase());
  $('[manypost_remaining]').val(Number(cfg.manypost));

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


function getRandomComment(text) {
  const matches = text.match(/\[(.*?)\]/g);
  if (!matches) return text;

  const clean = matches.map(x => x.replace(/[\[\]]/g, '').trim());
  return clean[Math.floor(Math.random() * clean.length)];
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





//======================================================================================================================================================= Messages Area

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
    setTimeout(injectUI, 1000);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'tsBtnWrapper';
  wrapper.style.cssText = `
    display:flex;
    flex-flow:row;
    gap:2px;
    align-items:center;
    margin-bottom:10px;
    width:100%;
  `;

  const startBtn = document.createElement('button');
  startBtn.id = 'tsStartBtn';
  startBtn.innerText = '▶ Start Messaging';
  startBtn.style.cssText = `
    padding:10px 12px;
    cursor:pointer;
    background:#00b894;
    color:#fff;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
  `;

  const stopBtn = document.createElement('button');
  stopBtn.id = 'tsStopBtn';
  stopBtn.innerText = '⏹ Stop';
  stopBtn.style.cssText = `
    padding:10px 12px;
    cursor:pointer;
    background:#d63031;
    color:#fff;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
  `;

  const purpleBtn = document.createElement('button');
  purpleBtn.id = 'menuBtn';
  purpleBtn.innerText = 'Bot Setup';
  purpleBtn.style.cssText = `
    padding:10px 12px;
    margin-bottom:10px;
    cursor:pointer;
    background:#7b2cbf;
    color:#fff;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    width:90%;
  `;

  wrapper.appendChild(startBtn);
  wrapper.appendChild(stopBtn);

  target.prepend(wrapper);
  target.prepend(purpleBtn);

  startBtn.addEventListener('click', function () {
    stopSending = false;
    sendToAllPending();
    autoScrollAndScrape();


    setTimeout(() => {
      document.querySelector('[aria-label="Messages"]')?.click();
    }, 900);
  });

  stopBtn.addEventListener('click', function () {
    stopSending = true;
    isSending = false;

    const btn = document.getElementById('tsStartBtn');
    if (btn) btn.innerText = '▶ Start Messaging';
  });
}

function setStatus(msg) {
  console.log('[Status]', msg);
}

// ==================== Scraper ====================

function extractConversations() {
  const buttons = document.querySelectorAll('.ftU4D button[aria-label="Conversation"]');

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

    mutations.forEach(function (m) {
      if (m.addedNodes.length > 0) hasNew = true;
    });

    if (hasNew) extractConversations();
  });

  observer.observe(target, {
    childList: true,
    subtree: true
  });
}

// ==================== Helpers ====================

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function waitForElement(selector, root, timeout) {
  root = root || document.body;
  timeout = timeout || 5000;

  return new Promise(function (resolve) {
    const existing = root.querySelector(selector);

    if (existing) {
      resolve(existing);
      return;
    }

    const obs = new MutationObserver(function () {
      const el = root.querySelector(selector);

      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    obs.observe(root, {
      childList: true,
      subtree: true
    });

    setTimeout(function () {
      obs.disconnect();
      resolve(null);
    }, timeout);
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

// ==================== Messaging ====================

async function sendMessageTo(username, message) {
  // FIX: Check kung naay bukas na nga Messages panel, kung wala lang click
  let ftU4D = document.querySelector('.ftU4D');

  if (!ftU4D) {
    const messagesBtn = document.querySelector('button[aria-label="Messages"]');
    if (!messagesBtn) return false;
    messagesBtn.click();

    for (let i = 0; i < 20; i++) {
      await wait(200);
      ftU4D = document.querySelector('.ftU4D');
      if (ftU4D) break;
    }
  }

  if (!ftU4D) return false;

  const buttons = ftU4D.querySelectorAll('button[aria-label="Conversation"]');
  let clicked = false;

  for (const btn of buttons) {
    const name = btn.querySelector('.pTvJc')?.innerText.trim();
    if (name === username) {
      btn.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) return false;

  let chatWin = null;
  for (let i = 0; i < 20; i++) {
    await wait(150);
    chatWin = findChatWindowByUsername(username);
    if (chatWin) break;
  }

  if (!chatWin) return false;

  const textarea = await waitForElement('textarea.xXTjk', chatWin, 4000);
  if (!textarea) return false;

  textarea.focus();

  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype, 'value'
  ).set;
  nativeSetter.call(textarea, message);

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));

  await wait(400);

  const sendBtn = chatWin.querySelector('button[aria-label="Send"]');
  if (!sendBtn || sendBtn.disabled) return false;

  sendBtn.click();
  await wait(600);

  return true;
}

// ==================== IMAGE GENERATION ====================

function imgGen(username, img) {
  return new Promise((resolve) => {

    const canvas = document.createElement("canvas");
    canvas.width = 832;
    canvas.height = 772;

    const ctx = canvas.getContext("2d");

    const bg = new Image();
    bg.crossOrigin = "anonymous";

    bg.src = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAPXBC0DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAoozRQAUUUUAFFFGaACiiigAooooAKKKKACiijNABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRmigAooooAKKKKACiijNABRRRQAUUUUAFFFFABRRmigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooozQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB5T+1z/wAiJpH/AGF0/wDSeevCa92/a5/5ETSP+wun/pPPXhNAH2ZRRRQAUUUUAFFFFAEeeRXgvgn/AIKG+BfHn7cfif4C2cWtL4r8L6eL6W+ltgumXjhLeSW2hmz888SXULOmOAx9K9I+P/xh0n9nj4KeKvHOuS+Vo/hPS7jVbth2jhjLn+X61+Tem+PfG3wH/Zt+GfxX1r4IfGPS/HHgvxpcfEnxp4ln07TU0qe11R5V1ZQFvnufLW0lG0eXxsHrxMbOdpbL83ovl3DlfJdb/wCSuz9ls0AV8M638O9F/wCCgv8AwUE+I3hPx5r2tX3gP4e+HtEvPD3hfTNeu9MtdXF/FNLJqsptZY2m2kCKM5wMN3Nc/wDF74Wr4X+IXwR/Z4sfi1451T4c+MfFGvNrl3J4okfVUSytFng8OfboitwkQDEHdL55CY3dMGu2zDTp/Wlz9BiVX8qAcivz9/a0+EGm/wDBOj4AeO2+EnxD8WeE4fEH9iaXLpV54ll1SHwZDeapFaXGtwi7aaePCT8kEruQEcjiX9o39mfw7/wTmvvhp48+FuveNrHxJrnjrRfDmq2Op+LtS1lPHMF/dpBOs8V1PIr3CxvLMjoFIKN6jBzLR9L2+en4aid191z79LD5ufShjk18R/sdfEXUh+zZ+1dqGr61dlvD/wASvGsVvcXdy2NNt4vmjVWb7qIOR6cmvCv2bfA+oftdeKf2S/Cvi/xd46l8M6n8AptY16ws9fu7EeIZfP01FFzLDIkxxuJ6j0zUxu5Wj2T/AAb/AEFKXKrvu19zSP0n+M/xl8Ofs/fC7XPGni7Uf7J8NeHbVr3Ubz7PJP8AZoV6tsjVnOPZTXS29ws0fmK3ysua/JT9qr4G6Xon7Hn7bnwzbUvFV74S+DtxYav4StbrxFfyy6S1zo9vM1uZjOZJ7cEnbDMSBuPqDX6a/Av4P+HP2ffhVb6F4fTVLfRrVWn26hq95qkybvmbM11JJKe55aqvpbyT+9X1K7PvdP5W2PBtO/4Kw6Xr1j/wlOm/Cb4s6p8If7UOkL8QLOys5dPlk+0/Z/tMdotz9vks9/8Ay8LbkdeK+s1fJr86LvT/ABN+wn+zDqXxm/Zz+Kmi+Ov2fdLs7rxP/wAIL4itw9ra2O+Se4XS9RTbLDjc2yGcOoOecmvXP2SPihffEP8A4KT/AB4kN/qR0S48I+C9U0vT7iQhLVLi2vncrH2JIGffNC0itNev3BLq1t089Uv1PevjB+0TpPwa+IHw68O6ha6jdXvxK1uTQtOa2RWSCWOznuy0pLDC7LdumTzXYeLdcbwx4Z1DUo7S61CSxtpLhbS1TfcXRRS3lxr3ZsYA9SK/I25uLj4/2/wvsdQ8c65pdnqn7UvizTbfXLTU3W7FmbfUlS1trn78fmcQqyevvX0N4n+E2n/sDftreAfC3wy1vxHZeF/il4d8Rf274Xv/ABBfatDayWVos8GpQG6mlaBzIfLYjg7h3FZqXuc3z/BMf2+T+t7H2l8DvibJ8Z/hJ4f8VXHhzxF4Qm1yzS6fRtetfsupaaW6xTxZOxxjkV1hOSa/IHwP4r8d/tPaR+zP8M7/AEXxT8RfDLfBGy8Z6ppEPjp/Dk3iK/klhgZri6EiTTpDwcerZ711WvTfGb9nb4XeJPAt5qOsfC/wH4t8f+FvDOlTnxwviDXPAthqGE1CFbw7ngUnyvs7SE7d/vmtpKz072/GxnfS77Xf3XP1VZwvNcl8HvjV4Z+PPhWfWvCuoNqWn2uo3mkyymCSEx3VpcSW1xGVkVWyksbr07cV4X4J/wCCcnwv+BHxItf+EZ8VeOvDdv4o0y+0rUvDM3ja+u4PFSyR/PPi6mknS4iB3ia2eNxnk4rg/wDgih+zv4Y+GvwX8Ua9pMOsx6ldeMvEmkym416+vIHgttbvY4sQSzPEjYHJVcnJyeTU397l8r/oX9jm63S+TTf6H1fq/wAafDeh/GDR/AVxqPl+K9c0261exsfIkPn2ts8Mc0m8LsG1p4hgnPzjArrQfmr4N/aH/ZK8E/ET/gsn8NbzVIPErXGreCdc1e5Nv4o1S0UTWl1o6QbFhuEWNAGO6NQEfGSDg5ofs2fsteHv+ChHhvx98SPij4i8cSeNLfxnr2j2CaZ4t1LSF+H6WN9JbQRW0dvNGiTKkMMzO4JLOPfMx1iu7u/udgekn20Xztc/QEnJ/nXx54V/4K6p4w8KyeKNN/Z//aA1LwTHc3NsNd07R9Pv43+zzywSyLBBePOyB4m5EfQHjiu9/wCCWPxn8QfH39h3wd4j8UakNc1cyX+mtrATYNaitL+4tIr3Hbzo4Ek+rmud/wCCP1/FpX/BOvwzdXMsdvBBqWvs8kjBUjUa1fcknoKqfuv0CMbrzue//Bv4zeGf2g/hho/jLwdrFnr3hrXrdbqxvrVt0dxGehFS/GD4kWfwb+FXiTxdqEM89h4X0u51W5jgGZHigiaRgoPfCnFflHN8QfFM3wC0/Tfh7Dqv/CA/Hf8AaG15NKOk64uiy6ro/lzT+RaXYx5EV5dW0/TBwxAxmu5vPgb8Rf2f9O+KFrpfg2++G/wq1X4WeIRqfhnV/iU3ifbeR2ztBfWUUskkseclJj05XgkZMSleLa00697Xs/yCOklF66/he1/1P0l+EvxCtPi78L/DfiqxjlhsvEmmW2q20coxIkU8SyIG98MM+4qr8a/jX4b/AGfPAE/ijxdqR0rQbWe3tZrn7PLPsknnjgiGyNWY7pJEXgfxV+Y8A8UftK/FL4dfDG48F658QvBHg/4LeF9Yg8Nad48k8Lw3txdqyvfTvG8bzpF5EaKOgJJxyap/tGfs9+Lrn/gnZ8S9J+KVvrMNh4P8eaIfBdnJ4/uNY1DRrK71HTEnsLq4hmUT+VlvJFzkjcvPTOsYqUrbK9vxsRGVlrvp+Kufppr3xquNC/aB0PwKvg/xdeW2uaZcai/iS3sd2i6c0TAC3nnz8sz5JVcHIFd4WwtfBf7Q+oXn7GP7S/hnS/h//bVxp3hf4NeN9Z0zRb7WLzUxe3sEmmzRCRriaSaXLZHUnnr0x5/4q/Ze8P8AgT/gmTJ+0hY/E3x1/wALksfBieNE8eP4tvXj1G88lboWjWhn+xtayuBb+R5W3awHWp5ly83Rb992lp8ilfm5Fu9vuX+Z+mmdz/zoxmvz18KfBq3/AG8/29/iHb/EjUPGX/CLWfw98Iag/hCz8Q32l2C312l9I8kiW80b749gHJ7jPSvZ/wDgk7q+pR/Azxp4b1DWNW1y38B/ELxF4W0q61S7e7vDY2d9JHAssr/M7KvGT2AojJ6p9L/g7A3a3y/FXPqNmx96vMvj/wDtQ6L+zh4l+H9lrtnqbW/xC8RxeF7W/gjU29jeTRu0AnJYECRk2LgHk1z3/CRftGf8Le+z/wDCJ/Bb/hAf7T2/bv8AhK9T/tj7Bu+99m/s7yfP2/w+ftz3qH/go3+z/e/tK/sa+NPDejt5fiqG1XVvDkwHzQarZyLdWbr7+dCg/E1MpJRUnt172Hu+XqdR+0T+05o37N83gm31Kx1LVNQ8f+J7TwtpNnp6I8z3E+92lYMygRRRRyO7c4C+9aX7PHxnn+PPw6/t+58H+MPA8jXtzZjS/E1ktpf7YZWjWYxqzDZIFDqc9Gr47/ZJ+Oln/wAFPf21fA3xLsVRvCvwd8B212Y1wRD4k1qHNzAc97e1iCn0aWvMvhR4t8RfHT4ffAD4X654y8S6Z4W+Jfjvx9/wkOoW+qT22oagmm6rem10xblSsipKM5wQSI8DmrtbR7u/yS/q4dOb0/FXP0p+MHxJtfg58KfEvi3UIriex8L6Xc6tcxwDMkkUETSOFB74U4pfhP8AEO0+Lfwt8N+KrGOaGz8TaXbarbxzf6yOOeJZVDe4DDNfnp+1F8NNP/Yh+I3iL4cfDnVvEcngn4h/CHxhqWr+FdQ1y81WHQ57K2i8i/he5kllhE/nSwvglSVBxkDGfruiWf7TOk/Bn4a6X4D8X/FHVvDfwo0PWNT0ib4k3Xg7w9psFzGqwTyvaI8094WgfHBAUZ78THXby/W/5E31V/P/ANtt+Z+h3xb+Nvhv4G6Vpd94n1D+zbbWtXs9Cs28mSUz3t3MsNvCAik5eRgMnj3qiPjXcf8ADRv/AAr/AP4Q3xh9l/sH+2/+Eo+xD+wt/neV9i8/dn7Tj59m37vNflLd+E/+GkP2QdE0vx4fF89x8Nv2j7LwHp8U/jS+vJrLT31WyDWzXkMym4eEN5cdxJl02jGMHP0F+1h8Rte/Yt+OPxGj+H9xqzW/gH9na61XRdPvL241FIrmLUGVJ2855HlZVHfPAx3pKSsm+rf3ct189St3yrfT7+ax+imeaM1+bX7Tv7LPhr9jD9iT/hfngHx344uvif4bstP1dPE9z4w1DUI/HErvbg29zBJcNbyxXXy8BeNykHiur8J/sq6T+2j+37+0pa/EbWPHOp+FPDN/4eh0vwzb+KdR02wsp5dFt5JZwlrPFliSP1q9btdt/wACeZb99j76BG2lJGyvmf8A4JM+Mdd8W/sLeHW8Qaxf+ItR0fVNc0JdSv5fOu72Gw1e8s4Xlb+JzHAuTXz3+yv+yp4b/be/ZLufjf8AEzxl46sfiVrj6veSa7YeMdR05fh+0NzcRrb2kEdwtvEtqqHJZTkhiTzmlKSV30SuVrt1vY+tv2oP2yNO/Zp8VeDPDcfhXxZ458XePrm4g0bQ/Dq2puplt4vNnmdrmeGJI41IyS/ccenR/Gn406x8J/htaa/p3w88Z+OLy5eJH0TQFtDqEG8ZZm8+eKPC9Dh+v1r84/A/wz0v9u74z/sX+NviRD4gm8UfEbwHr9xr8th4j1LR/tL2ltZLBcRJa3Mf2cybjI3k4zkfWv1cSMRRL/siqlFxjrvr912hRkm01tb8T5d/Zr/4KZSftP8Aje40vTfgn8X/AA/penarfaJquuazFpUdho91Z8TJMY753GDxwpqpo/8AwVAm+Kl1f33wp+CfxW+K/g3SZJI5/EukjTbGyvih2t9gF7dQNecgj5MDI6mvIvhv4a8Q+Mf+Ccf7ZWleExMfEmpeNPiDbaaIDiV5nnmCge5JxX1h+wp478H/ABI/ZA+HOqeA3s28Jnw/Z29hFbkFbRIoEj8ggdGjKlCOxU1nGXN02Sf3/wCQuvza+Sf6nHyf8FPfhon7KWp/FqH/AISKbTdJ1AaJc6D/AGVIniCDV2mSBdKeyPzi8M0ir5fv1xzWp8B/21dQ+J/xeHgXxb8KfiD8L/EV1pjazpw1wWdzZ6lbI0ayBLiznmjWZDIu6JyCMjk18oa54b+Fv7Rf7S37T1v4k8SN4a+HfijxH4P8MWGv6ddNbSnxparJ89pcYKpdQt9iTp1AzXrfw++M3xg/ZA/ai8A/C74teMdA+KXhP4k2+p/2F4nTSl0fW9NmsbcXMqX0UbG3ki8kN+9jCnIyw55vTcpxa93d/wBfketeP/2/fh/8I/EvxOtfEl3caPpPwkstPudd1eZVa3El6rtBbRKpaWSUqo4C9XArgZ/+CmOvaLpFr4l8Qfs5/Hfw74DuiF/tm40+wubmzUjPnXOm291JexRjufLJx2r5b1cxj4DfBv48eL1mTwj8RfjwvxB8TTXOBHYadPHcWOgy3DHhYYETS+vAyK/TzxJ4x0nwT4Wuta1fVLHTdG0+3N1c391OsVtbwqMtI8jEKq45yTilHa73Ts152Ta/ET+K3T/g6flc14pN8Q9xmnBgD718Nat8K9K/4KD/ALfXxb8LfEXVteuvBHwx03RF8PeGdN8RXul2uofbraSeXU5fsc8bTnOY4yThdp7mvCfihr3i/Rvhv8QvhDofxI8aNoPgv46+DvDGheKRqkk2q2drqD2Ek9j9oJLyG0ecjnnGATxRq2vO34tD2V+n/Aufq4oytA2k1+cvjf8AYJ8M+EP+Cing34Z6H4k+JWm/DX4g+ENZ1/xV4eXxrq0y69d2dxZRxyy3Mly1yuftfzbJBnaK8x8aR+IPBHwz+J3wf8L+NfGWg+HvCH7QHhDw3oF/Dq1zPqOjWF+dNlkt47id3kZEe4bAJ4yaUZXsl/Wqj+bJ5kr36f5X/I/Wj5cUZXFfnH41/YK8M+Ev+Ci3g34ZaJ4k+JWmfDX4g+ENZ1/xV4eXxrq0y69d2dxZRxyy3Mly1yuftfzbJBnaPrXm+o+Jtc+Clr4l+G+g+I/EqeE/h1+0t4N0nS1uNVuZ5rLS7tbGeWyaeV3ka3EkrYBPG40462S6/wDySi/xCUkr/wBdLn6xs236UE/dr42/bG8fahpH/BSj4K6HZ6zdW9vd+CPGN1dWEdwVify7e08qV0HXDZwfUe1fK+mfs8t8Of8AgkB8OP2iovGHxEvvjNpekeHtai8Q3nirULjzI5r20V7F7Xz/ALM1t5MhXbt7Zz2qqeqvstPxbX6Dcrf16H6Iat+2BpfgmT4r3ni/w74v8G+FfhNFFc3niPVNMf8As7WLdrfzpJ7Ix7nmSLlHwuQw6V6xpl9Dq9jDcW8m+GZFlRv7ynkV+YX7efhOH4u/D3/goLZ69da3dWfgez0zVtFto9Xu7e3tJx4aU/dhdVaMkktF35zyQa9d+Nfw7tv2Afh18F/il4MvPE9n4M8B6mlt4z06816+1SOfR9UVIbi6le6mkc/ZZvJuB/utSW9n2X49x22t1v8AhbRH3RXhv7Rn7dOh/An4laT4D0rw34t+JHxK1q1N9a+GPC9vFLcw2u4J9qupZpIoLWDeQvmSyAZPANcX/wAE+fEGs/tDfET4rfGy61a8uvDPi7WG8P8AguzFwXs4tH0x5LcXca9jc3P2iQ8dAtYv7Il/aeEf+Cmf7TWg+INtv4y8R3Gi69pD3GFk1PQV06K3Qw92jhukuY2x/ERmly6peV/+ATzaN+dv+CeqfAD9r3UPi18Tbzwb4o+E/wATPhj4ls7EaiF1y0t7vTbqEsFPlX9lNPbM4JGULq3I4Ne2AbTXxn8bv2hv2hvgB+0F8MfDF9r/AME/Eln8TPF8ekW2k2HhrUrXWE0xQ8t3dh31F4swQqCfkxk96wP2WPiXq0f7DP7Umpavr16Z/D/jTx3FFd3Vy2dNihlm8tVduVVBgj0qOd8rl5N/dbT8R2s0u7S++/8AkfV//C65z+0efh//AMIf4w+z/wBg/wBtf8JR9iH9hFvO8r7H5+7P2nHz7Nv3eah/ag/aJ0n9lL4Iax4816z1K+0vQ2gE8Onoj3D+dPHAuwOyg/NKvevzb0D9p/x58JvgtpPi7Sda1O+17Sf2PrDxNbpdytcxyah5if6Y6t9+Xv8AhjvWr/wUK/YP8C/BP/gm3P4/0L4heOrvxNqR0F9T1/UPF99qUPjvzr+z4nt5pmtpN+d8eyMYwMZzmtY2TUZd7fiTzfy/1om/zP1T5YV5z8Rv2j9J+G3xz+H/AICurLUrjVviMupHTpYEUwRfYYBPKJCWGCVYAcda+CfH/h3xh+2V+3H8bLPXvhz4o+J2g/DXWrLQtC0yw+Jtx4StfD6tp8dybryYZI3knmabiUk/KMDgVs/s/wBp8QtH+Pv7I+nfFG8h1TxFo9549soL19Yj1a5uLGO0Vbc3NxF8ktwseEkx3HrmiMebXbS/4aFXs7edj7n/AGdPjJN8ffhFpfiq68H+LvAs2pGUNoviayFnqlnsleMebEGYLuC7hz91hXdFhn6V+UfwL0LXP2ndB/Yr8La9428dWui+JtM8ey+IhYa3c2lx4gjt7qEJBcXEbpMQM889qP2hvEniL/gn9oX7Ungf4X6t4i0/w7pcPgqbw+t5r0123hY6xfS2N7Nbz3ckrR9mAOcE5FTt6t6eeti+Xr9/kj9Xur0b8rX5u/CH9m/4kfs//tK/DDWvBfw78Q/DXTdS1r7L4wGvfF9/EcHiizkgl3s9vPM5e9jI85WhHZuo4HHfD7wK37MHxG0Hx18YtM+J2pXVx4vjjtvjV4Q+I82paHrYur5xbwX+mtc/6PaAGC1ZEt5I8gcjrVct2l3M+b3W+x+qtFA6UUFBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAV4PN+334fk8Sa1p2m+Cfiv4g/sDVLrR7q70nwncXlp9pt5PLlRZF4OGrp/20j4rH7J/xBXwOmqP4uk0S5j0oaZ/x++eyFVMJ7SDOVPYgV8YfCT4bN8RNN1298E/Cjx3Y6XH4h1O1lbVfj3rmi31zeJcSJcXM1sC+yWSTPGT9aAPvf4NfFrSfjr8L9G8XaH9qOk69b/abb7TCYZdmSPmU9DkGupr4d/4Iwtq0nh7xVNa6P400P4c3mnaXc+HLPXL+a+tredp9SW7jsppXYtCqJZ/mK+4qAOJ+Ofx00f9nzwZDrWtQateR3d/b6Xa2mmWT3l3eXM8gjiijjXksWP6GuB8Zft6eGvhx8FNR8e+IvC/xI0HRdLvEtLmLUPDc0F0gYZE3ltz5XYtng9qP27XWPRfhYWYL/xc3w9yf+vqsbWfhBf/ABu+Mt54k+J11pL+DfBd68vhHwnbX6T295ImSmqXpOA85/5YxfdhGerEmgD2n4T/ABN0v4z/AAw8P+LtEkkl0bxNp8Gp2LyxlHaGZA6Er2OGFdJXlP7EGv2viz9jv4YatY6TZaDZ6p4Y0+7g0yzZ2t7COS3RlhjLkttUEAZPavVqAPKf2uf+RE0j/sLp/wCk89eE17t+1z/yImkf9hdP/SeevCaAPsyiiigAooooAKKKKAOL+OnwJ8LftKfDO+8H+NNNbWPDepvC93ZfaZYFuPKlSVAzRsrEb0U4zg4ra8beBtL+IfgzVPD+s2cN/o2s2kthe2sq5juIJEKPGR6FSR+NbPRaD8q1m4q1nsx3a2PCPF3/AATg+EnjDT/B8Mmia5pd14D0pdC0PU9H8T6ppeq2Wnqu0Whvre4S5eLH8LyN/OpZv+Cc/wAGbn9n21+F/wDwhNpH4Rsb/wDtW2jjurhL231DJIv0vA4uVu8nPniTzP8AaxXuOcpR/wAtKrfR/wBdRHivw0/4J/fCf4Wad4wgtvDM2uN4/t1s/ENz4m1W88Q3er26qUWCWe+lmkaIKThN2O+M1mfBr/gmb8H/AIE+N9C8Q6HoeuXWpeE4GtfD39t+J9U1uHw9Cy7WSzjvLiVIAR12AH0Ir34nKUmfko636gfP3xD/AOCYnwZ+J/xD8QeJtX8M6jJe+LpY7jX7OHxBqNvpevSxrtje7sYp1tpyo/vxnOOc12fwz/ZA+Hnwc1fwjfeG/Dw0258C+Gm8H6I4vLib7FpbPDIbf947b/mgiO98v8v3q9QoI3ChXX9eQbnmusfsmfD3xAvxGW+8N294vxaijh8WJPLLImsJHbi2QMrNtTEQC/IF9evNafwI+AXhv9m34cWvhXwnDqdvoljkwx3+rXWpSpk5P725kkkP4tXa+ZRj+VG39dtkB816r/wST+BOr+ILy+m8H3f2fUtV/t690NPEGpJ4evNQ6/aJNLFwLNmz6xY9q6r47fsAfDH9on4jW3i7xFpeuW/iS201tFfUdD8SajoVxdWLNua1meynhMkWecMTXtAGTThw9PWy8gPnfUf+CVH7P2rfDHTfBcvw10n/AIRXSNauPEVlpaXNylvbX9wjJLOqrIMMyu3HQZOAKzdc/Y38Mfsn+DPGni/4bfD/AMVfEL4i61pQ0hDqPiybUtUu7fpHbi81W5cRQIcHG7t0Pb6a/j+tH3kxUy1un1/4YI6O58q/Br/gm34Z1z9jT4I+DPihpMlx4u+Ffh6ysrbUtG1u70690i7W2SKY215aPFMBkEZDYOB9a9A8JfsAfCTwd8GPE3gCPwfBqXhnxpNJdeIo9Wu7jU7nXJnxulubm4d55nOPvM5I7Yr2kLmlHX+dW5czd+upMY2SXbY8R+Cf/BPn4W/AD4iweLND0rxBe+JLGxbS7HUdf8Uapr8+m2jdYLdr64mMKHHITH5Vt/Bz9jf4f/s/fEjxR4q8H6Pd6LqXjO5kvNWhj1W7ewmuJH8ySZLR5TbxO78s0cak16qOlFLW97j5dLHlfx8/Y2+Hv7THijwvrvi7R7y61vwbM82kajYard6Zd2nmACRPNtpY2aNwAGRiVPpXH/Fn/gmH8G/jN421/wAQav4f1y1v/GCCPxGmjeKNU0a28RKq7VF7BaXEUU+B/fUn619CUUxmP4O8H6X8PvCtjoeh2FnpOj6Tbx2llZWsKxQWsKKFSONFwFUAAAV84D/gjF+zlMVjufAuqalp63j6gNL1DxfrV5pZuHfzGkNlLdtb5Lc/6vHtX1KU9KdncKnd83UNtEed/F79l7wF8d/g03w98TeGdNvvB5SKOLTokNqln5WDE0BiKtCyYG1oypXtXG+BP+Ccvwn+Hs/iee30XWtX1DxlpD+H9Y1LX/Emp63qN3pzjBtBdXdxJMkXPRXFe6Y2Gjduo7ruHoeJfEf/AIJ9fC74p6b4Lh1DQdRsLj4e2S6b4fv9E1/UNH1LS7URCL7Ol5azR3Bj2gDBftnrnMunf8E/PhDpn7OeufCePwbbSeBfEzyzavZXF3cXNxqc8rB3nnupJGuJJywB81pC+QPm4Fe0K3NDNhqr16geVfDj9jfwD8LNa8M6npemalPqnhDS73RtLvtS1q81C5htLuWOa4jZ55XMgd4ozlySNowRXAWP/BJz4FaTrlvcweD75dNsdT/ty38PN4j1NvDkF9185dJNx9hDZ5/1WPavpX7y0itlqnW9w6WOP0D4K+HPC/xb8ReObHTvJ8T+KrOysNVvfNdjdQ2nm/Z1Kk7V2efL90DO45pfhP8ABbw38ErTWrfw1po02LxFrF34g1ECaSX7TfXUhknmJdjguxyQMD0Fdjjmk6CqB6i0MNwoooA85/Z8/ZX8A/sr6Vr1j4B8O2/h208Taxca/qccMskn2u+uCDLM29mILYHAwOOlc34i/wCCf/wl8V/AuP4a6h4Rjn8I22qTa5aW/wBvuhcWN/LcyXT3UFyJPtEM3nzSOHSQEFjjA4r2gruY00nJoA8T+H//AATz+FXw10/xhHZaDqWpXnj7Tm0nX9R1rxBqGr6nqdmyFDbve3U0lx5eCeA9Q+Ov+Cc3wp+IF94durjSdf0nUPCuhxeGbC+0DxRqmh3g0uMALZSzWdxE80PHSQn+de7ZzRQB4LZ/8E0vgjpvwK8QfDOz8B2dj4G8Tamus32lW17dQoL1fK2zwusoeBx5MWDCyfd9znrPBX7I3gL4f+IrXVrHR7ibU7Lw3/wiKXeoapd6hLJpfmeb9mkNxK/mZfku+XOcbscV6V1NL91qXl/W1g/r8f8AM+c/BX/BKT4H/D7xHouo6f4V1V4PDF8dV0TR7vxJqd3omjXfXzrbTpbhrWJ89CsYxXsPgv4LeG/AHj7xf4q0nT/suu+PLi2utcufPkc3slvbpbQnazFU2xIq4UDpzmuuopgcf8F/gn4b+AHghfDvhSwOl6Mt3d34tzcSzkT3VxJczvvkZmO6WV26/wAVeQ+Pv+CVnwR+JPifxBqeo+GdWhTxfdfbvEGl6d4l1PT9I1+fp5l3YwXCW87epdDnvX0ay7qM5OKAOLv/ANn/AMIal488I+Jm0WCPWvANpdWHh6aGWSKPTILlI0mjSJGEZVlhiGGU4CDGK7WiigDj/hT8EvDPwUstZg8M6aNNi8Qaxd6/qIE8kv2m+upDJPMS7HBdjkgYHtXkPiz/AIJU/BPxZ4r8Qawvh/xF4fuPFrNJrkHhrxfrHh+01h2+888FjdQxyMe5K5r6MRacOlTypAeVXH7F3wvuP2bpPg+fA/h1fhq9r9j/ALAS0C2oi69Bzv3fNv8AvZ5znmuS8C/8EyvhB8PrjWLqz0PXr/Uta0ObwzLf6z4r1XVry202Vdr2ttPc3MklrGf+mJQ179nnNOD1Xm+oLTRdDmf+FO+F2+FMfgaTQtNuPB8emro40i4gWe0azWMRCBkfIZNgC4OeBXglj/wR0+ANpbafYzeFte1Lw3pNyLuy8Nal4u1i/wDD1rMOAy6dPdPa/wDkPHtX1Fu4pN/FJXTutw6WPHPjf+wf8M/2gfGml+Jdc0jVLHxNo9m2m2ms+H9ev9A1GO0b71t9osZoZDEf7hbA7Yp3hz9hL4U+EvhHoPgPT/CNta+GfDWt2/iSytkuZ/M/tOC4FzHdyzb/ADZpfOActKzbiBnOBXsI6LTqW39edwOO1b4K+G9a+Mej+PrjThJ4q0HTbrR7K+86QGC1uXhkmj2A7G3PBEckZ+UYNcnqv7EHwy1zV9bvrnw15l54j8T6f4y1GU6hdBp9WsPK+yXI/efL5fkRYRcJ8gypr1nPNB5NNaWt/Wt/z1J5U/68rfkcnqnwX8N618YdG8fXGm+Z4r0HTLrR7G+8+QeRa3LwyTR7A2xtzwRHJBPyDBrivG37B3wp+I3hv4jaPrXhG3v9P+K17DqXieOS8uP+JhdQxRxRTKd/7l0SGIAxbPuCvYSfzozzSsv69b/mFtf67WPCPhz/AME2PhB8MfiPb+MLHw/q1/4utbS4sI9c1nxJqer6l9mnQJLCbi6uJJGRgBwTxjiutu/2Qfh7f/sz2Xwgm8Pb/h3p9lbadb6Qby4wkFuyPCnm7/N+Vo05354616bt+bNII+Kd0VY86vP2VPAGqXHxFkvPDdpef8LYjjg8WJcSSSx6xHHbC1RXRmKqBCNvyBfXrzXjv7R/7It58N/2BPEfwe+CPh+6uI/FiLoATVdak1JdIsrtkt7q4Z7+d3kSG2LFYQxyVAA5NfU4G0ZpueanlT/rougK6aa6HO/CH4WaP8Evhb4f8H+H7VbLQ/DWnw6bYwL0ihiQIg/ICuP/AGj/ANjL4cftYLo8njjQGv8AUfDsxudI1OzvrjTdS0mU8b7e6tpI5oz/ALr16oCooZMmne75nv8AqKOisjx34FfsH/DD9nPx/qXizw5oeoXHi7VoBa3Ova7rd9r2qvAvSEXV9NNMIx/dDYrmvHv/AAS2+CfxI8ceJNe1TwvqUknjC4W81/TovEGowaRrdwq7VmubGOdbeVwO7J9a+iFbNHQ/WnvuM8s+Hv7HXw5+FWoaVdaL4Zhhm0XwlD4FtPOuZrhY9FiO6OyKyOysgI7gk9CcV5Wf+CNf7PN3pEOl3ngzVtR0OxlM2m6Re+K9XuNM0Vy/mFrK2a5MVqd3eFUNfUxbFNzg09b36k8qseMfGv8A4J+/DH4+/Ej/AIS/XdN1+z8TSWP9l3GpaB4m1PQLm8tOT5Ez2NxC0ic9GJrV8EfsX/DP4ZP8P/7A8J2Okr8L4buDwwlpNNFHpa3SBLjCB9shkA+YyBj3znmvVqDRsrIrqeU/D/8AYs+GvwtufA02g+GhYyfDWDULbw032+6kOmx37B7sfPI3meYwBJk3EYGMYrS1j9l3wH4l8SeNdW1Lw3Y6ldfEbSrbQ/EgvC08GrWduJhFDJExMeFFxMOFH3zXolNYkGlvowvY8D+Df/BNL4R/Arx1oviTRdF1281bwvbPZ6FJrnijVNcTQIXGHSzjvbiZYAf9gA+9UdE/4JZfBPw94mg1K08ManFbWesf8JDbaH/wkmpt4ft9S3b/ALUmlm4Nmsm7niLHtX0ZTWGKOZ3v1QdGh1FFFMAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK8j8T/sGfBPxr4lv9Y1r4T/D3VtW1Wd7m8vbzQbaee6kc5Z3dkJJJ9TXrlFAGR4J8D6P8NvCtnofh/TLHRtH02MQ2tlZwrDBboOiqqgACteiigDn/iV8L/Dvxj8Jz6D4r0LSvEWi3TK01jqVqlzbyFSGUlGBBwRXmv8Aw7i+AP8A0Rf4Y/8AhOWn/wARXtVFAGb4f8PWPhXRLXTdNtbXT9P0+BLe2t7eNYoYIkXaqIo4VVHAA6VpUUUAeU/tc/8AIiaR/wBhdP8A0nnrwmvdv2uf+RE0j/sLp/6Tz14TQB9lKOadTS2DX5tf8Fhf+C2Ev7KmuXHw0+FrWd548VAdU1WSNbiDQd3SMR5+ec/3T0+vSqNGdWXJEipUUFzSP0lkOKE/Ov5m/gr8L/jd/wAFVPjHqGk23iPVfGGvWti+ozy63qzC3iiDxoAN35VjaJ8ZvjL/AME8vjhq/h/Q/Get+Gdd8K37WN7a2d951jLKn9+H5oZkr0/7Lfw865uxxfXlvyux/T2OtOU/LXw//wAEjP8AgrpY/t8aFJ4X8UQ2ui/EzR4POuLeHi31eEcG5t/9nPUV9vg8V5lWlKnJxktTupzU1zITNBqvdXItYJJGbEca7jxX5v8Ajr/gs18QNV+JGqN4J8B6dfeCNDmkS41G6nO24SD/AFrLcZWFQe2c9K9nI+Hcdm0pRwcV7qTbbSWvqeTm2eYXLYxliH8W1k2fpQeKFPzVwH7M3x4sf2lfgpoPjLT4xbw61B5jW/miU27gkMhYcZBFcz+3F8YfiH8AvgRqnjL4f+HfCfiRvDNvcapq9trurT6eBZQQPK5haKGXdJ8vAIA+tePiKM6NSVGorSi2muzR6VCtCtTjVpu6kro9por5l/Zr/bk1XxB4a0n/AIW9Z+E/CPiTxR4bn8baLpvh+7vtUjfQ4YYHlnmmktolSVTOo8sZPpmofGn/AAWH+APgLStNv9Q8Vaz9h1Lw/ZeKxc23hfVLmK10q8YrBeTtHbsIomIPL4qDY+oKK+L/AI3/APBYDwloXgnw1r/guS8vLH/hYOm+DvE8GreGdUttSsIru3knVobFo47hpZEVTH8pBz0PSt3W/wDgproXjnxd8Ix8Ppo77Q/GHjPUfCniddW0y8sNR0WS00u7u5ITBKsckc4e3AO5Tx0zQB9Z0V5f+zB+134J/bF8Fv4l8BXWsal4f3BYNRu9FvNOt70H+KE3EaeYvuB3rl/iH/wUt+CPw0t/F0uoePdOuIvAk1pbeIH0yGbUhpU11N5EEUv2dHKu0nG3rQB7xRXzta/8FRfg7cfC/UvFf9ta7Da6XrqeGLjTZvDeoxa1/asiLJHZrYNALlpWRgQAlek/Af8AaY8G/tI+Af8AhJPCerNdaal3Np04u7WWwubO6hbbLBNBOqSxSqRyjqDQB6BRXgvi3/gpL8I/Avj/AMbeHtU17VLe6+HMQk8STroF/JZ6PmOOWNZLlYTEXkSVCiKxZs8A1k33/BVb4M6H4MuNZ1XWPFGimy1m08P3Omah4Q1a31iG+uo/NtYWsGt/tIMycp+7wcigD6Qor5F8W/8ABUXQfEeu/Cu48Ayf2h4f8T+L9S8MeKY9R0e9tdX0aSz0q7vXgFpIscyz7rcA7lIweM13Wp/8FL/g9Z+CdJ8QW/iaTULHXvCF144077LYzu1zpdvtV5cbRtJZwqq2CWzQB9AUV8J6B/wWLvbTx7HY+I/BegWemQmZ9Vj0zWtRvNS0a3gljiuZ3Emlw2Nx9keaJLpba8lMBbJ3dK9E8G/8FXPAup+MPjJZ+INM8TeGdK+DmpJY3ur3Oi37Wt0jJAd277OAjl51UR5JPWgD6oorwv4q/wDBRX4TfBbWfEGm+IPEGoW994Z1LTNI1C3t9FvryZLvUUL2UKJDC7O0oHGAfeuT8C/8FaPg/wDGLUDo/hLWNeuNeuoNRjsYtT8LapptvJfWMTyXFi0txBGn2iIId8e7PpQB9QUV8L/A/wD4LIaF8Yv2Ok1xJoLf4un4dXfjJNLuvD2pWOj6jPa2pluVtJZgBcQxyfKdkxOD19PZPgF/wUG8GfFfxN4V8Dy3WoXHxJ1Pw5peuavY6bod9NY6WLyyF0jSXIjaGKNvmC75M9BQB9CUV4Pdf8FI/hBZ/G9vh/J4jvk1lNVOgyXbaLejSItSEXnGybUPK+yify/m2eZn8eKzPh7/AMFT/gn8T11iTSfEmp/Z9I0S78SRz3fh/ULOHV9NtR+/u7CSWFVvI06EwF6APouivk2P/gtT+z7dOUXxF4rX93aXTNJ4K1qJY7K6O23v2ZrUBbV24Ex+Wvc/hx+034C+Lnj/AMSeFPD/AIq0jUPFPg+4a21jRhN5eoaewONzwNiTy242yAFG7E0Ad/RRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRXzr+0B+2ppt3o3iDwf8L9Uj1v4qJcJpdtZJZTvHp1y7Y3zt5exEUZJJPpXQfAn9tbwf8AFG40Pw3e6k+mfEC8shLd6DdWc8N1DIi/vRh0AwDnvQB7VRRRQAUV8j/Fv48+IPjN8c9Q8Lad4s8R/DvwL4d8TWvgqfU9B0tL3VfEWt3Nm07W6SNHMtlbQRyQM07x/eJG4DBqn4e+LniX9mf47/2TceOPGHxE8B/8JHYeEtZPibTlg1DQL+/wbKe3uUhhS6tWkkhhf720nIJ5BAPsSiiigAorxz9tH9tDwn+xH8K18QeJLi3kvtTuBp+i6Y93Havqt2w+WPzZDsijHBeV/kjU5PUAxfCX9uf4W+PdO0CwuPip8I5vF2qQwxzaXpHjCyvc3bIC8UOJN8nzZx8uSKAPaKKKKACiivPfCnxG8Rav+0F4q8N3dl4cj8O6RYWlzYXNvqqy6nJJID5gntfvRJx8jH72DQB6FRRRQB5T+1z/AMiJpH/YXT/0nnrwmvdv2uf+RE0j/sLp/wCk89eE0AfUHx2+Iq/B34JeMPFzx+ZH4W0S91dk/vi3geXH/jlfyp+N/GWpfEbxlqmvaxdSahrGuXcl7eXL/fuJZX3O9f1QftJ/DmT4xfs6ePvCMB2zeKfDuo6RGT2a4tpIh+r1/Knqelz6NqlxZ3cUlvdWcrQTQv8AI8br8ro1e5k1rT7nm5hfQ/oO/wCCKf7Lfwx+B/7M2meJPBl9DrHiTxjpljdeI7v7alzJbztCJPs52/cCljwfSviP/guR+xr8Gfhtpvib4j+GvGj6l8R9e8UD+0tG/tm2kS287zGm/wBGUbxXuX/BsJq1vcfs2fESz81DcQ+IUlkjH8KvACP618Bf8FY/2YPiH4A/az+KHjTVvCeuaf4R1TxRP9j1V4P9FuPN+ZNr1NCL+ty5pf8ABJqS/wBnWh4v+yD8eNQ/Zm/aW8FeObCZ4ZPD2rw3E4/562/3LmH/AHGjr+qRDla/lC+AXwqvPjt8b/CXg3TVaS68S6vb2CqpwAJW2u9f1erytZ5xbmj3Ly+/K7kUse+Jl/vDk18J/FL/AIIiaP438e6ldaX488QaJ4Z1rUF1O/0ZMSRSzjuCe1fdpfYPmPek+0pu+8tTlOe47LJSngp8rlo9E729RZhlGFxyjHEx5kttzmfg58KNL+CHw00fwroqyLpmh2y2tuJG3MEHqar/AB8+Fp+N3wM8XeDftn9m/wDCWaNd6ObsReb9lE8LxGTZld2N2cZFdabmP+8tBuI/7y/nXm1ak6k3UqO8pO7fds76dKNOCpwVktj5O+Nn/BNrxL43X4b3HhH4nW3hXU/BPgW7+Ht9cXfhldRTU9PuYrZJZI4/tEYt5s2ykEFh82Og55ey/wCCN5tPgj4k8F/8LGOzxD8K9D+GZvBoI3Qf2bLcSC9CfaMHzDOcxZAGPvGvtv7XD/eWj7XD/eWpLPkD4yf8Eu9b8d+PPEPijw78TY/DGuap450PxxZzyeHRfrYy6Xp/2JLdkNwnmpIvJyRj3qHwX/wSv1aw8V6T4q8SfEaHXfF8fjvUPHWtX0Wgm3t9SluNIfSoreKE3D+QkMBGCCxJzX2L9rh/vLR9rh/vLQB5h+y5+zNa/s7fskeEfhPfagviaz8M6DHoU949qLYahGqbGYxBmC7gegY14e3/AASP0nwh8H7n4deCfHfiPRPh4uv6Pr+meHNSiTU7XQJLHUY75ktpSUuNkrRgFZpZcde+K+v/ALXD/eWj7XD/AHloA+Svin/wTJ1LxX4/8VeM/D/xC/sHxhqPj+z+IGhXk2j/AGmDSLiDSl0x7eWITJ9ojkhBzkqRXQfBL/gmX4H0bwPq1v8AFrRfBfxp8T+IfEl54r1HVde8K2slul7ciNGFtbzed5CLHDEoAY525zzgfSv2uH+8tH2uH+8tAHyt8U/+CYWmfFj4efHzw9qXiBUtvjZrdjrkITS49uiSWdvaRwqULFZwHtFY5AGD0rw/4p/8EzPHnwn8F+BbfwXe+BbfxZf/ABV0TXLjUvCHw4ttH0rw7a2tvPGJZbSOZpbhBkbnmuD94dO/6M/a4f7y0fa4f7y0AfGXhf8A4Jyax8Kdb074keJPGV5418aaH45v/iPrK6R4fWFvEMsmkSaZHY20DXBEWyDGPmO48cda8/8A2EP+CZv/AAkfwr+OupeJNG8V+ALX4t3F3pXhPRtW8ptS8HaH58l1EgjV3SItezzz+Tnj5eea/Q37XD/eWj7XD/eWgD4E+Gn/AAS08Z+K/Hn2f4l3klr4ZQ6mZT4d8bGS1ul1CZZr63j0+bR1kigvXBeUNfSSQcJDIByPRfi9/wAEx9S+Jcnx+0+z+I39k+GfjpDa3LWH9gpNNoWp28VpFHcpP5qmWPbaL+5YKPm6+v1t9rh/vLR9rh/vLQB8W+Hf+CVHiq/+J2peNPGXxY0/xD4i1jxf4a8W3Js/Cn2C2RtGieJLaNPtb4jkRzk9sdDW/pf/AAS9fTPEOh3/APwm/mf2P418VeMBGdJO2Q65BcQmD/X9IROSD/FjoK+s/tcP95aPtcP95aAPhP4ef8EfPFWl+A/Dnhnxd8ZLfxVpXgLwJqfgrwsLbwimnPZfb7QWst3cf6TKJ3EajA+UE5PXOfTvh/8AsA+KPgxaeN7rwZ8UP7D8SeLNC8N6Ja6q/h2K8/sv+yLb7MZfJklKSmdM5DY256nGa+nvtcP95aPtcP8AeWgD5T8Lf8E+/HXgLx74ps9G+LxsfhP4z8QX/iTV/DC+GbeXUbqW+jK3Np/aEjsFtmc78i383JI3964nwZ/wSI8UR+HLDRfF3xgXxHpHg3wPq3gbwZFb+GhYy6VBfWotftF04uG+1yRxKAAQgJyeCTn7i+1w/wB5aPtcP95aAPjzx3/wSibxz4U8VaW3j5rVPEvw98OeAvN/sfzGt10i4knF1jzxuMpfBUkbQOpr0rSf+Cf/AIa1H9qW3+MPjDWNf8b+MtCM0fhgX0q29j4Ut5Rhoba3hCI2Rn55vMfnqK95+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loAloqL7XD/eWj7XD/eWgCWiovtcP95aPtcP95aAJaKi+1w/3lo+1w/3loA+ZP2hPAfxJg/bN0HxD8LfDOkrcP4YvLTWNY1O4a306aaSa3W2+0JF+8uDEkcxVe27qKv/ALFngrxlpvxZ+K2ufEXwxDpfibWNUtprK/W7+2RvZG0hRre3kPzJAs8MrLGf7/NfRn2uH+8tH2uH+8tAEtFRfa4f7y0fa4f7y0AfF/7S/hH4jfAfxV8RF8MzeNdJ8H/EfU4PElv4m8F6Gms6n4Z1RbeK3uI7jT8F7m2lS3ifcgyp3A+tYHwA8F/FD9oebwt4Z1/X/iF4u8J6H4nsvF2veMfGHhj/AIRf+1fsUgnsdO0/TWAcxGeKKaSZ+wHUkAfd/wBrh/vLR9rh/vLQBLRUX2uH+8tH2uH+8tAHn/7TX7M3hf8Aau+GE/hbxVau8PmLdWN5AQl3pV0mfLubd8ZSVCcgiuO+Nn7Gej/E39kbxB4Fk0vw5rXiW88NTadbaveaZBatLqP2crHdt5SDym87bJ8g47V7j9rh/vLR9rh/vLQBifCzSdS8P/DLw7p+tTrc6xY6XbW9/MpyJZ0iVZGB92BP410FRfa4f7y0fa4f7y0AS15L4D+EuteHv2tPHni648P/AA9tdD8Q6bYW9rq9ilx/wkV/JCu147wsPK8pP+Wew5xjNeq/a4f7y0fa4f7y0AS0U2OUSDinUAeU/tc/8iJpH/YXT/0nnrwmvdv2uf8AkRNI/wCwun/pPPXhNAH2Vswa/In/AILSf8EXte8V+PdW+L3wj0uXV7jV2Nz4h8P243XMs563VsvTfjqK/XimsNtbUK8qUuaJnVpRqR5ZH8xv7GH7dnxF/wCCc3xR1G/8MLErXi/ZtV0fVIH8m48v+8vyujrXvH7XP/BYn4nf8FJ/h2PhTp/w90dP7cnhJtdMtrm/v55UfcnlDpX7ifEX9mr4d/GG587xZ4B8GeKJl6SavoltesPxlRjVv4c/ArwV8HInTwj4P8LeFkkGHXSNKgsg31ESLmu6WYU5S9pye8cccHNLl5tD4E/4Iof8Eer39la5X4pfEq2jXx3eW7RaVpQO4aDDJ98ue87dyOg9+n6TJy1KowKT/lpXn1q0qs3KR206ahHliQ6l/wAe/wDwIVn1oal/x7/8CFZ9ZlhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBb0n7sn4fyq7VLSfuyfh/KrtAHlP7XP8AyImkf9hdP/SeevCa92/a5/5ETSP+wun/AKTz14TQB9mUUUUAFFFFABRRRQBX1L/j3/4EKz60NS/49/8AgQrPoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAq5pluCvmlfmY1TrQ03/AI9/+BGgCxRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUV3CJYWz6VLUd1/qTQBl0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBb0n7sn4fyq7VLSfuyfh/KrtAHlP7XP/IiaR/2F0/8ASeevCa92/a5/5ETSP+wun/pPPXhNAH2ZRRRQAUUUUAFFFFAFfUv+Pf8A4EKz60NS/wCPf/gQrPoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArQ03/AI9/+BGs+tDTf+Pf/gRoAsUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVHdf6k1JUd1/qTQBl0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBb0n7sn4fyq7VLSfuyfh/KrtAHlP7XP/IiaR/2F0/9J568Jr3b9rn/AJETSP8AsLp/6Tz14TQB9mUUUUAFFFFABRRRQBX1L/j3/wCBCs+tDUv+Pf8A4EKz6ACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK0NN/49/wDgRrPrQ03/AI9/+BGgCxRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAFXVtVh0TTp7u4YR29rG0srn+FVGTXz4n7TMOqfHm3vpL69svC9rFJAYw7lLhtj7XaIf54FfQd/p8Wq2ctvcRrJbzKySIw4dTXzH4b8J6Q/7WU+kz2Fp/Zn2q4jW2YfJnyXK8UAe5az8fPC+gRae91ftGuqQLc2x8l/3iHoelSeM/jn4b8Aa1/Z+qXjwXexX2LC78Hp0FeJ/tf6bBonjXw/bW0McNvBYBIkAwkaLIa3f227O0S10WZYrcXczuGlCKZGRQDjJoA9R8U/G7w34KjsW1C+a3/tKH7Rb/uXbzE654HvWffftMeDdPEO7VvM89VdfLhduG6dq4X9ozT7eT9nXQbh7eH7QjWsSSFRvjUxt8obqKxYvhtosf7Jza19gh/tRo/N+04/eZ8/ZQB614g/aJ8I+GxD5+rRt9oUMnkxtJkfgKyvjLqreN/hBLrfh7xBd2MenhrvzrKRkM4VSDE2Oep/SuA+DPww0LxD+z/rOqXWnxT3zLcESuOU8tONtU/gnOX/Z08cRO3yxggfiDQBt/AH9oPTfD3gS4/4SjXLq4vmv3ERmaW5kMWyPHOD6n867L4na6vxG+E1xq/hnxBPZLpu65eW1kaNpNiEmJscjqK8+/Ze+HHhvxX8PtautWs7e6nSd1cuuWgTYGyvp1/SsP4Azuvgj4hRL/wAe403I+u1v/r0Ad9+zH8RZh8L9a1bxBql5cw2FyS811O1w8aBR/j2rqk/ad8FvZTXA1b93BjefJfv+Fch+xtYQal8OtYguIY7mCS9w0ciB0f5B1B4NcD+zP8NtJ+IfjvVI9Ut/tFvYwmSOEjbG+XxmgD6d8MeJLXxdoNtqVizPa3aeZEzLtJH0rQqnoehWvhrSYbGyhWC2tl2RoOiirlABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFR3X+pNSVHdf6k0AZdFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAW9J+7J+H8qu1S0n7sn4fyq7QB5T+1z/yImkf9hdP/AEnnrwmvdv2uf+RE0j/sLp/6Tz14TQB9mUUUUAFFFFABRRRQBX1L/j3/AOBCs+tDUv8Aj3/4EKz6ACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK0NN/wCPf/gRrPrQ03/j3/4EaALFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFeV/FH9lzTfiP4kbVItQuNJu5h++McSyLKfUgmvVKKAPNfFX7NmneLfA+kaTPf3SXOjQiGG8RBuZf9pehrl5v2K7W503bN4ivJbzOPPa3G0J/dCb8D869yooA8n8SfsyzeJPB+laPL4o1HydN35Zot4nycrld2Pl7Uf8ADMk3/Ct/+Eb/AOEo1D7P9q8/zPJ/gxjy9u7GK9YooA8j0P8AZiutB8Iaho8Piu/SHUNv3ImVI/7+F8zHzU3wd+yyfCNhq1oniS8ktNWtGtnh+z7FQt/GPm6+1evUUAeGr+xbDb6W0Nv4mvYZpDiVxbgpIn93Zvx+tdBF+zLa6X8ObjQdN1i8sJLydZbm8RcPOqrt8sqrL8uO2a9SooA8n8Dfs03HgKHUobXxRqCx6hbNCBHEY/JkZg3mjD9eCPxo+Fv7MrfC3xZHqkPiK4uAoYSwfZhGk4Ix83zHp1r1iigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqO6/1JqSo7r/AFJoAy6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAt6T92T8P5VdqlpP3ZPw/lV2gDyn9rn/kRNI/7C6f8ApPPXhNe7ftc/8iJpH/YXT/0nnrwmgD7MooooAKKKKACiiigCvqX/AB7/APAhWfWhqX/Hv/wIVn0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVoab/AMe//AjWfWhpv/Hv/wACNAFiiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBNgo2ClooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACo7r/AFJqSo7r/UmgDLooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigC3pP3ZPw/lV2qWk/dk/D+VXaAPKf2uf+RE0j/sLp/6Tz14TXu37XP8AyImkf9hdP/SeevCaAPsyiiigAooooAKKKKAK+pf8e/8AwIVn1oal/wAe/wDwIVn0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVoab/wAe/wDwI1n1oab/AMe//AjQBYooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqO6/1JqSo7r/UmgDLooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigC3pP3ZPw/lV2qWk/dk/D+VXaAPKf2uf+RE0j/sLp/6Tz14TXu37XP/ACImkf8AYXT/ANJ568JoA+zKKKKACiiigAooooAr6l/x7/8AAhWfWhqX/Hv/AMCFZ9ABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFaGm/8e/8AwI1n1oab/wAe/wDwI0AWKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKjuv9SakqO6/1JoAy6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAt6T92T8P5VdqlpP3ZPw/lV2gDyn9rn/AJETSP8AsLp/6Tz14TXu37XP/IiaR/2F0/8ASeevCaAPsyiiigAooooAKKKKAK+pf8e//AhWfWhqX/Hv/wACFZ9ABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFaGm/8e//AAI1n1oab/x7/wDAjQBYooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqO6/1JqSo7r/AFJoAy6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAt6T92T8P5VdqlpP3ZPw/lV2gDyn9rn/kRNI/7C6f8ApPPXhNe7ftc/8iJpH/YXT/0nnrwmgD7MooooAKKKKACiiigCvqX/AB7/APAhWfWhqX/Hv/wIVn0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVoab/AMe//AjWfWhpv/Hv/wACNAFiiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACo7r/AFJqSo7r/UmgDLooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigC3pP3ZPw/lV2qWk/dk/D+VXaAPKf2uf+RE0j/sLp/6Tz14TXu37XP8AyImkf9hdP/SeevCaAPsyiiigAooooAKKKKAK+pf8e/8AwIVn1oal/wAe/wDwIVn0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVoab/wAe/wDwI1n1oab/AMe//AjQBYooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqO6/1JqSo7r/UmgDLooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigC3pP3ZPw/lV2qWk/dk/D+VXaAPKf2uf+RE0j/sLp/6Tz14TXu37XP/ACImkf8AYXT/ANJ568JoA+zKKKKACiiigAooooAr6l/x7/8AAhWfWhqX/Hv/AMCFZ9ABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFaGm/8e/8AwI1n1oab/wAe/wDwI0AWKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKjuv9SakqO6/1JoAy6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAt6T92T8P5VdqlpP3ZPw/lV2gDyn9rn/AJETSP8AsLp/6Tz14TXu37XP/IiaR/2F0/8ASeevCaAPsyiiigAooooAKKKKAK+pf8e//AhWfWhqX/Hv/wACFZ9ABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFaGm/8e//AAI1n1oab/x7/wDAjQBYooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqO6/1JqSo7r/AFJoAy6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAt6T92T8P5VdqlpP3ZPw/lV2gDyn9rn/kRNI/7C6f8ApPPXhNe7ftc/8iJpH/YXT/0nnrwmgD7MooooAKKKKACiiigCvqX/AB7/APAhWfWhqX/Hv/wIVn0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVoab/AMe//AjWfWhpv/Hv/wACNAFiiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACkJxQGzS0AIowKRlJNOAwKKAEHB6UpOBRRQA0Y20dB92nUm2jUBaKKKACiiigAooooAQ8dqUU0IAf/r06kAA5FNJG6nUm36/nQAmcdqcDmmrGF9fzp1ABRRRTAYWVVpPvCneWvpS7BS1D1FooopgFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVHdf6k1JUd1/qTQBl0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBb0n7sn4fyq7VLSfuyfh/KrtAHlP7XP/IiaR/2F0/9J568Jr3b9rn/AJETSP8AsLp/6Tz14TQB9mUUUUAFFFFABRRRQBX1L/j3/wCBCs+tDUv+Pf8A4EKz6ACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK0NN/49/wDgRrPrQ03/AI9/+BGgCxRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFBOBRRQA1KdTEGHan0l5AFFFFMAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKjuv9SakqO6/1JoAy6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAt6T92T8P5VdqlpP3ZPw/lV2gDyn9rn/AJETSP8AsLp/6Tz14TXu37XP/IiaR/2F0/8ASeevCaAPsyiiigAooooAKKKKAK+pf8e//AhWfWhqX/Hv/wACFZ9ABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRR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";

    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, 832, 772);

      const avatar = new Image();
      avatar.crossOrigin = "anonymous";
      avatar.src = img;

      avatar.onload = () => {
        ctx.drawImage(avatar, 389, 134, 75, 75);

        ctx.fillStyle = "#57b2e0";
        ctx.font = "20px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(username, 832 / 2, 253);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      avatar.onerror = () => {
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
    };

    bg.onerror = () => resolve(null);
  });
}

// ==================== IMAGE SEND ====================

async function sentBasesixfour(base64) {
  function base64ToBlob(base64) {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const binary = atob(parts[1]);

    const array = [];

    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }

    return new Blob([new Uint8Array(array)], { type: mime });
  }

  const input = await waitForElement('input[type="file"]', document.body, 8000);

  if (!input) return false;

  const blob = base64ToBlob(base64);
  const file = new File([blob], "upload.jpg", { type: blob.type });

  const dt = new DataTransfer();
  dt.items.add(file);

  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "files"
  ).set;

  nativeSetter.call(input, dt.files);

  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));

  await wait(2500);

  const sendBtn = document.querySelector('button[aria-label="Send"]');

  if (sendBtn && !sendBtn.disabled) {
    sendBtn.click();
  } else {
    return false;
  }

  await wait(1500);

  return true;
}

// ==================== MAIN LOOP ====================

async function sendToAllPending() {
  if (isSending) return;

  isSending = true;
  stopSending = false;

  const startBtn = document.getElementById('tsStartBtn');
  if (startBtn) startBtn.innerText = '⏳ Listening...';

  while (!stopSending) {
    const allData = await getAllFromDB();
    const pending = allData.filter(d => d.msg === false);

    if (pending.length === 0) {
      await wait(3000);
      continue;
    }

    for (let i = 0; i < pending.length; i++) {
      if (stopSending) break;

      const item = pending[i];

      // Generate image first before opening chat
      const base64 = await imgGen(`@${item.username}`, item.image);

      // Send text message (this opens the chat window)
      const sent = await sendMessageTo(item.username, 'Please don’t ignore this. I made a mistake and reported your account after someone pretending to be you scammed me. Now support says your account is at risk. I’m really sorry—please contact olivergriits on Discord, ticket 40557035.');
      if (!sent) continue;

      // FIX: Chat already open, send image immediately after text
      if (base64) {
        await wait(300);
        await sentBasesixfour(base64);
      }

      const memItem = collectedData.find(d => d.username === item.username);
      if (memItem) memItem.msg = true;

      await updateMsgInDB(item.username, true);
      console.log('✅ Done:', item.username);

      await wait(800);
    }

    await wait(3000);
  }

  isSending = false;
  if (startBtn) startBtn.innerText = '▶ Start Messaging';
}

// ==================== SCRAPE FLOW ====================

function startScrape() {
  const ftU4D = document.querySelector('.ftU4D');
  if (!ftU4D) return false;

  getAllFromDB().then(function (existing) {
    collectedData = existing;

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
      }
    }, 800);
  });

  return true;
}

function waitForContainerThenScrape() {
  const bodyObserver = new MutationObserver(function () {
    const ftU4D = document.querySelector('.ftU4D');

    if (ftU4D) {
      bodyObserver.disconnect();
      startScrape();
    }
  });

  bodyObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  setTimeout(function () {
    bodyObserver.disconnect();
    isScrolling = false;
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

// ==================== INIT ====================

injectUI();