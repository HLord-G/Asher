const owl_data = [];
let message = [];
let mainObserver;
let commentObserver;

let username = "mysticriddlehurricane"




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


        if ($container.length > 0) {

            // ✅ reset message kada open
            message = [];

            if (!$textarea.attr('owl_comment')) $textarea.attr('owl_comment', '');
            if (!$sendBtn.attr('owl_sent')) $sendBtn.attr('owl_sent', '');
            if (!$closeBtn.attr('owl_clsoe_com')) $closeBtn.attr('owl_clsoe_com', '');

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
            clearInterval(interval);
        }
    }, 400);
}



// setTimeout(() => {

//     const selector = `[owl_coms=${owl_data[0]["owl_coms"]}]`;
//     const $target = $(selector);

//     if ($target.length === 0) {
//         console.log("❌ Target not found");
//         return;
//     }

//     // ✅ CLICK
//     $target.click();
//     startObserving();

//     console.log("Clicked:", owl_data[0]["owl_coms"]);
//     console.log("|+========================================================+|");

//     // ✅ WAIT COMMENT BOX
//     waitForCommentBox((commentBox) => {

//         // ✅ TYPE COMMENT
//         commentBox.value = "nice onesss";
//         commentBox.dispatchEvent(new Event('input', { bubbles: true }));
//         console.log("✅ Comment set!");

//         // OPTIONAL SEND
//         /*
//         setTimeout(() => {
//             $("[owl_sent]").click();
//             console.log("📤 Sent!");
//         }, 500);
//         */

//         // ✅ WAIT MESSAGE DATA
//         waitForMessage((msg) => {

//             console.log("=======================================================");
//             console.log("✅ USER:", msg[0].user);
//             console.log("=======================================================");

//             // ✅ CLEANUP AFTER SUCCESS
//             if (window.commentObserver) {
//                 window.commentObserver.disconnect();
//                 window.commentObserver = null;
//             }

//         });

//     });

// }, 5000);




// setTimeout(() => {

//     const selector = `[owl_coms=${owl_data[0]["owl_coms"]}]`;
//     const $target = $(selector);

//     if ($target.length === 0) {
//         console.log("❌ Target not found");
//         return;
//     }

//     // ✅ CLICK
//     $target.click();
//     startObserving();

//     console.log("Clicked:", owl_data[0]["owl_coms"]);
//     console.log("|+========================================================+|");

//     // ✅ WAIT COMMENT BOX
//     waitForCommentBox((commentBox) => {

//         // ✅ TYPE COMMENT
//         commentBox.value = "nice onesss";
//         commentBox.dispatchEvent(new Event('input', { bubbles: true }));
//         console.log("✅ Comment set!");

//         // OPTIONAL SEND
//         setTimeout(() => {
//             $("[owl_sent]").click();
//             console.log("📤 Sent!");
//         }, 500);
        

//         // ✅ WAIT MESSAGE DATA
//         waitForMessage((msg) => {

//             console.log("=======================================================");
//             console.log("✅ USER:", msg[0].user);
//             console.log("=======================================================");

//             // ✅ CLEANUP AFTER SUCCESS
//             if (window.commentObserver) {
//                 window.commentObserver.disconnect();
//                 window.commentObserver = null;
//             }

//         });

//     });

// }, 15000);









/*

setTimeout(() => {
  $(`[owl_coms=${owl_data[1]["owl_coms"]}]`).click()
  console.log(owl_data[1]["owl_coms"])
  console.log("|+========================================================+|")
  setTimeout(() => {
  }, 30);
}, 15000);



setTimeout(() => {
  $(`[owl_coms=${owl_data[3]["owl_coms"]}]`).click()
  console.log(owl_data[3]["owl_coms"])
  console.log("|+========================================================+|")
  setTimeout(() => {
  }, 30);
}, 35000);

*/




function atoCom(comm, delaySec = 5, breakTime = 10000, perPost = 2) {

    let index = 0;
    let count = 0;
 

    function processNext() {

        if (index >= owl_data.length) {
            console.log("✅ DONE tanan");
            return;
        }

        const selector = `[owl_coms=${owl_data[index]["owl_coms"]}]`;
        const $target = $(selector);

        if ($target.length === 0) {
            console.log(`❌ Target not found index ${index}`);
            index++;
            processNext();
            return;
        }

        console.log(`🚀 Checking index ${index}`);

        // CLICK + START OBSERVE
        $target.click();
        startObserving();

        // ✅ WAIT MESSAGE FIRST (IMPORTANT)
        waitForMessage((msg) => {

            let alreadyCommented = false;

            // 🔍 CHECK KUNG NAA NA COMMENT ANG USER
            for (let i = 0; i < msg.length; i++) {
                let u = msg[i].user.toLowerCase();
                let c = msg[i].comment.toLowerCase();

                if (u.includes(username.toLowerCase()) && c.includes(comm.toLowerCase())) {
                    alreadyCommented = true;
                    break;
                }
            }

            if (alreadyCommented) {
                console.log("⏭️ SKIP - Already commented");

                cleanupAndNext();
                return;
            }

            console.log("💬 Wala pa comment, mo post ta...");

            // ✅ WAIT COMMENT BOX
            waitForCommentBox((commentBox) => {

                commentBox.value = comm;
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));

                console.log("✍️ Comment set");

                setTimeout(() => {
                    $("[owl_sent]").click();
                    console.log("📤 Sent!");
                }, 500);

                cleanupAndNext();
            });

        });

    }

    function cleanupAndNext() {

        if (window.commentObserver) {
            window.commentObserver.disconnect();
            window.commentObserver = null;
        }

        setTimeout(() => {

            index++;
            count++;

            // BREAK LOGIC
            if (count >= perPost) {
                console.log(`⏸ Break ${breakTime}ms`);
                count = 0;

                setTimeout(() => {
                    processNext();
                }, breakTime);

            } else {
                setTimeout(() => {
                    processNext();
                }, delaySec * 1000);
            }

        }, 1500);
    }

    processNext();
}


atoCom("NICE", 5, 10000, 2)