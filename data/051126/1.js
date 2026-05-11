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
let version = "6.9"




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



function getfullLink() {
  return window.location.href;
}

const url = getfullLink();

// ========================
// UI INJECT
// ========================

const target_container = document.querySelector('.ACnga');

const purpleBtn = document.createElement('button');
purpleBtn.id = 'menuBtn';
purpleBtn.innerText = 'Bot Setup';
purpleBtn.style.cssText = `
  padding:10px 12px;
  margin-bottom:10px;
  cursor:pointer;
  background:#191919;
  color:#fff;
  border:none;
  border-radius:6px;
  font-weight:bold;
  font-size:12px;
  width:90%;
`;


if(url.includes("tagged") || url.includes("explore") || url.includes("search")){
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
    
          <div style="display:flex;flex-flow:row;align-items:center;justify-content:center;">
              <div id="" style="padding:8px; font-size:9px; background:#7b2cbfff;color:#fff;border:none;cursor:pointer;">
            V ${version}
              </div>

              <button minimizer style="padding:8px; font-size:9px; background:red;color:#fff;border:none;cursor:pointer;"> --- </button>
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

 
    target_container.prepend(purpleBtn);
}



$(document).on("click", "#menuBtn", () => $("[mainBox]").toggle());
$(document).on("click", "[minimizer]", () => $("[mainBox]").toggle());


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

  // close old popup first
  $("[owl_clsoe_com]").click();

  message = [];

  setTimeout(() => {

    const entry = owl_data[countSelect];

    if (!entry) {

      console.log("⚠️ No entry found");

      clickonce    = false;
      isProceeding = false;
      isWorking    = false;

      return;
    }

    try {

      const btn = findCommentButton(entry);

      if (!btn) {

        console.log("⚠️ No comment button");

        clickonce    = false;
        isProceeding = false;
        isWorking    = false;

        countSelect++;

        setTimeout(() => {
          triggerNext("skip no button");
        }, 1500);

        return;
      }

      console.log(`✅ Opening comment index ${countSelect}`);

      btn.click();

      countSelect++;

    } catch (e) {

      console.log("❌ Open error", e);

      clickonce    = false;
      isProceeding = false;
      isWorking    = false;

      countSelect++;

      setTimeout(() => {
        triggerNext("open error");
      }, 1500);
    }

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

  console.log(`➡️ triggerNext: ${reason}`);

  // completed all
  if (
    clickPerActionTarget > 0 &&
    clickPerActionCount >= clickPerActionTarget
  ) {

    console.log(`✅ Finished all posts`);

    clickonce    = false;
    isProceeding = false;
    isWorking    = false;

    setTimeout(() => {

      breakerRunner();

    }, 1000);

    return;
  }

  // protection
  if (
    clickonce ||
    isProceeding ||
    isWorking
  ) {

    console.log("⛔ Blocked duplicate trigger");

    return;
  }

  isProceeding = true;

  console.log(
    `🚀 Starting ${clickPerActionCount + 1}/${clickPerActionTarget}`
  );

  setTimeout(() => {

    // double safety
    if (
      clickPerActionCount >= clickPerActionTarget
    ) {

      isProceeding = false;
      isWorking    = false;
      clickonce    = false;

      return;
    }

    isProceeding = false;
    isWorking    = true;
    clickonce    = true;

    $("[openthis]").click();

  }, 900);
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
$(document)
.off("click", "[openthis]")
.on("click", "[openthis]", function () {

  // safety block
  if (!isWorking || !clickonce) {

    console.log("⛔ Invalid state open blocked");

    return;
  }

  console.log("🚀 Opening popup");

  delayOppner(2);

  startRestrictObserver();

  try {

    waitForCommentBox(box => {

      waitForMessage(msg => {

        // restricted
        if (isRestricted) {

          console.log("🚫 Restricted");

          $("[owl_clsoe_com]").click();

          if (commentObserver) {
            commentObserver.disconnect();
            commentObserver = null;
          }

          if (restrictObserver) {
            restrictObserver.disconnect();
            restrictObserver = null;
          }

          setTimeout(() => {

            clickonce    = false;
            isProceeding = false;
            isWorking    = false;

            triggerNext("restricted");

          }, 1200);

          return;
        }

        // duplicate checker
        const myComments = (
          $('[comments]').val().match(/\[(.*?)\]/g) || []
        ).map(x =>
          x.replace(/[\[\]]/g, '')
           .trim()
           .toLowerCase()
        );

        const isDuplicate = msg.some(x =>
          myComments.includes(
            x.comment.trim().toLowerCase()
          )
        );

        if (isDuplicate) {

          console.log("🔄 Duplicate found");

          $("[owl_clsoe_com]").click();

          if (commentObserver) {
            commentObserver.disconnect();
            commentObserver = null;
          }

          if (restrictObserver) {
            restrictObserver.disconnect();
            restrictObserver = null;
          }

          setTimeout(() => {

            clickonce    = false;
            isProceeding = false;
            isWorking    = false;

            triggerNext("duplicate");

          }, 1200);

          return;
        }

        // type comment
        const freshComment =
          getRandomComment(
            $('[comments]').val()
          );

        console.log("✏️ Typing:", freshComment);

        setTextareaValue(
          box,
          freshComment
        );

        setTimeout(() => {

          // send
          if (!sent_once) {

            sent_once = true;

            $("[owl_sent]").click();

            setTimeout(() => {
              sent_once = false;
            }, 1000);
          }

          clickPerActionCount++;

          const remaining =
            clickPerActionTarget -
            clickPerActionCount;

          $('[manypost_remaining]').val(
            remaining >= 0 ? remaining : 0
          );

          console.log(
            `✅ Success ${clickPerActionCount}/${clickPerActionTarget}`
          );

          // cleanup observers
          if (commentObserver) {
            commentObserver.disconnect();
            commentObserver = null;
          }

          if (restrictObserver) {
            restrictObserver.disconnect();
            restrictObserver = null;
          }

          // close popup first
          $("[owl_clsoe_com]").click();

          // IMPORTANT DELAY
          setTimeout(() => {

            clickonce    = false;
            isProceeding = false;
            isWorking    = false;

            triggerNext("success");

          }, 1500);

        }, 1000);

      }, () => {

        console.log("⌛ Timeout");

        $("[owl_clsoe_com]").click();

        if (commentObserver) {
          commentObserver.disconnect();
          commentObserver = null;
        }

        if (restrictObserver) {
          restrictObserver.disconnect();
          restrictObserver = null;
        }

        setTimeout(() => {

          clickonce    = false;
          isProceeding = false;
          isWorking    = false;

          triggerNext("timeout");

        }, 1500);

      });

    });

  } catch (e) {

    console.log("❌ FLOW ERROR", e);

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
    console.log("Breaker stopped or done.");
    stopCountdown();
    setStartBtn("idle");
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

    if (config.refresh) {

      console.log("🔄 Refreshing page now...");
      
      location.reload();

    } else {

      console.log("▶ Restarting without refresh");

      $("[starts]").click();

    }

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
