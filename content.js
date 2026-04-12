// ============================================================
// OWL BOT - OPTIMIZED
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


// ========================
// UI INJECT
// ========================
$("body").append(`
  <div style="position:fixed;bottom:20%;right:0%;padding:10px;border-radius:8px;z-index:9999;display:flex;flex-flow:column;align-items:end;">

    <div style="
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
      <button id="menuBtn" style="padding:3px;background:#7b2cbfff;color:#fff;border:none;cursor:pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="currentColor">
          <path d="M440-280h80l12-60q12-5 22.5-10.5T576-364l58 18 40-68-46-40q2-14 2-26t-2-26l46-40-40-68-58 18q-11-8-21.5-13.5T532-620l-12-60h-80l-12 60q-12 5-22.5 10.5T384-596l-58-18-40 68 46 40q-2 14-2 26t2 26l-46 40 40 68 58-18q11 8 21.5 13.5T428-340l12 60Zm-16.5-143.5Q400-447 400-480t23.5-56.5Q447-560 480-560t56.5 23.5Q560-513 560-480t-23.5 56.5Q513-400 480-400t-56.5-23.5ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/>
        </svg>
      </button>
    </div>

    <div id="mainBox" style="width:210px;background:#10002bff;padding:15px;border:1px solid white;border-radius:0px 0px 12px 12px;font-family:sans-serif;color:#fff;">

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

$(document).on("click", "#menuBtn", () => $("#mainBox").toggle());


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

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  }, 16500);
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
  setStartBtn("idle"); // ← ADDED
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
// COUNTDOWN DISPLAY
// ========================
function startCountdown(ms) {
  // Clear any existing countdown first
  stopCountdown();

  let remaining = ms;

  // Show initial value immediately
  updateCountdownDisplay(remaining);

  countdownInterval = setInterval(() => {
    remaining -= 1000;
    if (remaining <= 0) {
      remaining = 0;
      updateCountdownDisplay(remaining);
      stopCountdown();
      return;
    }
    updateCountdownDisplay(remaining);
  }, 1000);
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
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  // Reset display to 00:00:00
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
    setStartBtn("idle"); // ← ADDED
    breakerClear();
    return;
  }

  console.log(`⏳ Break ${config.delay / 1000}s | loops left: ${currentLoop}`);
  setStartBtn("break"); // ← ADDED: show break state while waiting
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
  sent_once           = false; // ← ADDED: ensure clean state on every start

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

  setStartBtn("running"); // ← ADDED
  clickPerAction(cfg.manypost);
});


// ========================
// STOP BUTTON
// ========================
$(document).on("click", "[stopoperation]", function () {
  breakerStop();
  fullStop();
  setStartBtn("idle"); // ← ADDED
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