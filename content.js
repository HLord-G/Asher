 





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
let version = "6.0"




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
  <div style="position:fixed;bottom:20%;left:0%;padding:10px;border-radius:8px;z-index:9999;display:flex;flex-flow:column;align-items:end;">

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

    // fast skip kung restricted
    const restrictEl = document.querySelector(`div[aria-label="Reply restricted"]`);
if (restrictEl && restrictEl.innerText.trim() !== "") {
      clearInterval(interval);
      if (typeof onTimeout === "function") onTimeout();
      return;
    }

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
      console.log("🚫 Restricted detected — fast skip");
      isRestricted = true;
      $("[owl_clsoe_com]").click();
      if (commentObserver) { commentObserver.disconnect(); commentObserver = null; }
      clickonce    = false;
      isProceeding = false;
      isWorking    = false;
      setTimeout(() => triggerNext("restricted fast skip"), 500); // 0.5s ra ang delay
      return;
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

          const myComments = ($('[comments]').val().match(/\[(.*?)\]/g) || [])
            .map(x => x.replace(/[\[\]]/g, '').trim().toLowerCase());

          const isDuplicate = msg.some(x => 
            myComments.includes(x.comment.trim().toLowerCase())
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
          window._sentComments = window._sentComments || [];
          window._sentComments.push(freshComment.trim().toLowerCase());

          
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
  window._sentComments = window._sentComments || [];
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






 
/* =========================================================
   APP STATE
========================================================= */

const AppState = {

  running:false,
  sending:false,
  activeUsername:"",
  reloadStop:false

};


/* =========================================================
   HELPERS
========================================================= */

const Helper = {

  wait(ms = 500){

    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });

  },

  waitForElement(selector, root = document, timeout = 10000){

    return new Promise(resolve => {

      const existing = root.querySelector(selector);

      if(existing){
        resolve(existing);
        return;
      }

      const observer = new MutationObserver(() => {

        const el = root.querySelector(selector);

        if(el){

          observer.disconnect();
          resolve(el);

        }

      });

      observer.observe(root,{
        childList:true,
        subtree:true
      });

      setTimeout(() => {

        observer.disconnect();
        resolve(null);

      }, timeout);

    });

  }

};


/* =========================================================
   ERROR LOGGER
========================================================= */

window.addEventListener("error", e => {

  console.log("JS ERROR:", e.message);

});

window.addEventListener("unhandledrejection", e => {

  console.log("PROMISE ERROR:", e.reason);

});


/* =========================================================
   INDEXED DB
========================================================= */

function openTumblrDB(){

  return new Promise((resolve,reject) => {

    const request = indexedDB.open("tumblr_msg_db",1);

    request.onupgradeneeded = function(e){

      const db = e.target.result;

      if(!db.objectStoreNames.contains("users")){

        db.createObjectStore("users",{
          keyPath:"username"
        });

      }

    };

    request.onsuccess = e => resolve(e.target.result);

    request.onerror = e => reject(e);

  });

}


/* =========================================================
   SAVE USER
========================================================= */

async function saveUser(data){

  const db = await openTumblrDB();

  return new Promise(resolve => {

    const tx = db.transaction("users","readwrite");

    const store = tx.objectStore("users");

    const request = store.put({

      username:data.username,
      img:data.img || "",
      lastMsg:data.lastMsg || "",
      unread:data.unread || false,
      msgLvl:data.msgLvl || 0,
      created:Date.now()

    });

    request.onsuccess = () => {

      console.log("USER SAVED:", data.username);

      resolve(true);

    };

    request.onerror = () => {

      resolve(false);

    };

  });

}


/* =========================================================
   GET USER
========================================================= */

async function getUser(username){

  const db = await openTumblrDB();

  return new Promise((resolve,reject) => {

    const tx = db.transaction("users","readonly");

    const store = tx.objectStore("users");

    const request = store.get(username);

    request.onsuccess = () => {

      resolve(request.result);

    };

    request.onerror = () => {

      reject(request.error);

    };

  });

}


/* =========================================================
   UPDATE USER
========================================================= */

async function updateUser(username, updates = {}){

  const db = await openTumblrDB();

  return new Promise((resolve,reject) => {

    const tx = db.transaction("users","readwrite");

    const store = tx.objectStore("users");

    const getReq = store.get(username);

    getReq.onsuccess = () => {

      const user = getReq.result;

      if(!user){

        resolve(false);
        return;

      }

      const updated = {
        ...user,
        ...updates
      };

      const putReq = store.put(updated);

      putReq.onsuccess = () => {

        resolve(true);

      };

      putReq.onerror = () => {

        reject(putReq.error);

      };

    };

  });

}


/* =========================================================
   SET MESSAGE
========================================================= */

async function setMessage(message = ""){

  const textarea = document.querySelector(
    'textarea.xXTjk'
  );

  if(!textarea){
    return false;
  }

  textarea.value = message;

  textarea.dispatchEvent(
    new Event("input",{ bubbles:true })
  );

  textarea.dispatchEvent(
    new Event("change",{ bubbles:true })
  );

  return true;

}


/* =========================================================
   CLICK SEND
========================================================= */

async function clickSendButton(timeout = 10000){

  const start = Date.now();

  while(Date.now() - start < timeout){

    const btn = document.querySelector(
      'button[aria-label="Send"]'
    );

    if(btn && !btn.disabled){

      btn.click();

      console.log("MESSAGE SENT");

      return true;

    }

    await Helper.wait(300);

  }

  console.log("SEND TIMEOUT");

  return false;

}


/* =========================================================
   SCAN UNREAD
========================================================= */

async function scanUnreadMessages(){

  const buttons = [
    ...document.querySelectorAll(
      'button[aria-label="Conversation"]'
    )
  ];

  for(const btn of buttons){

    const unread = btn.querySelector(".Y8xri");

    if(!unread){
      continue;
    }

    const username = btn.querySelector(".pTvJc")
      ?.innerText
      ?.trim();

    if(!username){
      continue;
    }

    const img =
      btn.querySelector("img")
      ?.src || "";

    const lastMsg =
      btn.querySelector(".FZe6i")
      ?.innerText || "";

    await saveUser({

      username,
      img,
      lastMsg,
      unread:true

    });

  }

}


/* =========================================================
   OPEN UNREAD
========================================================= */

async function openUnreadMessages(callback){

  let maxLoop = 100;

  while(maxLoop-- > 0){

    const unreadButtons = [
      ...document.querySelectorAll(
        'button[aria-label="Conversation"]'
      )
    ].filter(btn => {

      return btn.querySelector(".Y8xri");

    });

    if(!unreadButtons.length){

      console.log("NO MORE UNREAD");
      break;

    }

    const btn = unreadButtons[0];

    const username = btn.querySelector(".pTvJc")
      ?.innerText
      ?.trim();

    if(!username){
      continue;
    }

    AppState.activeUsername = username;

    btn.scrollIntoView({
      behavior:"smooth",
      block:"center"
    });

    await Helper.wait(1000);

    btn.click();

    await Helper.wait(2000);

    if(callback){

      await callback(btn);

    }

    const closeBtn = document.querySelector(
      'button[aria-label="Close"]'
    );

    if(closeBtn){

      closeBtn.click();

    }

    await Helper.wait(1200);

  }

}


/* =========================================================
   SEND FLOW
========================================================= */

async function processMessage(){

  if(AppState.sending){
    return;
  }

  AppState.sending = true;

  try{

    const user = await getUser(
      AppState.activeUsername
    );

    if(!user){
      return;
    }

    const level = Number(user.msgLvl || 0);

    if(level === 0){

      await setMessage(
        document.getElementById("firstmsg")?.value || ""
      );

      await Helper.wait(800);

      await clickSendButton();

      await updateUser(user.username,{
        msgLvl:1
      });

    }

    else if(level === 1){

      await setMessage(
        document.getElementById("secondmsg")?.value || ""
      );

      await Helper.wait(800);

      await clickSendButton();

      await updateUser(user.username,{
        msgLvl:2
      });

    }

    else if(level === 2){

      await setMessage(
        document.getElementById("thirdmsg")?.value || ""
      );

      await Helper.wait(800);

      await clickSendButton();

      await updateUser(user.username,{
        msgLvl:3
      });

    }

  }catch(err){

    console.log(err);

  }finally{

    AppState.sending = false;

  }

}


/* =========================================================
   RELOAD TIMER
========================================================= */

async function reloadTimer(seconds = 30){

  AppState.reloadStop = false;

  let start = Date.now();

  while(Date.now() - start < seconds * 1000){

    if(AppState.reloadStop){
      return false;
    }

    await Helper.wait(500);

  }

  if(AppState.reloadStop){
    return false;
  }

  console.log("RESTARTING FLOW");

  await startAutomation();

}


/* =========================================================
   STOP TIMER
========================================================= */

function stopReloadTimer(){

  AppState.reloadStop = true;

}


/* =========================================================
   START AUTOMATION
========================================================= */

async function startAutomation(){

  if(AppState.running){
    return;
  }

  AppState.running = true;

  try{

    console.log("STARTING");

    await scanUnreadMessages();

    await openUnreadMessages(async () => {

      await processMessage();

    });

    const timer =
      Number(
        document.getElementById("timerr")?.value || 30
      );

    await reloadTimer(timer);

  }catch(err){

    console.log(err);

  }finally{

    AppState.running = false;

  }

}


/* =========================================================
   STOP AUTOMATION
========================================================= */

function stopAutomation(){

  AppState.running = false;

  stopReloadTimer();

  console.log("STOPPED");

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

document.querySelector("#tsStartBtn")
?.addEventListener("click", async () => {

  await startAutomation();

});


document.querySelector("#tsStopBtn")
?.addEventListener("click", () => {

  stopAutomation();

});


 






