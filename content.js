const owl_data = [];
let message = [];
let mainObserver;
let commentObserver;




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
// let message = []; 

function startObserving() {
    if (window.mainObserver) {
        console.log("Main observer is already running.");
        return; 
    }

    window.mainObserver = new MutationObserver(() => {
        const $container = $('div[data-testid="notes-root"]');
        const $textarea = $('textarea[aria-label="Reply"]');
        const $sendBtn = $('button[data-testid="reply-button"]');

        if ($container.length > 0) {
            if (!$textarea.attr('owl_comment')) $textarea.attr('owl_comment', '');
            if (!$sendBtn.attr('owl_sent')) $sendBtn.attr('owl_sent', '');

            if (!window.commentObserver) {
                console.log("Monitoring comments loading...");
                
                window.commentObserver = new MutationObserver(() => {
                    let currentMessages = [];
                    
                    // CHECKPOINT 1: Nakit-an ba niya ang comment wrappers?
                    const $commentWrappers = $('div.MI6Q7'); // Suwayi og tangtang ang [aria-label="Reply"] una para mas broad
                    console.log(`Nakit-an nga comment wrappers: ${$commentWrappers.length}`);

                    $commentWrappers.each(function() {
                        // Mangita sa user ug comment
                        const user = $(this).find('div[aria-label="Blog name"] a').text().trim();
                        const commentText = $(this).find('.k31gt').text().trim();
                        
                        // CHECKPOINT 2: Nakit-an ba niya ang text sulod sa matag wrapper?
                        console.log(`Checking wrapper... User: "${user}", Comment: "${commentText}"`);

                        if (user && commentText) {
                            currentMessages.push({ user, comment: commentText });
                        }
                    });

                    // Update the array kung naay nabag-o
                    if (JSON.stringify(message) !== JSON.stringify(currentMessages)) {
                        message = currentMessages;
                        console.log("Message updated:", message);
                    }
                });

                // Gidugang ang characterData para ma-detect kung ang text mismo ang nag-ilis
                window.commentObserver.observe($container[0], { childList: true, subtree: true, characterData: true });
            }
        } else {
            if (window.commentObserver) {
                window.commentObserver.disconnect();
                window.commentObserver = null;
                message = [];
                console.log("Popup closed, message cleared.");
            }
        }
    });

    window.mainObserver.observe(document.body, { childList: true, subtree: true });
}

// aria-label="Reply restricted"

// message
// owl_comment
// owl_sent
// ==========================================================================================================================[E] COMMENT AREA


  startObserving();

let clickonce = false
setTimeout(() => {
    $(`[owl_coms=${owl_data[0]["owl_coms"]}]`).click()
 startObserving();
    console.log(owl_data[0]["owl_coms"])
    console.log("|+========================================================+|")

    setTimeout(() => {
     const commentBox = document.querySelector('textarea[owl_comment]');
      if (commentBox) {
          commentBox.value = "nice onesss";
          commentBox.dispatchEvent(new Event('input', { bubbles: true }));
          console.log("Success: Na-set na ang value!");


          setTimeout(() => {
            clickonce = true
            if (clickonce) {
              // $("[owl_sent]").click()
              setTimeout(() => {
                clickonce = false
              }, 20);
            }
          }, 1000);

      } else {
          console.log("Error: Wala nakit-an ang textarea. Basin naa sa sulod sa iframe?");
      }
    }, 2000);

}, 5000);





setTimeout(() => {
    $(`[owl_coms=${owl_data[1]["owl_coms"]}]`).click()
 startObserving();
    console.log(owl_data[1]["owl_coms"])
    console.log("|+========================================================+|")

    setTimeout(() => {
     const commentBox = document.querySelector('textarea[owl_comment]');
      if (commentBox) {
          commentBox.value = "nice onesss";
          commentBox.dispatchEvent(new Event('input', { bubbles: true }));
          console.log("Success: Na-set na ang value!");


          setTimeout(() => {
            clickonce = true
            if (clickonce) {
              // $("[owl_sent]").click()
              setTimeout(() => {
                clickonce = false
              }, 20);
            }
          }, 1000);

      } else {
          console.log("Error: Wala nakit-an ang textarea. Basin naa sa sulod sa iframe?");
      }
    }, 2000);

}, 15000);



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







function atoCom(comm, delay, brks, pst) {
  


}
