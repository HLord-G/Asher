



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


  $("[mainBox]").hide()

  offRefreshStatus()

  setTimeout(() => {
    $("#tsStartBtn").click()
  }, 4000);


  breakerStop();
  fullStop();

  
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


  
function getfullLink() {
    return window.location.href;
}

  target.prepend(purpleBtn);
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




injectUI();
// tsAutoStart(); // ✅ I-call after injectUI
persistentInput("userx");
persistentInput("timerr");
persistentInput("firstmsg");
persistentInput("secondmsg");
persistentInput("thirdmsg");
runLocalLogic("functest");



const keepOpen = keepConversationOpen();

// START BUTTON
document.querySelector('#tsStartBtn')?.addEventListener('click', () => {

  if (!startonce) {
    startonce = true
    keepOpen.start();
    $("#menuBtn").click()
    $("#tsStartBtn").text(`⏯`)
    setLocalLogic("autoRunnerMsg", true);


    $("[mainBox]").hide()
    offRefreshStatus()
    breakerStop();
    fullStop();

  
  
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