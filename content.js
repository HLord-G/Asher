const owl_data = [];
let message = [];
let mainObserver;
let commentObserver;
let username = "mysticriddlehurricane"

let comment;
let percount = 0;
let _anyChange = 0;

//==================================================== [S] EH LOAD TANAN
function autoScrollLoadAll() {
  let lastHeight = 0;
  let sameCount = 0;

  const interval = setInterval(() => {
    // scroll down
    window.scrollTo(0, document.body.scrollHeight);

    let newHeight = document.body.scrollHeight;

    if (newHeight === lastHeight) {
      sameCount++;

      // kung 3x same height → wala na nag load
      if (sameCount >= 3) {
        clearInterval(interval);
        alert("Loaded na tanan articles ✅");
      }
    } else {
      sameCount = 0; // reset kung naay new load
      lastHeight = newHeight;
    }

  }, 1500); // adjust delay kung hinay net
}

// trigger
// autoScrollLoadAll();

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
}
//==================================================== [E] EH LOAD TANAN


 


$("body").append(`



  <div style="
    position:fixed;
    bottom:20%;
    right:0%;
    padding:10px;
    border-radius:8px;
    z-index:9999;
    display:flex;
    justify-items: start;
    flex-flow:row;
    flex-flow: column;
    align-items: end;
  ">

<button id="menuBtn"
  style="padding:3px; background:#7b2cbfff; color:#fff; border:none; cursor:pointer;">
     <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="currentColor"><path d="M440-280h80l12-60q12-5 22.5-10.5T576-364l58 18 40-68-46-40q2-14 2-26t-2-26l46-40-40-68-58 18q-11-8-21.5-13.5T532-620l-12-60h-80l-12 60q-12 5-22.5 10.5T384-596l-58-18-40 68 46 40q-2 14-2 26t2 26l-46 40 40 68 58-18q11 8 21.5 13.5T428-340l12 60Zm-16.5-143.5Q400-447 400-480t23.5-56.5Q447-560 480-560t56.5 23.5Q560-513 560-480t-23.5 56.5Q513-400 480-400t-56.5-23.5ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>
</button>

<div id="mainBox" style="width:210px; background:#10002bff; padding:15px; border:1px solid white; border-radius:12px 0px 12px 12px; font-family:sans-serif; color:#fff;">

  <div timers style="margin-bottom:10px;">
    <label style="font-size:12px; color:#c77dffff;">Break</label><br>
    <select mints style="width:100%; padding:5px; background:#240046ff; color:#fff; border:none; border-radius:6px; margin-top:5px;">
      <option value="hrs">hrs</option>
      <option value="mins">mins</option>
      <option value="sec">sec</option>
    </select>
    <input type="number" time placeholder="Enter value"
      style="width:100%; margin-top:5px; padding:5px; background:#3c096cff; color:#fff; border:none; border-radius:6px;">
  </div>

  <div post_selections style="margin-bottom:10px;">
    <label style="font-size:12px; color:#c77dffff;">Post Count</label><br>
    <input type="number" manypost placeholder="How many posts"
      style="width:100%; margin-top:5px; padding:5px; background:#3c096cff; color:#fff; border:none; border-radius:6px;">
  </div>

    <div post_selections style="margin-bottom:10px;">
    <label style="font-size:12px; color:#c77dffff;">Loop</label><br>
    <input type="number" loops placeholder="How many Loops"
      style="width:100%; margin-top:5px; padding:5px; background:#3c096cff; color:#fff; border:none; border-radius:6px;">
  </div>

  <div comment style="margin-bottom:10px;">
    <label style="font-size:12px; color:#c77dffff;">Comment</label><br>
   <textarea comments placeholder="Write comment..."
  style="width:100%; margin-top:5px; height:130px; font-size:13px; padding:5px; background:#3c096cff; color:#fff; border:none; border-radius:6px; resize:vertical;"></textarea>
  </div>

  <div refresh style="margin-bottom:10px; font-size:12px;">
    <span style="color:#c77dffff;">Refresh</span>
    <input refresh_status type="checkbox" style="margin-left:5px;">
  </div>

  <button starts
    style="width:100%; padding:8px; background:#7b2cbfff; border:none; border-radius:8px; color:#fff; font-weight:bold; cursor:pointer;">
    START
  </button>

</div>


<button openthis style="position:fixed; left:-400%;"> opeen </button>
</div>


`)


$(document).on("click", "#menuBtn", function() {
  $("#mainBox").toggle();
});

// PARA DILI MA WALA KUNG EH REFRESH
$(document).ready(function () {

    const STORAGE_KEY = "myExtensionData";

    // 🔹 SAVE
    function saveData() {
        const data = {
            mints: $('[mints]').val(),
            time: $('[time]').val(),
            manypost: $('[manypost]').val(),
            loops: $('[loops]').val(), // ✅ NEW
            comments: $('[comments]').val(),
            refresh_status: $('[refresh_status]').is(':checked')
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log("AUTO SAVED", data);
    }

    // 🔹 LOAD
    function loadData() {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

        $('[mints]').val(data.mints || '');
        $('[time]').val(data.time || '');
        $('[manypost]').val(data.manypost || '');
        $('[loops]').val(data.loops || ''); // ✅ NEW
        $('[comments]').val(data.comments || '');
        $('[refresh_status]').prop('checked', data.refresh_status || false);
    }

    // 🔥 AUTO SAVE (ALL FIELDS APIL LOOPS)
    $(document).on(
        'input change',
        '[mints], [time], [manypost], [loops], [comments], [refresh_status]',
        function () {
            autoSave();
        }
    );

    // 🔥 MUTATION OBSERVER (para bisan gi edit via JS)
    const observer = new MutationObserver(() => {
        autoSave();
    });

    observer.observe(document.getElementById('mainBox'), {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });

    // 🔥 DEBOUNCE (para dili spam save)
    let timeout;
    function autoSave() {
        clearTimeout(timeout);
        timeout = setTimeout(saveData, 300);
    }

    // 🔹 INIT
    loadData();

});



















// ==========================
// GENERATE UNIQUE ID
// ==========================
function generateID(length = 15) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ==========================
// GET AVATAR (FIXED)
// ==========================
function getAvatar(imgEl) {
  if (!imgEl) return "";

  // 🔥 BEST: actual loaded image
  if (imgEl.currentSrc) {
    return imgEl.currentSrc.replace(".pnj", ".png");
  }

  // Try srcset
  const srcset = imgEl.getAttribute("srcset");
  if (srcset) {
    const urls = srcset.split(",");
    const last = urls[urls.length - 1];
    const match = last.match(/https:[^ ]+/);
    if (match) return match[0].replace(".pnj", ".png");
  }

  // Fallback src
  const src = imgEl.getAttribute("src");
  if (src) {
    return src.replace(".pnj", ".png");
  }

  return "";
}

// ==========================
// WAIT FOR IMAGE TO LOAD
// ==========================
function waitForImage(imgEl, callback, retries = 15) {
  if (!imgEl) return callback("");

  const check = () => {
    // ✅ ensure image is loaded
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      return callback(getAvatar(imgEl));
    }

    if (retries <= 0) {
      return callback(getAvatar(imgEl));
    }

    retries--;
    setTimeout(check, 300);
  };

  check();
}

// ==========================
// MAIN FUNCTION
// ==========================
function articles_gen() {
  const articles = document.querySelectorAll("article");

  articles.forEach((article) => {
    // ❌ skip already processed
    if (article.hasAttribute("owl_gen")) return;

    const genID = generateID();
    article.setAttribute("owl_gen", genID);

    // ======================
    // COMMENT BUTTON
    // ======================
    const commentBtn = article.querySelector('button[aria-label="Comment"]');

    let comID = null;
    if (commentBtn) {
      comID = generateID();
      commentBtn.setAttribute("owl_coms", comID);
    }

    // ======================
    // USERNAME
    // ======================
    const userEl = article.querySelector('a[rel="author"]');
    const username = userEl ? userEl.textContent.trim() : "unknown";

    // ======================
    // AVATAR IMAGE
    // ======================
    const imgEl = article.querySelector('figure[aria-label="Avatar"] img');

    waitForImage(imgEl, (img) => {
      const data = {
        owl_username: username,
        owl_img: img,
        owl_gen: genID,
        owl_coms: comID,
        timestamp: Date.now()
      };

      // 🔥 prevent duplicates
      if (!owl_data.some(item => item.owl_gen === genID)) {
        owl_data.push(data);
        console.log("Captured:", data);
      }
    });
  });
}

// ==========================
// INITIAL RUN
// ==========================
setTimeout(() => {
  articles_gen();
}, 2000);

// ==========================
// OBSERVER (OPTIMIZED)
// ==========================
let debounceTimer;

new MutationObserver((mutations) => {
  // 🔍 only run if article added
  const hasArticle = mutations.some(m =>
    [...m.addedNodes].some(node =>
      node.nodeType === 1 &&
      (node.matches?.("article") || node.querySelector?.("article"))
    )
  );

  if (!hasArticle) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    articles_gen();
  }, 500);
}).observe(document.body, {
  childList: true,
  subtree: true
});


// ==========================================================================================================================[S] COMMENT AREA

// I-sigurado nga naay global o outer variable ani aron dili mag-error

function startObserving() {
    if (window.mainObserver) {
        console.log("Main observer is already running.");
        return;
    }

    window.mainObserver = new MutationObserver(() => {
        const $container = $('div[data-testid="notes-root"]');
        const $textarea = $('textarea[aria-label="Reply"]');
        const $sendBtn = $('button[data-testid="reply-button"]');
        const $closeBtn = $('button[class="VmbqY r21y5 Li_00 zn53i KmpWV EF4A5 undefined"]');
        const $restreck = $(`div[aria-label="Reply restricted"]`);

        if ($container.length > 0) {

            // ✅ reset message kada open
            message = [];

            if (!$textarea.attr('owl_comment')) $textarea.attr('owl_comment', '');
            if (!$sendBtn.attr('owl_sent')) $sendBtn.attr('owl_sent', '');
            if (!$closeBtn.attr('owl_clsoe_com')) $closeBtn.attr('owl_clsoe_com', '');
            if (!$restreck.attr('sirado')) $restreck.attr('sirado', '');


            if (!window.commentObserver) {
                console.log("Monitoring comments loading...");

                window.commentObserver = new MutationObserver(() => {

                    // gamay delay para sure loaded ang DOM
                    setTimeout(() => {

                        let currentMessages = [];

                        const $commentWrappers = $container.find('div.MI6Q7');
                        console.log(`Nakit-an nga comment wrappers: ${$commentWrappers.length}`);

                        $commentWrappers.each(function () {
                            const user = $(this).find('div[aria-label="Blog name"] a').text().trim();
                            const commentText = $(this).find('.k31gt').text().trim();

                            console.log(`User: "${user}", Comment: "${commentText}"`);

                            if (user && commentText) {
                                currentMessages.push({ user, comment: commentText });
                            }
                        });

                        // ✅ mas safe compare
                        if (currentMessages.length !== message.length) {
                            message = currentMessages;
                              console.log("Message updated:", message);
                        }

                    }, 300);

                });

                window.commentObserver.observe($container[0], {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            }

        } else {
            // ✅ cleanup kung close ang popup
            if (window.commentObserver) {
                window.commentObserver.disconnect();
                window.commentObserver = null;
                // message = [];
                console.log("Popup closed, message cleared.");
            }
        }
    });

    window.mainObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function clickAndRefresh(index, delay) {
    setTimeout(() => {

        // ✅ stop previous observer
        if (window.commentObserver) {
            window.commentObserver.disconnect();
            window.commentObserver = null;
        }

        // ✅ reset message
        // message = [];

        // ✅ click target
        const selector = `[owl_coms="${owl_data[index].owl_coms}"]`;
        const $target = $(selector);

        if ($target.length > 0) {
            $target.click();
            console.log(`Clicked index ${index}`);
        } else {
            console.log(`Element not found for index ${index}`);
        }

    }, delay);
}

// aria-label="Reply restricted"

// message
// owl_comment
// owl_sent
// ==========================================================================================================================[E] COMMENT AREA


startObserving();






let clickonce = false;
let ifSent = false;

function waitForCommentBox(callback) {
    let tries = 0;

    const interval = setInterval(() => {
        const el = document.querySelector('textarea[owl_comment]');
        if (el) {
            clearInterval(interval);
            callback(el);
        }

        if (++tries > 15) {
            console.log("❌ No comment box");
            clearInterval(interval);
        }
    }, 300);
}

function waitForMessage(callback) {
    let tries = 0;

    const interval = setInterval(() => {
        if (message && message.length > 0) {
            clearInterval(interval);
            callback(message);
        }

        if (++tries > 15) {
            console.log("❌ No message detected");
            $("[owl_sent]").click();
            clearInterval(interval);
        }
    }, 400);
}

// setTimeout(() => {
//   const selector = `[owl_coms=${owl_data[3]["owl_coms"]}]`;
//   const $target = $(selector);

//   $target.click()
// }, 2000);

// setTimeout(() => {

//     const selector = `[owl_coms=${owl_data[3]["owl_coms"]}]`;
//     const $target = $(selector);

//     if ($target.length === 0) {
//         console.log("❌ Target not found");
//         return;
//     }

//     // ✅ CLICK
//     $target.click();
//     startObserving();

//     console.log("Clicked:", owl_data[3]["owl_coms"]);
//     console.log("|+========================================================+|");

//     // ✅ WAIT COMMENT BOX
//     waitForCommentBox((commentBox) => {
//       const $textarea = $('textarea[aria-label="Reply"]');

//         // ✅ TYPE COMMENT
//         let comms = "nice onesss";
//         commentBox.value = comms;
//         commentBox.dispatchEvent(new Event('input', { bubbles: true }));
//         console.log("✅ Comment set!");

//         if ($textarea.attr('owl_comment')){
//           $("[owl_clsoe_com]").click()
//         }

//         // OPTIONAL SEND
//         // ✅ WAIT MESSAGE DATA
//         waitForMessage((msg) => {

//                 console.log("=======================================================");
//                 msg.forEach(x => {
//                     if (x.user === username && x.comment === comms) {
//                         console.log("⚠️ cancel (duplicate)");
//                         $("[owl_clsoe_com]").click()
//                     }else{
//                       $("[owl_sent]").click();

//                       setTimeout(() => {
//                         $("[owl_clsoe_com]").click()
//                       }, 1900);
//                     }
//                 });
            
//             console.log("=======================================================");

//             // ✅ CLEANUP AFTER SUCCESS
//             if (window.commentObserver) {
//                 window.commentObserver.disconnect();
//                 window.commentObserver = null;
//             }

//         });

//     });

// }, 5000);





let countSelect = 0;
let isRunning = false;
let perPostCounter = 0

function wait(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function openerComm(delayTime = 2000, isLoop = true){
  
  if(isRunning) return;
  isRunning = true;

  if (!owl_data || owl_data.length === 0) {
    console.warn("⚠️ owl_data is empty or undefined");
    isRunning = false;
    return;
  }

  try {
    while(isLoop && countSelect < owl_data.length){
      $("[owl_clsoe_com]").click()
      const selector = `[owl_coms=${owl_data[countSelect]["owl_coms"]}]`;
      const $target = $(selector);

      console.log("🔍 Trying:", selector);

      if ($target.length === 0) {
        console.log("❌ Not found:", selector);
        countSelect++;
        continue;
      }

      await wait(delayTime);

      $target.click();
      console.log("✅ Clicked:", selector);

      countSelect++;

      await wait(delayTime);
    }
  } catch(err) {
    console.error("💥 Error:", err);
  } finally {
    isRunning = false;
  }
}

function delayOppner(params) {
  $("[owl_clsoe_com]").click()
  
  // Check if attribute EXISTS
  startObserving();

    setTimeout(() => {
      
        const selector = `[owl_coms=${owl_data[countSelect]["owl_coms"]}]`;
        const $target = $(selector);
        $target.click()
       
        countSelect++
    }, params * 1000);
}


// function perPostChecker(){
//         if (percount <= perPostCounter) {
//             alert("okay na")
//             return;
//         }
// }
// function percountSetup(params) {
//   percount = params
// }percountSetup(3)



 // =========================
// 🌐 GLOBALS
// =========================

let clickPerActionCount  = 0;
let clickPerActionTarget = 0;
let isProceeding         = false;
let isWorking            = false; // ✅ FIX

let timerBreakReps    = 0;
let timerBreakTarget  = 0;
let timerBreakDelay   = 0;
let timerBreakRefresh = false;
let sent_once = false;


// =========================
// Milisecond Converter
// =========================
function timerConverter_mil({ status, timer }) {
    if (!status || !timer) return 0;

    const timeMap = {
        hrs: 3600000,   // 1 hour = 3600000 ms
        mins: 60000,    // 1 minute = 60000 ms
        sec: 1000       // 1 second = 1000 ms
    };

    return (timeMap[status] || 0) * timer;
}




// =========================
// 💾 SAVE / LOAD STATE
// =========================
function saveState() {
  localStorage.setItem("auto_state", JSON.stringify({
    clickPerActionTarget,
    timerBreakReps,
    timerBreakTarget,
    timerBreakDelay,
    timerBreakRefresh,
    comment,
    lastBreakTime: Date.now()
  }));
}

function loadState() {
  const saved = localStorage.getItem("auto_state");
  if (!saved) return false;

  localStorage.removeItem("auto_state");

  const state = JSON.parse(saved);

  clickPerActionTarget = state.clickPerActionTarget;
  clickPerActionCount  = 0;
  timerBreakReps       = state.timerBreakReps;
  timerBreakTarget     = state.timerBreakTarget;
  timerBreakDelay      = state.timerBreakDelay;
  timerBreakRefresh    = state.timerBreakRefresh;
  comment              = state.comment;

  clickonce    = false;
  isProceeding = false;
  isWorking    = false; // ✅ FIX

  console.log(`♻️ Resumed | rep ${timerBreakReps}/${timerBreakTarget} | posts reset to 0/${clickPerActionTarget}`);

  const elapsed   = Date.now() - (state.lastBreakTime || 0);
  const remaining = Math.max(0, timerBreakDelay - elapsed);

  console.log(`⏳ Continuing in ${remaining / 1000}s...`);

  setTimeout(() => {
    triggerNext("resume after refresh");
  }, remaining);

  return true;
}

// =========================
// ⏱ TIMER BREAK
// =========================
function timerBreak(delay, reps, refresh) {
  timerBreakDelay   = delay;
  timerBreakTarget  = reps;
  timerBreakRefresh = refresh;
  timerBreakReps    = 0;
}

function onClickPerActionDone() {
  if (timerBreakTarget === 0) return;

  timerBreakReps++;
  console.log(`⏱️ Rep ${timerBreakReps}/${timerBreakTarget} done. Waiting ${timerBreakDelay / 1000}s...`);

  if (timerBreakReps >= timerBreakTarget) {
    console.log(`🏁 All reps done!`);
    timerBreakTarget = 0;
    timerBreakReps   = 0;
    return;
  }

  setTimeout(() => {
    if (timerBreakRefresh) {
      console.log("🔄 Saving state then refreshing...");
      saveState();
      location.reload();
    } else {
      clickPerActionCount = 0;
      triggerNext("timerBreak next rep");
    }
  }, timerBreakDelay);
}

// =========================
// ▶️ ACTION CONTROL
// =========================
function clickPerAction(n) {
  clickPerActionTarget = n;
  clickPerActionCount  = 0;
  triggerNext("start");
}

function commnet(params) {
  comment = params;
}

// =========================
// 🔁 MAIN LOOP
// =========================
function triggerNext(reason = "") {
  if (isProceeding || isWorking) return; // ✅ FIX

  if (clickPerActionTarget > 0 && clickPerActionCount >= clickPerActionTarget) {
    console.log(`✅ All ${clickPerActionTarget} posts done for this rep.`);
    isProceeding = false;
    clickonce    = false;
    onClickPerActionDone();
    return;
  }

  isProceeding = true;
  clickonce    = false;

  console.log(`➡️ ${reason} | post ${clickPerActionCount + 1}/${clickPerActionTarget}`);

  setTimeout(() => {
    isProceeding = false;
    isWorking = true; // ✅ LOCK
    $("[openthis]").click();
  }, 2000);
}

// =========================
// 🧠 AUTO-RESUME
// =========================
$(document).ready(function () {
  setTimeout(() => {
    if (localStorage.getItem("auto_state")) {
      loadState();
    }
  }, 1500);
});

// =========================
// 🧠 START BUTTON
// =========================
$(document).on("click", "[starts]", function () {

    const data_comment_event = {
            mints: $('[mints]').val(),
            time: $('[time]').val(),
            manypost: $('[manypost]').val(),
            loops: $('[loops]').val(), // ✅ NEW
            comments: $('[comments]').val(),
            refresh_status: $('[refresh_status]').is(':checked')
        };


  setTimeout(() => {
    clickPerAction(data_comment_event["manypost"]);
    timerBreak(timerConverter_mil({
      status:`${data_comment_event["mints"]}`,
      timer:Number(data_comment_event["time"])
    }), Number(data_comment_event["loops"]), data_comment_event["refresh_status"]);
    commnet(`${data_comment_event["comments"]}`);
  }, 1000);
});

// =========================
// 💬 COMMENT FLOW
// =========================
$(document).on("click", "[openthis]", function () {
  if (clickonce) return;

  clickonce = true;
  delayOppner(1);

setTimeout(() => {
  try {
    insfections();

    waitForCommentBox((box) => {

      // ✅ SET VALUE (React-safe)
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      ).set;

      nativeSetter.call(box, comment);
      box.dispatchEvent(new Event("input", { bubbles: true }));

      waitForMessage((msg) => {
        let success = true;

        const found = msg.some(x => {
          if (x.user === username && x.comment === comment) {
            console.log("🔄 Duplicate detected, clearing message...");

            clickonce    = false;
            isProceeding = false;
            isWorking    = false;

            // ✅ CLEAR BOX (FIXED)
            clearMessageBox(box);

            setTimeout(() => {
              $("[openthis]").click();
            }, 2000);

            success = false;
            return true;
          }
        });

        // ✅ SUCCESS CASE
        if (success && !found) {
          clickPerActionCount++;
          console.log(`✅ Post ${clickPerActionCount}/${clickPerActionTarget}`);
          // sender
          // ma sent ang message.
          if (!sent_once) {
              sent_once = true
            $("[owl_sent]").click()

            setTimeout(() => {
              sent_once = false
            }, 600);
          }
          

        }

        // ✅ CLEAN OBSERVER
        if (window.commentObserver) {
          window.commentObserver.disconnect();
          window.commentObserver = null;
        }

        isWorking = false; // release lock

        if (success) triggerNext("success");
      });

    });

  } catch (e) {
    console.error("❌ Error:", e);

    clickonce    = false;
    isProceeding = false;
    isWorking    = false;
  }
}, 1000);
});


function clearMessageBox(box) {
  if (!box) return;

  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  ).set;

  nativeSetter.call(box, "");

  box.dispatchEvent(new Event("input", { bubbles: true }));

  // optional but helps on some sites
  box.blur();
  box.focus();
}


// =========================
// 🚫 RESTRICT CHECK
// =========================
function insfections() {
  startObserve();
}

function startObserve() {
  if (window.restrictObserver) {
    window.restrictObserver.disconnect();
  }

  window.restrictObserver = new MutationObserver(() => {
    const el = document.querySelector("[sirado]");

    if (el && el.innerText.trim() !== "") {
      console.log("🚫 Restricted - skip");
      window.restrictObserver.disconnect();

      isWorking = false; // ✅ FIX

      setTimeout(() => {
        triggerNext("restricted skip");
      }, 1000);
    }
  });

  window.restrictObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout(() => {
    if (window.restrictObserver) {
      window.restrictObserver.disconnect();
      isWorking = false; // ✅ FIX
      triggerNext("observer timeout");
    }
  }, 10000);
}


    // if ($target.is('[sirado]')) {



// gusto nako baguhon ni buhatan nako function 
// atoCom("NICE", 5, 2, 5000)



// atoCom(comm, delaySec, perPost, breakTime) 
 


// comm      = kung unsa ang comment akung eh post
// delaySec  = delay kung pila ka second haya mag pili ug lain na post
// perPost   = kung pila ka post ang eh comment
// breakTime = pag na comment na nimo tanan post na ge asign sa perPost mag break siya unya pag ma hurot na oras sa break mo balik napud siya loop

// and ang gamit gyud ani is kwaon ang comments startObserving()
// haya siya mag post eh check sa niya ang username ug ang comment kung same kung parihas dili na eh post ug ma escape na
// sa lain comment ug dili na mag delay 

// tapus ang delay wala ge gana ug ayu murag same same ra sila sa break mali ni

// atoCom("NICE", 5, 2, 10000, true)


// ani man gud dapat example

// atoCom("NICE", 5, 2, 10000, true)

// delay 5sec
// post "NICE"
// delay 5sec
// post "NICE"
// break 10sec
// repeat
// delay 5sec
// post "NICE"
// delay 5sec
// post "NICE"
// break 10sec

// balik balik lang hantud