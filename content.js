const owl_data = [];

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