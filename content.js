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
let isOpeningComment = false;
let watchdogInterval = null;
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
let popupOpening = false;
// Countdown
let countdownInterval = null;
let version = "7.1"

function hasOpenPopup() {

  return !!document.querySelector(
    'div[data-testid="notes-root"]'
  );

}

async function waitUntilPopupClosed(max = 5000) {

  const start = Date.now();

  while (hasOpenPopup()) {

    if (Date.now() - start > max) {

      console.log("⚠️ Popup close timeout");

      break;
    }

    await wait(200);
  }

}


async function waitUntilCommentSent(max = 10000) {

  const start = Date.now();

  while (true) {

    // textarea
    const textarea =
      document.querySelector(
        'textarea[aria-label="Reply"]'
      );

    // send button
    const sendBtn =
      document.querySelector(
        'button[data-testid="reply-button"]'
      );

    // if textarea cleared
    if (
      textarea &&
      textarea.value.trim() === ""
    ) {

      console.log("✅ Comment sent detected");

      return true;
    }

    // button disabled
    if (
      sendBtn &&
      (
        sendBtn.disabled ||
        sendBtn.getAttribute("aria-disabled") === "true"
      )
    ) {

      console.log("✅ Send processing");

      return true;
    }

    // timeout
    if (Date.now() - start > max) {

      console.log("⚠️ Send timeout");

      return false;
    }

    await wait(300);
  }

}

function startFlowWatchdog() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
  }
  watchdogInterval = setInterval(() => {

    // stuck detector
    if (
      isOpeningComment &&
      !document.querySelector('div[data-testid="notes-root"]')
    ) {

      console.log("⚠️ Watchdog reset triggered");

      clickonce         = false;
      isProceeding      = false;
      isWorking         = false;
      isOpeningComment  = false;

    }

  }, 5000);

}
startFlowWatchdog();

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

function safeClick(el) {

  if (!el) return false;

  try {

    el.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );

    return true;

  } catch (e) {

    console.log("❌ Click failed", e);

    return false;
  }

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
      if (!$('button[class="qf5_7 j4_3O u1icf wEQXZ rZNeu GqZGX undefined"]').attr('owl_clsoe_com'))
        $('button[class="qf5_7 j4_3O u1icf wEQXZ rZNeu GqZGX undefined"]').attr('owl_clsoe_com', '');
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
    if (++tries > 20) {
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
    }, 200);

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

async function delayOppner(delaySec) {

  // HARD BLOCK
  if (popupOpening) {

    console.log("🚫 Popup already opening");

    return;
  }

  popupOpening = true;

  // close old popup first
  safeClick($("[owl_clsoe_com]")[0]);

  // IMPORTANT WAIT
  await waitUntilPopupClosed();

  message = [];

  await wait(delaySec * 1000);

  const entry = owl_data[countSelect];

  if (!entry) {

    console.log("⚠️ No entry found");

    popupOpening      = false;
    clickonce         = false;
    isProceeding      = false;
    isWorking         = false;
    isOpeningComment  = false;

    return;
  }

  try {

    const btn = findCommentButton(entry);

    if (!btn) {

      console.log("⚠️ No comment button");

      popupOpening      = false;
      clickonce         = false;
      isProceeding      = false;
      isWorking         = false;
      isOpeningComment  = false;

      countSelect++;

      triggerNext("skip no button");

      return;
    }

    // already opening protection
    if (btn.dataset.opened === "1") {

      console.log("🚫 Already opened");

      popupOpening = false;

      return;
    }

    btn.dataset.opened = "1";

    setTimeout(() => {
      delete btn.dataset.opened;
    }, 3000);

    console.log(`✅ Opening comment index ${countSelect}`);

    safeClick(btn);

    countSelect++;

    // WAIT popup appear
    await wait(1000);

    popupOpening = false;

  } catch (e) {

    console.log("❌ Open error", e);

    popupOpening      = false;
    clickonce         = false;
    isProceeding      = false;
    isWorking         = false;
    isOpeningComment  = false;

    countSelect++;

    triggerNext("open error");
  }

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
      safeClick($("[owl_clsoe_com]")[0]);
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

    // protection
    if (
      isProceeding ||
      popupOpening
    ) {

      console.log("⛔ Blocked duplicate trigger");

      return;
    }

    // completed all
    if (
      clickPerActionTarget > 0 &&
      clickPerActionCount >= clickPerActionTarget
    ) {

      console.log(`✅ Finished all posts`);

      clickonce         = false;
      isProceeding      = false;
      isWorking         = false;
      isOpeningComment  = false;

      setTimeout(() => {

        breakerRunner();

      }, 1000);

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

        isProceeding      = false;
        isWorking         = false;
        clickonce         = false;
        isOpeningComment  = false;

        return;
      }

      isProceeding      = false;
      isWorking         = true;
      clickonce         = true;
      isOpeningComment  = true;

      safeClick($("[openthis]")[0]);

    }, 300);

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

  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
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
.on("click", "[openthis]", async function () {

  // hard lock
  if (isOpeningComment === false) {

    console.log("⛔ Opening blocked");

    return;
  }

  // safety block
  if (!isWorking || !clickonce) {

    console.log("⛔ Invalid state open blocked");

    isOpeningComment = false;

    return;
  }

  console.log("🚀 Opening popup");

  await delayOppner(1)

  startRestrictObserver();

  try {

    waitForCommentBox(box => {

      waitForMessage(msg => {

        // restricted
        if (isRestricted) {

          console.log("🚫 Restricted");

          safeClick($("[owl_clsoe_com]")[0]);

          if (commentObserver) {
            commentObserver.disconnect();
            commentObserver = null;
          }

          if (restrictObserver) {
            restrictObserver.disconnect();
            restrictObserver = null;
          }

          setTimeout(() => {

            clickonce         = false;
            isProceeding      = false;
            isWorking         = false;
            isOpeningComment  = false;

            triggerNext("restricted");

          }, 300);

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

        const existing = new Set(
          msg.map(x => x.comment.trim().toLowerCase())
        );

        const isDuplicate = myComments.some(c => existing.has(c));

        if (isDuplicate) {

          console.log("🔄 Duplicate found");

          safeClick($("[owl_clsoe_com]")[0]);

          if (commentObserver) {
            commentObserver.disconnect();
            commentObserver = null;
          }

          if (restrictObserver) {
            restrictObserver.disconnect();
            restrictObserver = null;
          }

          setTimeout(() => {

            clickonce         = false;
            isProceeding      = false;
            isWorking         = false;
            isOpeningComment  = false;

            triggerNext("duplicate");

          }, 300);

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
        (async () => {

          // SEND
          if (!sent_once) {
        
            sent_once = true;
        
            const sendBtn = $("[owl_sent]")[0];
        
            if (sendBtn) {
        
              // human-like pause
              await wait(500);
        
              safeClick(sendBtn);
        
              console.log("📨 Send clicked");
        
              // wait para ma process sa IG
              await wait(2000);
        
            }
        
            sent_once = false;
          }
        
          // SUCCESS COUNT
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
        
          // CLEANUP OBSERVERS
          if (commentObserver) {
        
            commentObserver.disconnect();
        
            commentObserver = null;
          }
        
          if (restrictObserver) {
        
            restrictObserver.disconnect();
        
            restrictObserver = null;
          }
        
          // CLOSE POPUP
          const closeBtn = $("[owl_clsoe_com]")[0];
        
          if (closeBtn) {
        
            safeClick(closeBtn);
        
            // wait close animation
            await wait(1200);
          }
        
          // RESET STATES
          clickonce         = false;
          isProceeding      = false;
          isWorking         = false;
          isOpeningComment  = false;
          popupOpening      = false;
        
          // NEXT
          triggerNext("success");
        
        })();

      }, () => {

        console.log("⌛ Timeout");

        safeClick($("[owl_clsoe_com]")[0]);

        if (commentObserver) {
          commentObserver.disconnect();
          commentObserver = null;
        }

        if (restrictObserver) {
          restrictObserver.disconnect();
          restrictObserver = null;
        }

        setTimeout(() => {

          clickonce         = false;
          isProceeding      = false;
          isWorking         = false;
          isOpeningComment  = false;

          triggerNext("timeout");

        }, 300);

      });

    });

  } catch (e) {

    console.log("❌ FLOW ERROR", e);

    clickonce         = false;
    isProceeding      = false;
    isWorking         = false;
    isOpeningComment  = false;
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



















// 00 MENU
//======================================================================================================================================================= Messages Area

let collectedData = [];
let isScrolling = false;
let isSending = false;
let stopSending = false;
let observer = null;
let clickMessageIndexOnce = false
let activeUsername = ""
let startonce = false
let msgsentonce = false
const DB_NAME = 'TumblrScraper';
const DB_STORE = 'conversations';
const DB_VERSION = 1;




/* ======================================= [S] **** [S] ======================================= */
// ONLOAD RUNNER  
/*==============================================================================================*/

 
/* ==========================[*] * [*]========================== */
/* SAVE FUNCTIONS */ 
/* ==========================[*] * [*]========================== */
const localLogicFunctions = {};

 
/* ==========================[*] * [*]========================== */
/* REGISTER FUNCTION */ 
/* ==========================[*] * [*]========================== */
function setLocalLogic(name, value) {

  // SAVE FUNCTION
  if (typeof value === "function") {

    localLogicFunctions[name] = value;

    return;

  }

  // SAVE TRUE/FALSE
  localStorage.setItem(
    "logic_" + name,
    JSON.stringify(value)
  );

}

 
/* ==========================[*] * [*]========================== */
/* RUN LOGIC */ 
/* ==========================[*] * [*]========================== */
async function runLocalLogic(name) {

  const status = JSON.parse(
    localStorage.getItem("logic_" + name)
  );

  // NOT TRUE
  if (status !== true) {

    console.log(name, "not active");
    return false;

  }

  // FUNCTION NOT FOUND
  if (!localLogicFunctions[name]) {

    console.log(name, "function not found");
    return false;

  }

  console.log(name, "running...");

  await localLogicFunctions[name]();

  return true;

}
 

 
/* ==========================[*] * [*]========================== */
/* STOP LOGIC */ 
/* ==========================[*] * [*]========================== */
function stopLocalLogic(name) {

  localStorage.setItem(
    "logic_" + name,
    JSON.stringify(false)
  );

  console.log(name, "stopped");

}


 
/* ==========================[*] * [*]========================== */
/* AUTO RUN ON LOAD */ 
/* ==========================[*] * [*]========================== */
window.addEventListener("load", async () => {

  for (const name in localLogicFunctions) {

    const status = JSON.parse(
      localStorage.getItem("logic_" + name)
    );

    if (status === true) {

      await runLocalLogic(name);

    }

  }

});


 
/* ==========================[*] * [*]========================== */
/* RUN LOGGIC */ 
/* ==========================[*] * [*]========================== */
setLocalLogic("autoRunnerMsg", async function () {


  // $("[mainBox]").hide()

  // offRefreshStatus()

  setTimeout(() => {
    $("#tsStartBtn").click()
  }, 4000);


  // breakerStop();
  // fullStop();

  
});
/* ======================================= [E] **** [E] ======================================= */




/* ======================================= [S] **** [S] ======================================= */
// UI 
/*==============================================================================================*/
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
    justify-content:center;
    margin-bottom:10px;
    width:90%;
  `;

  const startBtn = document.createElement('button');
  startBtn.id = 'tsStartBtn';
  startBtn.innerText = '▶';
  startBtn.style.cssText = `
    padding:10px 12px;
    cursor:pointer;
    background:#00b8ff;
    color:black;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    flex:1;
  `;

  const stopBtn = document.createElement('button');
  stopBtn.id = 'tsStopBtn';
  stopBtn.innerText = '⏹';
  stopBtn.style.cssText = `
    padding:10px 12px;
    cursor:pointer;
    background:#191919;
    color:#fff;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    flex:1;
  `;


    
  const timerr = document.createElement('input');
  timerr.id = 'timerr';
  timerr.placeholder = 'timer';
  timerr.type = 'number';


  // userx.innerText = 'Bot Setup';
  timerr.style.cssText = `
    padding:10px 12px;
    cursor:pointer;
    color:#1d1d1d;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    outline:0;
    width:10%;
       flex:2;
  `;




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

  
  const userx = document.createElement('input');
  userx.id = 'userx';
  // userx.innerText = 'Bot Setup';
  userx.style.cssText = `
    padding:10px 12px;
    margin-bottom:40px;
    cursor:pointer;
    color:#1d1d1d;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    width:79%;
    outline:0;
  `;



  const firstMsg = document.createElement('input');
  firstMsg.id = 'firstmsg';
  firstMsg.placeholder = '1st Message';

  // userx.innerText = 'Bot Setup';
  firstMsg.style.cssText = `
    padding:10px 12px;
    margin-bottom:6px;
    color:#1d1d1d;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    width:79%;
    outline:0;
  `;



  const secondMsg = document.createElement('input');
  secondMsg.id = 'secondmsg';
  secondMsg.placeholder = '2nd Message';

  // userx.innerText = 'Bot Setup';
  secondMsg.style.cssText = `
    padding:10px 12px;
    margin-bottom:6px;
    color:#1d1d1d;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    width:79%;
    outline:0;
  `;



  const thirdMsg = document.createElement('input');
  thirdMsg.id = 'thirdmsg';
  thirdMsg.placeholder = '3rd Message';

  // userx.innerText = 'Bot Setup';
  thirdMsg.style.cssText = `
    padding:10px 12px;
    margin-bottom:6px;
    color:#1d1d1d;
    border:none;
    border-radius:6px;
    font-weight:bold;
    font-size:12px;
    width:79%;
    outline:0;
  `;


  
 

  target.prepend(userx);

  wrapper.appendChild(startBtn);
  wrapper.appendChild(stopBtn);
  wrapper.appendChild(timerr);

  
  target.prepend(wrapper);
  target.prepend(thirdMsg);
  target.prepend(secondMsg);
  target.prepend(firstMsg);



  // I-add sa injectUI startBtn click handler
  startBtn.addEventListener('click', function () {
    sessionStorage.setItem('tsAutoStart', 'true'); // ✅ Mark para auto-start after reload
    stopSending = false;
    // sendToAllPending();
    // autoScrollAndScrape();
  
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
        // sendToAllPending();
        document.querySelector('[aria-label="Messages"]')?.click();
      }, 2000);
    }, 1500);
  }



  stopBtn.addEventListener('click', function () {
    stopSending = true;
    isSending = false;
    sessionStorage.removeItem('tsAutoStart'); // ✅ Clear para dili na mag-auto start after reload
  
    const btn = document.getElementById('tsStartBtn');
    if (btn) btn.innerText = '▶';
  
    console.log('⏹ Stopped. Auto-start cleared.');
  });
}
/* ======================================= [E] **** [E] ======================================= */




/* ======================================= [S] **** [S] ======================================= */
// OFF REFRESH STATUS 
/*==============================================================================================*/
function offRefreshStatus() {

    const checkbox =
      document.querySelector(
        'input[refresh_status]'
      );

    if (!checkbox) {

      console.log(
        'CHECKBOX NOT FOUND'
      );

      return false;

    }

    // OFF
    checkbox.checked = false;

    // OPTIONAL TRIGGER
    checkbox.dispatchEvent(
      new Event('change', {
        bubbles: true
      })
    );

    console.log(
      'REFRESH STATUS OFF'
    );

    return true;

}
/* ======================================= [E] **** [E] ======================================= */



/* ======================================= [S] **** [S] ======================================= */
// GET ALL COMMINTS
/*==============================================================================================*/
function keepConversationOpen() {

  let observer = null;
  let keepAliveInterval = null;
  let running = false;

  function isConversationOpen() {

    // if actual chat thread open
    return document.querySelector(
      '.TRX6J[aria-label="Back"]'
    );

  }

  function reopenPanel() {

    // DON'T reopen if inside conversation
    if (isConversationOpen()) {
      return;
    }

    const panel = document.querySelector('.ybmTG.ufrME');

    if (panel && panel.offsetParent !== null) {
      return;
    }

    const msgBtn = [...document.querySelectorAll('button')]
      .find(btn =>
        btn.getAttribute('aria-label') === 'Messages'
      );

    if (msgBtn) {

      msgBtn.click();

      console.log('Conversation panel reopened');

    }

  }

  function preventClose() {

    const panel = document.querySelector('.ybmTG.ufrME');

    if (!panel) return;

    if (!observer) {

      observer = new MutationObserver(() => {

        // DON'T force reopen if user opened conversation
        if (isConversationOpen()) {
          return;
        }

        const stillOpen =
          document.querySelector('.ybmTG.ufrME');

        if (!stillOpen && running) {

          setTimeout(reopenPanel, 100);

        }

      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

    }

  }

  function start() {

    if (running) return;

    running = true;

    reopenPanel();

    keepAliveInterval = setInterval(() => {

      if (!running) return;

      reopenPanel();
      preventClose();

    }, 1000);

    console.log('Keep open STARTED');

  }

  function stop() {

    running = false;

    if (observer) {

      observer.disconnect();
      observer = null;

    }

    if (keepAliveInterval) {

      clearInterval(keepAliveInterval);
      keepAliveInterval = null;

    }

    console.log('Keep open STOPPED');

  }

  return {
    start,
    stop
  };

}
/* ======================================= [E] **** [E] ======================================= */



/* ======================================= [S] **** [S] ======================================= */
// SCAN UNREAD MESSAGES
/*==============================================================================================*/
async function scanUnreadMessages(callback = null) {

  // =========================
  // WAIT
  // =========================

  async function wait(ms = 300) {

      return new Promise(resolve => {
          setTimeout(resolve, ms);
      });

  }

  // =========================
  // WAIT ELEMENT
  // =========================

  async function waitForElement(
      selector,
      timeout = 15000
  ) {

      return new Promise(resolve => {

          const existing =
              document.querySelector(selector);

          if (existing) {

              resolve(existing);
              return;

          }

          const observer =
              new MutationObserver(() => {

                  const el =
                      document.querySelector(selector);

                  if (el) {

                      observer.disconnect();
                      resolve(el);

                  }

              });

          observer.observe(
              document.body,
              {
                  childList: true,
                  subtree: true
              }
          );

          setTimeout(() => {

              observer.disconnect();
              resolve(null);

          }, timeout);

      });

  }

  // =========================
  // OPEN DATABASE
  // =========================

  const db =
      await new Promise((resolve, reject) => {

          const request =
              indexedDB.open(
                  'tumblr_msg_db',
                  1
              );

          request.onupgradeneeded =
              function (e) {

                  const db =
                      e.target.result;

                  if (
                      !db.objectStoreNames.contains(
                          'users'
                      )
                  ) {

                      db.createObjectStore(
                          'users',
                          {
                              keyPath:
                                  'suername'
                          }
                      );

                  }

              };

          request.onsuccess =
              e => resolve(
                  e.target.result
              );

          request.onerror =
              e => reject(e);

      });

  // =========================
  // SAVE USER
  // =========================

  async function saveUser(data) {

      return new Promise(resolve => {

          const tx =
              db.transaction(
                  'users',
                  'readwrite'
              );

          const store =
              tx.objectStore('users');

          const getReq =
              store.get(
                  data.suername
              );

          getReq.onsuccess =
              function () {

                  const oldData =
                      getReq.result;

                  // =========================
                  // UPDATE EXISTING
                  // =========================

                  if (oldData) {

                      oldData.unread =
                          data.unread;

                      oldData.lastMsg =
                          data.lastMsg ||
                          oldData.lastMsg;

                      oldData.img =
                          data.img ||
                          oldData.img;

                      const updateReq =
                          store.put(oldData);

                      updateReq.onsuccess =
                          () => {

                              console.log(
                                  'UPDATED:',
                                  oldData.suername
                              );

                              resolve(true);

                          };

                      updateReq.onerror =
                          () => resolve(false);

                      return;

                  }

                  // =========================
                  // NEW USER
                  // =========================

                  const newData = {

                      suername:
                          data.suername,

                      img:
                          data.img || '',

                      lastMsg:
                          data.lastMsg || '',

                      unread:
                          data.unread || false,

                      msgLvl:
                          0,

                      created:
                          Date.now()

                  };

                  const addReq =
                      store.add(newData);

                  addReq.onsuccess =
                      () => {

                          console.log(
                              'NEW USER:',
                              newData.suername
                          );

                          resolve(true);

                      };

                  addReq.onerror =
                      () => resolve(false);

              };

      });

  }

  // =========================
  // OPEN MESSAGE PANEL
  // =========================

  async function openMessages() {

      const btn =
          await waitForElement(
              'button[aria-label="Messages"]'
          );

      if (!btn) {

          console.log(
              'MESSAGE BUTTON NOT FOUND'
          );

          return false;

      }

      btn.click();

      console.log(
          'OPENING MESSAGES'
      );

      const panel =
          await waitForElement(
              '.EXUkD'
          );

      if (!panel) {

          console.log(
              'MESSAGE PANEL FAIL'
          );

          return false;

      }

      console.log(
          'MESSAGE PANEL READY'
      );

      return true;

  }

  const opened =
      await openMessages();

  if (!opened) return;

  // WAIT FULL RENDER
  await wait(4000);

  // =========================
  // GET PANEL
  // =========================

  let panel =
      document.querySelector('.EXUkD');

  // FALLBACK
  if (!panel) {

      panel =
          document.querySelector('.EXUkD');

  }

  if (!panel) {

      console.log(
          'SCROLL PANEL NOT FOUND'
      );

      return;

  }

  console.log({

      scrollHeight:
          panel.scrollHeight,

      clientHeight:
          panel.clientHeight,

      scrollTop:
          panel.scrollTop

  });

  // =========================
  // TRACK USERS
  // =========================

  const scanned =
      new Set();

  // =========================
  // SCRAPE USERS
  // =========================

  async function scrapeVisible() {

      const convos =
          [
              ...document.querySelectorAll(
                  'button[aria-label="Conversation"]'
              )
          ];

      console.log(
          'VISIBLE CONVOS:',
          convos.length
      );

      for (const btn of convos) {

          // CHECK UNREAD
          const unread =
              !!btn.querySelector(
                  '.Y8xri'
              );

          // SKIP READ
          if (!unread) continue;

          const username =
              btn.querySelector('.pTvJc')
              ?.innerText
              ?.trim();

          if (!username) continue;

          // SKIP DUPLICATE
          if (
              scanned.has(username)
          ) continue;

          scanned.add(username);

          // IMAGE
          let img = '';

          const imgTag =
              btn.querySelector('img');

          if (imgTag) {

              img =
                  imgTag.currentSrc ||
                  imgTag.src ||
                  '';

          }

          // LAST MESSAGE
          const lastMsg =
              btn.querySelector(
                  '.FZe6i'
              )
              ?.innerText
              ?.trim() || '';

          console.log(
              'UNREAD FOUND:',
              username
          );

          await saveUser({

              suername:
                  username,

              img:
                  img,

              lastMsg:
                  lastMsg,

              unread:
                  true

          });

      }

  }

  // =========================
  // FORCE SCROLL SCAN
  // =========================

  async function forceScrollScan() {

      let lastHeight = 0;
      let sameCount = 0;

      while (true) {

          // SCAN CURRENT
          await scrapeVisible();

          // FORCE SCROLL
          panel.scrollTo({

              top:
                  panel.scrollTop + 1200,

              behavior:
                  'instant'

          });

          // FORCE EVENT
          panel.dispatchEvent(
              new Event('scroll')
          );

          console.log({

              scrollTop:
                  panel.scrollTop,

              scrollHeight:
                  panel.scrollHeight,

              scanned:
                  scanned.size

          });

          // WAIT LAZY LOAD
          await wait(2500);

          // SCAN AGAIN
          await scrapeVisible();

          // CHECK END
          if (
              panel.scrollHeight ===
              lastHeight
          ) {

              sameCount++;

          } else {

              sameCount = 0;
              lastHeight =
                  panel.scrollHeight;

          }

          // STOP
          if (sameCount >= 3) {

              console.log(
                  'END OF LIST'
              );

              break;

          }

      }

  }

  // =========================
  // START SCAN
  // =========================

  await forceScrollScan();

  // FINAL SCRAPE
  await scrapeVisible();

  console.log({

      totalUnread:
          scanned.size

  });

  console.log(
      'SCAN COMPLETE'
  );

  // =========================
  // CALLBACK
  // =========================

  if (
      typeof callback === 'function'
  ) {

      await callback();

  }

}
/* ======================================= [E] **** [E] ======================================= */

 
/* ======================================= [S] **** [S] ======================================= */
// OPEN MSG
/*==============================================================================================*/
async function openMsg(callback = null) {

  // =========================
  // WAIT
  // =========================
  function wait(ms = 800) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =========================
  // WAIT ELEMENT
  // =========================
  function waitForElement(selector, timeout = 10000) {
    return new Promise(resolve => {
      const start = Date.now();

      const timer = setInterval(() => {
        const el = document.querySelector(selector);

        if (el) {
          clearInterval(timer);
          resolve(el);
          return;
        }

        if (Date.now() - start > timeout) {
          clearInterval(timer);
          resolve(null);
        }
      }, 50);
    });
  }

  // =========================
  // TRACK OPENED USERS
  // =========================
  const openedUsers = new Set();

  // =========================
  // SMART SCROLL CONTAINER
  // =========================
  function getScrollContainer() {

    const exukd = document.querySelector('.EXUkD');
  
    if (exukd) {
      const isScrollable = exukd.scrollHeight > exukd.clientHeight;
  
      console.log("EXUkD CHECK:", {
        scrollHeight: exukd.scrollHeight,
        clientHeight: exukd.clientHeight,
        scrollable: isScrollable
      });
  
      if (isScrollable) {
        return exukd;
      }
    }
  
    // fallback
    console.log("USING BODY SCROLL");
  
    return document.scrollingElement || document.body;
  }
  // =========================
  // GET UNREAD BUTTONS
  // =========================
  function getUnreadButtons() {

    const unreadEls = document.querySelectorAll('.uX3_z.lx_bn .Y8xri');
    const buttons = [];

    unreadEls.forEach(el => {

      const btn = el.closest('button[aria-label="Conversation"]');
      if (!btn) return;

      const username =
        btn.querySelector('.pTvJc')?.textContent?.trim();

      if (!username) return;

      if (openedUsers.has(username)) return;

      buttons.push({ btn, username });

    });

    return buttons;
  }

  // =========================
  // SMART AUTO SCROLL
  // =========================
  async function scrollForUnread() {

    const container = getScrollContainer();
  
    // ❗ STRICT CHECK
    const isEXUkD = container.classList?.contains("EXUkD");
  
    if (!isEXUkD) {
      console.log("❌ EXUkD not scrollable → STOP");
      return [];
    }
  
    let lastTop = -1;
    let stableCount = 0;
  
    while (true) {
  
      const unread = getUnreadButtons();
  
      if (unread.length > 0) {
        return unread;
      }
  
      // ✅ ONLY scroll EXUkD
      container.scrollTop += 900;
  
      console.log("SCROLLING EXUkD...", {
        top: container.scrollTop
      });
  
      await wait(1200);
  
      if (container.scrollTop === lastTop) {
        stableCount++;
      } else {
        stableCount = 0;
      }
  
      lastTop = container.scrollTop;
  
      if (stableCount >= 3) {
        console.log("END EXUkD");
        return [];
      }
    }
  }

  // =========================
  // MAIN LOOP
  // =========================
  while (true) {

    let unreadButtons = getUnreadButtons();

    // walay nakita → scroll
    if (!unreadButtons.length) {

      console.log("NO UNREAD VISIBLE → SCROLLING...");
      unreadButtons = await scrollForUnread();

    }

    console.log("UNREAD FOUND:", unreadButtons.length);

    // stop na
    if (!unreadButtons.length) {
      console.log("NO MORE UNREAD 🔚");
      break;
    }

    const item = unreadButtons[0];
    if (!item) break;

    const { btn, username } = item;

    openedUsers.add(username);
    activeUsername = username;

    console.log("OPENING:", username);

    // scroll to view
    btn.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    await wait(600);

    // click open
    btn.click();

    // wait open UI
    await wait(1600);

    // =========================
    // CALLBACK
    // =========================
    if (typeof callback === 'function') {

      console.log("RUN CALLBACK:", username);

      await Promise.resolve(callback(btn));

      console.log("CALLBACK DONE:", username);
    }

    await wait(600);

    // =========================
    // CLOSE MESSAGE
    // =========================
    const closeBtn = await waitForElement(
      'button[aria-label="Close"]',
      5000
    );

    if (closeBtn) {
      closeBtn.click();
      console.log("CLOSED:", username);
    }

    await wait(1200);
  }

  console.log("ALL DONE ✅");

}
/* ======================================= [E] **** [E] ======================================= */

 

/* ======================================= [S] **** [S] ======================================= */
// SENT MESSAGE
/*==============================================================================================*/
async function setMessage(message = "") {

  const textarea = document.querySelector('textarea.xXTjk');

  if (!textarea) {
    console.log("Textarea not found");
    return false;
  }

  // set value
  textarea.value = message;

  // trigger input events
  textarea.dispatchEvent(
    new Event("input", { bubbles: true })
  );

  textarea.dispatchEvent(
    new Event("change", { bubbles: true })
  );

  // auto resize
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";

  return true;
}
/* ======================================= [E] **** [E] ======================================= */


/* ======================================= [S] **** [S] ======================================= */
// GENERATE IMAGE
/*==============================================================================================*/
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
/* ======================================= [E] **** [E] ======================================= */
 

/* ======================================= [S] **** [S] ======================================= */
// SENT IMAGE TO MESSAGE BOX
/*==============================================================================================*/
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

  await wait(800);

  const sendBtn = document.querySelector('button[aria-label="Send"]');

  if (sendBtn && !sendBtn.disabled) {
    sendBtn.click();
  } else {
    return false;
  }

  await wait(900);

  return true;
}
/* ======================================= [E] **** [E] ======================================= */


/* ======================================= [S] **** [S] ======================================= */
// HELPERS
/*==============================================================================================*/
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


function closePopupIfExist() {

  // pangitaon ang dismiss button sulod sa popup
  const popupBtn = document.querySelector(
    '.vgL3J.l98yg.kjjAF button[aria-label="Dismiss"]'
  );

  // if naa siya, e-click dayun
  if (popupBtn) {

    console.log("Popup detected, closing...");

    popupBtn.click();

    return true;

  } else {

    console.log("No popup found.");

    return false;
  }
}

/* ======================================= [E] **** [E] ======================================= */


/* ======================================= [S] **** [S] ======================================= */
// INDEX DB 
/*==============================================================================================*/
 
/* ==========================[*] * [*]========================== */
/* OPEN DB */ 
/* ==========================[*] * [*]========================== */
function openTumblrDB() {

  return new Promise((resolve, reject) => {

    const request = indexedDB.open('tumblr_msg_db', 1);

    request.onupgradeneeded = function (e) {

      const db = e.target.result;

      if (!db.objectStoreNames.contains('users')) {

        db.createObjectStore('users', {
          keyPath: 'suername'
        });

      }

    };

    request.onsuccess = e => resolve(e.target.result);

    request.onerror = e => reject(e);

  });

}


/* ==========================[*] * [*]========================== */
/* GET USER */ 
/* ==========================[*] * [*]========================== */
async function getUser(username) {

  const db = await openTumblrDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction('users', 'readonly');

    const store = tx.objectStore('users');

    const request = store.get(username);

    request.onsuccess = function () {

      console.log(request.result);

      resolve(request.result);

    };

    request.onerror = function () {

      reject(request.error);

    };

  });

}
 
// =========================
// UPDATE USER
// =========================
async function updateUser(username, updates = {}) {

  if (!username) {
    console.error("INVALID USERNAME:", username);
    return false;
  }

  const db = await openTumblrDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');

    const getReq = store.get(username);

    getReq.onsuccess = function () {

      const user = getReq.result;

      if (!user) {
        console.log('USER NOT FOUND');
        resolve(false);
        return;
      }

      const updatedUser = {
        ...user,
        ...updates
      };

      const updateReq = store.put(updatedUser);

      updateReq.onsuccess = function () {
        console.log("UPDATED:", updatedUser);
      };

      updateReq.onerror = function () {
        reject(updateReq.error);
      };

    };

    getReq.onerror = function () {
      reject(getReq.error);
    };

    // IMPORTANT
    tx.oncomplete = function () {
      resolve(true);
    };

    tx.onerror = function () {
      reject(tx.error);
    };

  });

}
/* ======================================= [E] **** [E] ======================================= */




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




async function clickSendButton() {

  return new Promise(resolve => {

    const check = setInterval(() => {

      const btn = document.querySelector(
        'button[aria-label="Send"]'
      );

      // BUTTON NOT FOUND
      if (!btn) {

        console.log("Send button not found");
        return;

      }

      // WAIT UNTIL ENABLED
      if (btn.disabled) {

        console.log("Waiting send button...");
        return;

      }

      clearInterval(check);

      btn.click();

      console.log("Send button clicked");

      resolve(true);

    }, 300);

  });

}




let reloadTimerStop = false;

async function reloadTimer(data = {}) {

  reloadTimerStop = false;

  let type = data.type || "s";
  let time = Number(data.time) || 1;

  let ms = 0;

  // SECONDS
  if (type === "s") {
    ms = time * 1000;
  }

  // MINUTES
  if (type === "m") {
    ms = time * 60 * 1000;
  }

  // HOURS
  if (type === "h") {
    ms = time * 60 * 60 * 1000;
  }

  console.log("Reload in:", ms, "ms");

  let start = Date.now();

  // LOOP WAIT
  while (Date.now() - start < ms) {

    // STOP CHECK
    if (reloadTimerStop) {

      console.log("Reload timer stopped");
      return false;

    }

    await new Promise(resolve =>
      setTimeout(resolve, 200)
    );

  }

  // FINAL CHECK
  if (reloadTimerStop) {

    console.log("Reload timer stopped");
    return false;

  }

  console.log("Reloading page...");

  location.reload();

}


// STOP FUNCTION
function stopReloadTimer() {

  reloadTimerStop = true;

}

// ==================== INIT ====================



async function checkBeforeSent() {

  // =========================================
  // LOCK
  // =========================================
  if (msgsentonce) {
    return;
  }

  msgsentonce = true;

  try {

    let thedataholder = await getUser(activeUsername);

    console.log(thedataholder);
    console.log("==========================");

    let msgLvl = Number(thedataholder?.msgLvl || 0);

    console.log("DATA:", thedataholder);
    console.log("LEVEL:", msgLvl);




    /* ===================================================== */
    /* CASE 0 */
    /* ===================================================== */
    if (msgLvl === 0) {

      // UPDATE FIRST
      await updateUser(activeUsername, {
        msgLvl: 1
      });

      const base64 = await imgGen(
        `@${activeUsername}`,
        thedataholder.img,
        document.getElementById('userx')?.value || ''
      );

      // SEND IMAGE
      if (base64) {

        await wait(300);

        await sentBasesixfour(base64);

        await wait(700);

      }

      // SET MESSAGE
      setMessage($("#firstmsg").val());

      await wait(700);

      // CHECK BUTTON
      let btn0 = $("[aria-label=Send]");

      // BLOCKED
      if (btn0.prop("disabled")) {

        console.log("Cannot send message.");

        await wait(600);

        await closeConversation();

        return;

      }

      // SEND
      await clickSendButton();

      await wait(3000);

    }


    /* ===================================================== */
    /* CASE 1 */
    /* ===================================================== */
    else if (msgLvl === 1) {

      // UPDATE FIRST
      await updateUser(activeUsername, {
        msgLvl: 2
      });

      // SET MESSAGE
      setMessage($("#secondmsg").val());

      await wait(700);

      // CHECK BUTTON
      let btn1 = $("[aria-label=Send]");

      // BLOCKED
      if (btn1.prop("disabled")) {

        console.log("Cannot send message.");

        await wait(600);

        await closeConversation();

        return;

      }

      // SEND
      await clickSendButton();

      await wait(3000);

    }


    /* ===================================================== */
    /* CASE 2 */
    /* ===================================================== */
    else if (msgLvl === 2) {

      // UPDATE FIRST
      await updateUser(activeUsername, {
        msgLvl: 4
      });

      // SET MESSAGE
      setMessage($("#thirdmsg").val());

      await wait(700);

      // CHECK BUTTON
      let btn2 = $("[aria-label=Send]");

      // BLOCKED
      if (btn2.prop("disabled")) {

        console.log("Cannot send message.");

        await wait(600);

        await closeConversation();

        return;

      }

      // SEND
      await clickSendButton();

      await wait(3000);

    }


    /* ===================================================== */
    /* CASE 4 */
    /* ===================================================== */
    else if (msgLvl === 4) {

      await wait(600);

    }

  } catch (err) {

    console.log("ERROR:", err);

  } finally {

    // =========================================
    // UNLOCK
    // =========================================
    msgsentonce = false;

  }

}

async function othertest(){

// alert("all donw")

  await new Promise(resolve =>
    setTimeout(resolve, 3000)
  );
}



if(url.includes("dashboard")){
  injectUI();
  persistentInput("userx");
  persistentInput("timerr");
  persistentInput("firstmsg");
  persistentInput("secondmsg");
  persistentInput("thirdmsg");
  runLocalLogic("functest");
}
// tsAutoStart(); // ✅ I-call after injectUI




const keepOpen = keepConversationOpen();

// START BUTTON
document.querySelector('#tsStartBtn')?.addEventListener('click', () => {

  closePopupIfExist();

  if (!startonce) {
    startonce = true
    keepOpen.start();
    // $("#menuBtn").click()
    $("#tsStartBtn").text(`⏯`)
    setLocalLogic("autoRunnerMsg", true);

    // $("[mainBox]").hide()
    // offRefreshStatus()
    // breakerStop();
    // fullStop();

  
  
    setTimeout(() => {
      scanUnreadMessages(async function () {
  
        // alert('ALL DONE');
      
   
      
        // console.log('ALL DONE');
  
        await openMsg(async function (btn) {
   
              
                await checkBeforeSent();
                // await datasample2();
              
                await new Promise(resolve => {

                  msgsentonce = false;
                
                  setTimeout(resolve, 1000);
                
                });
            
        });
        await reloadTimer({
          type: "s",
          time: Number($("#timerr").val())
        });
 
      });
  
      setTimeout(() => {
   
      }, 400);
    }, 400);
  }



});


// STOP BUTTON
document.querySelector('#tsStopBtn')?.addEventListener('click', () => {
  startonce = false
  keepOpen.stop();
  $("#tsStartBtn").text(`▶`)
  stopReloadTimer()
  setLocalLogic("autoRunnerMsg", false);
  stopLocalLogic("autoRunnerMsg");
});


// $("[mainBox]").hide()