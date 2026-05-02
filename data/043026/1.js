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
          // ✅ Default replay: 0
          const newItem = { ...item, replay: 0 };
          const putReq = store.put(newItem);
          putReq.onsuccess = function () { resolve('saved'); };
          putReq.onerror = function () { reject(putReq.error); };
        }
      };

      getReq.onerror = function () { reject(getReq.error); };
    });
  });
}

function updateMsgInDB(username, msgStatus, replayCount) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const getReq = store.get(username);

      getReq.onsuccess = function () {
        const record = getReq.result;
        if (record) {
          record.msg = msgStatus;
          if (replayCount !== undefined) record.replay = replayCount;
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

  
  const userx = document.createElement('input');
  userx.id = 'userx';
  // userx.innerText = 'Bot Setup';
  userx.style.cssText = `
    padding:10px 12px;
    margin-bottom:10px;
    cursor:pointer;
    color:#1d1d1d;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    width:79%;
  `;



  

  wrapper.appendChild(startBtn);
  wrapper.appendChild(stopBtn);

  target.prepend(wrapper);
  target.prepend(purpleBtn);
  target.prepend(userx);
  persistentInput("userx");

  // I-add sa injectUI startBtn click handler
  startBtn.addEventListener('click', function () {
    sessionStorage.setItem('tsAutoStart', 'true'); // ✅ Mark para auto-start after reload
    stopSending = false;
    sendToAllPending();
    autoScrollAndScrape();
  
    setTimeout(() => {
      document.querySelector('[aria-label="Messages"]')?.click();
    }, 900);
  });
  // I-add sa INIT section (katapusan sa code)
  // Auto-start kung nag-reload
  if (sessionStorage.getItem('tsAutoStart') === 'true') {
    setTimeout(() => {
      injectUI();
      setTimeout(() => {
        stopSending = false;
        sendToAllPending();
        document.querySelector('[aria-label="Messages"]')?.click();
      }, 2000);
    }, 1500);
  }



  stopBtn.addEventListener('click', function () {
    stopSending = true;
    isSending = false;
    sessionStorage.removeItem('tsAutoStart'); // ✅ Clear para dili na mag-auto start after reload
  
    const btn = document.getElementById('tsStartBtn');
    if (btn) btn.innerText = '▶ Start Messaging';
  
    console.log('⏹ Stopped. Auto-start cleared.');
  });
}

function setStatus(msg) {
  console.log('[Status]', msg);
}



function persistentInput(id){
  const el = document.getElementById(id);
  if(!el) return;

  const key = id; // mao na mismo ang key

  // load
  const saved = localStorage.getItem(key);
  if(saved !== null){
      el.value = saved;
  }

  // save
  el.addEventListener("input", function(){
      localStorage.setItem(key, el.value);
  });
}

// call
persistentInput("userx");

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

function imgGen(username, img, userx) {
  return new Promise((resolve) => {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const bg = new Image();
    bg.crossOrigin = "anonymous";
    bg.src = chrome.runtime.getURL("l.jpg");

    bg.onload = () => {

      // =========================
      // ✅ AUTO CANVAS SIZE (BASED SA BG RATIO)
      // =========================
      const baseWidth = 832;
      const ratio = bg.width / bg.height;

      canvas.width = baseWidth;
      canvas.height = baseWidth / ratio;

      // =========================
      // ✅ DRAW BG (NO STRETCH, CENTER)
      // =========================
      const scale = Math.min(canvas.width / bg.width, canvas.height / bg.height);

      const drawWidth = bg.width * scale;
      const drawHeight = bg.height * scale;

      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      ctx.drawImage(bg, offsetX, offsetY, drawWidth, drawHeight);

      // =========================
      // 🧠 SCALE FACTOR (para dili maguba imong layout)
      // =========================
      const scaleX = canvas.width / 932;
      const scaleY = canvas.height / 2230;

      // =========================
      // AVATAR
      // =========================
      const avatar = new Image();
      avatar.crossOrigin = "anonymous";
      avatar.src = img;

      avatar.onload = () => {

        const x = 390 * scaleX;
        const y = 360 * scaleY;
        const size = 150 * scaleX;

        ctx.drawImage(avatar, x, y, size, size);

        // =========================
        // TEXTS
        // =========================
        ctx.fillStyle = "white";
        ctx.font = `${40 * scaleX}px Segoe UI`;
        ctx.textAlign = "center";
        ctx.fillText(username, canvas.width / 2, 664 * scaleY);

        ctx.fillStyle = "#5668ec";
        ctx.font = `bold ${50* scaleX}px Segoe UI`;
        ctx.textAlign = "center";
        ctx.fillText(userx, 380 * scaleX, 1999 * scaleY);
 
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      avatar.onerror = () => {
        console.warn("⚠️ Avatar failed");

        ctx.fillStyle = "#222";
        ctx.fillRect(390 * scaleX, 360 * scaleY, 51 * scaleX, 51 * scaleY);

        ctx.fillStyle = "#57b2e0";
        ctx.font = `bold ${40 * scaleX}px Segoe UI`;
        ctx.textAlign = "center";
        ctx.fillText(username, canvas.width / 2, 750 * scaleY);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
    };

    bg.onerror = () => {
      console.error("❌ BG failed");
      resolve(null);
    };

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

// ==================== SEQUENTIAL REPLY LOGIC ====================

const MESSAGES = [
  'Please don’t ignore this. I made a mistake and reported your account after someone pretending to be you scammed me. Now support says your account is at risk. I’m really sorry—please contact him on Discord, ticket 40557035.',
  '',
  ''
];

// Kuhaon ang current step base sa last sent message sa chat
function getCurrentStep(chatWin) {
  const allMsgs = chatWin.querySelectorAll('._0u3Ix');
  let lastStep = -1;

  allMsgs.forEach(function(msg) {
    const isSent = msg.querySelector('.CvL1C.gCivL') !== null;
    if (!isSent) return;

    const text = msg.querySelector('._fx8y + div')?.innerText?.trim();
    const idx = MESSAGES.indexOf(text);
    if (idx !== -1) lastStep = idx;
  });

  return lastStep; // -1 = wala pa, 0 = step1 sent, 1 = step2 sent, 2 = done
}

// Check kung nag-reply siya AFTER our message sa given step
function hasReplyAfterStep(chatWin, stepIndex) {
  const allMsgs = [...chatWin.querySelectorAll('._0u3Ix')];

  // Pangitaon ang index sa among gi-send nga message
  let ourMsgIndex = -1;

  for (let i = allMsgs.length - 1; i >= 0; i--) {
    const isSent = allMsgs[i].querySelector('.CvL1C.gCivL') !== null;
    const text = allMsgs[i].querySelector('._fx8y + div')?.innerText?.trim();

    if (isSent && text === MESSAGES[stepIndex]) {
      ourMsgIndex = i;
      break;
    }
  }

  if (ourMsgIndex === -1) return false; // Wala pa ma-send ang message

  // Check kung naa LEFT message AFTER sa among gi-send
  for (let i = ourMsgIndex + 1; i < allMsgs.length; i++) {
    const isSent = allMsgs[i].querySelector('.CvL1C.gCivL') !== null;
    if (!isSent) return true; // Nag-reply siya!
  }

  return false;
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

    const toProcess = allData.filter(d =>
      d.msg === false || (typeof d.msg === 'number' && d.msg < MESSAGES.length - 1)
    );

    if (toProcess.length === 0) {
      await wait(3000);
      continue;
    }

    for (let i = 0; i < toProcess.length; i++) {
      if (stopSending) break;

      const item = toProcess[i];

      // ── STEP 0: Bag-o pa, wala pa ma-send ──
      if (item.msg === false) {
        const base64 = await imgGen(
          `@${item.username}`,
          item.image,
          document.getElementById('userx')?.value || ''
        );

        const sent = await sendMessageTo(item.username, MESSAGES[0]);
        if (!sent) continue;

        if (base64) {
          await wait(300);
          await sentBasesixfour(base64);
        }

        const memItem = collectedData.find(d => d.username === item.username);
        if (memItem) { memItem.msg = 0; memItem.replay = 0; }

        await updateMsgInDB(item.username, 0, 0);
        console.log(`✅ Step 0 sent → ${item.username}`);
        await wait(800);
        continue;
      }

      // ── STEP 1 & 2: Refresh chat, check reply, send next ──
      const currentStep = item.msg;
      const currentReplay = item.replay ?? 0;
      const nextStep = currentStep + 1;
      const expectedReplay = currentStep + 1;

      // ✅ Re-click ang conversation para ma-refresh ang messages
      console.log(`🔄 Refreshing chat: ${item.username}`);
      const ftU4D = document.querySelector('.ftU4D');
      if (ftU4D) {
        const buttons = ftU4D.querySelectorAll('button[aria-label="Conversation"]');
        for (const btn of buttons) {
          const name = btn.querySelector('.pTvJc')?.innerText.trim();
          if (name === item.username) {
            btn.click();
            await wait(1500); // Hulaton ang load
            break;
          }
        }
      }

      const chatWin = findChatWindowByUsername(item.username);
      if (!chatWin) continue;

      // Check kung nag-reply na AFTER sa current step message
      const replied = hasReplyAfterStep(chatWin, currentStep);

      if (replied && currentReplay < expectedReplay) {
        const sent = await sendMessageTo(item.username, MESSAGES[nextStep]);
        if (!sent) continue;

        const memItem = collectedData.find(d => d.username === item.username);
        if (memItem) { memItem.msg = nextStep; memItem.replay = expectedReplay; }

        await updateMsgInDB(item.username, nextStep, expectedReplay);
        console.log(`✅ Step ${nextStep} sent → ${item.username} | replay: ${expectedReplay}`);
      } else {
        console.log(`⏳ Waiting reply: ${item.username} | msg:${currentStep} replay:${currentReplay}`);
      }

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


// ==================== AUTO START (sessionStorage) ====================

function tsAutoStart() {
  if (sessionStorage.getItem('tsAutoStart') !== 'true') return;

  console.log('🔁 Auto-starting after reload...');

  setTimeout(() => {
    // I-click ang Messages button para ma-open ang panel
    document.querySelector('button[aria-label="Messages"]')?.click();

    setTimeout(() => {
      stopSending = false;
      sendToAllPending();
      autoScrollAndScrape();
    }, 2000);
  }, 1500);
}


// ==================== INIT ====================

injectUI();
tsAutoStart(); // ✅ I-call after injectUI