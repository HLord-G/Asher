
 
/*========================================================================  [S] Get Items*/ 


//[*] pag kuha sa BSRP
function getBestSellersRank() {
  let rank = null;
  
  $("tr").each(function() {
      const headerText = $(this).find("th.prodDetSectionEntry").text().trim();
      
      if (headerText.includes("Best Sellers Rank")) {
          const firstRankText = $(this).find("ul li:first-child .a-list-item").text().trim();
          const match = firstRankText.match(/#([\d,]+)/);
          
          if (match) {
              rank = parseInt(match[1].replace(/,/g, ""), 10);
          }
      }
  });
  
  return rank;
}
console.log("BSRP");
console.log(getBestSellersRank()); // Output: 16



//[*] pag kuha sa Catiguary
function getCategory() {
  let text = $('th:contains("Best Sellers Rank")')
    .next('td')
    .find('li:first span')
    .text();

  // Extract string after "#number in" and before "("
  let match = text.match(/#\d{1,3}(,\d{3})*\s+in\s+(.+?)\s*\(/);

  if (match && match[2]) {
    return match[2].trim();
  }

  return null;
}
console.log("CAtiguary");
console.log(getCategory());




//[*] PAG KUHA SA PRICE
function getPrice() {
  const symbol = $(".a-price-symbol").first().text().trim();
  
  const whole = $(".a-price-whole").first()
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim()
      .replace(/,/g, "");
  
  const fraction = $(".a-price-fraction").first().text().trim();
  
  const fullPrice = parseFloat(`${whole}.${fraction}`);
  
  return {
      symbol,           // "PHP"
      price: fullPrice, // 2421.59
      formatted: `${symbol} ${fullPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` // "PHP 2,421.59"
  };
}
function priceResult(xx){
  if (Number(xx) <= 29) {
    return {
      Status: "Fail",
      StatusCon: 0
    };
  } else {
    return {
      Status: "Pass",
      StatusCon: 1
    };
  }
}
console.log("Price");
console.log(getPrice());
console.log(priceResult(getPrice()["price"]));

// { symbol: "PHP", price: 2421.59, formatted: "PHP 2,421.59" }




//[*] PAG KUHA SA REVIEWS
function getReviewCount() {
  let text = $('#acrCustomerReviewText').text(); // (710)

  let match = text.match(/\((\d{1,3}(,\d{3})*)\)/);

  if (match && match[1]) {
    return match[1].replace(/,/g, ''); // remove comma if naa
  }

  return null;
}
function ReviewCountratingResult(xx) {
  let num = 0;

  if (typeof xx === "string") {
    xx = xx.toLowerCase().trim();

    if (xx.includes("k")) {
      num = parseFloat(xx.replace("k", "")) * 1000;
    } else {
      num = parseFloat(xx.replace(/,/g, ""));
    }
  } else {
    num = Number(xx);
  }

  if (num <= 700) {
    return {
      Status: "Pass",
      StatusCon: 1
    };
  } else {
    return {
      Status: "Fail",
      StatusCon: 0
    };
  }
} // Tester
console.log("Reviews");
console.log(getReviewCount());
console.log(ReviewCountratingResult(getReviewCount()));


//[*] PAG KUHA SA RATINGS
function getRating() {
  let rating = $('#acrPopover')
    .find('span.a-size-small.a-color-base')
    .first()
    .text()
    .trim();

  return rating || null;
}
function ratingResult(xx) {
  if (Number(xx) >= 4) {
    return {
      Status: "Pass",
      StatusCon: 1
    };
  } else {
    return {
      Status: "Fail",
      StatusCon: 0
    };
  }
} // Tester
console.log("Ratings");
console.log(getRating())
console.log(ratingResult(getRating()))
 


// =============================================================== HI10
//[*] pag kuha sa get30DayRevenue
function get30DayRevenue() {
  let value = null;

  $('#h10-product-score')
    .find('div:contains("30-Day Revenue")')
    .each(function () {
      // ang pinaka duol nga container sa value
      let container = $(this).closest('div').nextAll().find('div').filter(function () {
        return /^\$\d{1,3}(,\d{3})*(\.\d+)?$/.test($(this).text().trim());
      }).first();

      if (container.length) {
        value = container.text().replace(/[$,]/g, '');
      }
    });

  return value;
}
function get30DayRevenueResult(xx){
  if (Number(xx) <= 10000) {
    return {
      Status: "Fail",
      StatusCon: 0
    };
  } else {
    return {
      Status: "Pass",
      StatusCon: 1
    };
  }
}
//[*] pag kuha sa month
function getProductAgeInMonths() {
  let dateText = $('#h10-product-score')
    .find('div:contains("Creation Date")')
    .next()
    .find('div')
    .first()
    .text()
    .trim();

  if (!dateText) return null;

  // Convert to Date
  let createdDate = new Date(dateText);
  let today = new Date();

  // Calculate months difference
  let months = (today.getFullYear() - createdDate.getFullYear()) * 12;
  months += today.getMonth() - createdDate.getMonth();

  return months;
}
/*========================================================================  [E] Get Items*/ 



// ====================================================================== [S] COPY PASTE FUNCTIONS
$(document).on('click', '[aside_items]', function() {
    var $el = $(this); // Ang element nga gi-click
    var textToCopy = $el.find('[copy_items]').text().trim();

    // I-save ang original border color para naay balikan
    var originalBorder = $el.css("border-color");

    // Copy sa clipboard
    navigator.clipboard.writeText(textToCopy).then(function() {
        
        // Usba ang border color ngadto sa yellow
        $el.css("border-color", "#ace5ec");

        // I-set ang timer (500 milliseconds) para mobalik sa dati
        setTimeout(function() {
            $el.css("border-color", originalBorder);
        }, 500);

    }).catch(function(err) {
        console.error('Dili ma-copy: ', err);
    });
});
// ====================================================================== [E] COPY PASTE FUNCTIONS


// ====================================================================== [S] PAG HIGHLIGHT SA MGA WALA KA ABUT SA STANDAR
// 1. GLOBAL STATE - Mao ni ang 'Source of Truth'
let isHidingBagsak = true; 

function filterProducts() {
    const productCards = document.querySelectorAll('[data-asin]');

    productCards.forEach(card => {
        const asinValue = card.getAttribute('data-asin');
        
        // SKIP: Kung walay value ang data-asin (e.g. data-asin=""), pasagdan lang.
        if (!asinValue || asinValue.trim() === "") {
            card.style.border = 'none';
            card.style.opacity = '1';
            card.style.display = '';
            card.removeAttribute('bagsakwalaylabut');
            return; 
        }

        // --- DATA EXTRACTION ---
        
        // A. Check if "Sponsored"
        const isSponsored = card.textContent.toLowerCase().includes('sponsored');

        // B. Get Rating (e.g. "4.6 out of 5 stars")
        const ratingElement = card.querySelector('.a-icon-alt');
        const rating = ratingElement ? parseFloat(ratingElement.textContent) : 0;

        // C. Get Views/Ratings Count (Handle 'K' for thousands)
        const viewsElement = card.querySelector('.a-size-mini.puis-normal-weight-text');
        let views = 0;
        if (viewsElement) {
            let viewText = viewsElement.textContent.replace(/[(),]/g, '').toUpperCase();
            if (viewText.includes('K')) {
                views = parseFloat(viewText) * 1000;
            } else {
                views = parseFloat(viewText);
            }
        }

        // D. Get Price
        const priceElement = card.querySelector('.a-price-whole');
        const priceFraction = card.querySelector('.a-price-fraction');
        let price = 0;
        if (priceElement) {
            price = parseFloat(priceElement.textContent.replace(/[,.]/g, ''));
            if (priceFraction) {
                price += parseFloat(priceFraction.textContent) / 100;
            }
        }

        // --- REQUIREMENTS CHECK ---
        const meetsRequirements = 
            !isSponsored &&        // Dili Sponsored
            rating >= 4 &&         // Rating 4 pataas
            views <= 600 &&        // Views 600 pa ubos
            price >= 29;           // Price 29 pataas

        // --- APPLY LOGIC ---
        if (!meetsRequirements) {
            // MARK AS BAGSAK
            card.setAttribute('bagsakwalaylabut', 'true');
            card.style.border = '3px solid red';
            card.style.opacity = '0.3';

            // Ang DISPLAY mag-depende sa 'isHidingBagsak' variable
           card.style.display = isHidingBagsak ? 'none' : 'block';

        } else {
            // NAKAPASAR
            card.removeAttribute('bagsakwalaylabut');
            card.style.border = 'none'; 
            card.style.opacity = '1';
            card.style.display = ''; 
        }
    });
}

// 2. JQUERY TRIGGER - Event Delegation
$(document).on('click', '[product_trigger]', function() {
    // I-flip ang value: kung true -> false, kung false -> true
    isHidingBagsak = !isHidingBagsak;

    // Optional: Usba ang label sa button para klaro
    const btnText = isHidingBagsak ? `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M240-40H120q-33 0-56.5-23.5T40-120v-120h80v120h120v80Zm480 0v-80h120v-120h80v120q0 33-23.5 56.5T840-40H720ZM480-220q-120 0-217.5-71T120-480q45-118 142.5-189T480-740q120 0 217.5 71T840-480q-45 118-142.5 189T480-220Zm0-80q88 0 161-48t112-132q-39-84-112-132t-161-48q-88 0-161 48T207-480q39 84 112 132t161 48Zm0-40q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Zm0-80q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420ZM40-720v-120q0-33 23.5-56.5T120-920h120v80H120v120H40Zm800 0v-120H720v-80h120q33 0 56.5 23.5T920-840v120h-80ZM480-480Z"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg>`;
    $(this).html(btnText);

    // I-run dayon ang function para mo-epekto ang toggle
    filterProducts();
});

// 3. AUTO-RUN - Matag 2 ka segundo para sa infinite scroll
// setInterval(filterProducts, 2000);

// I-run kausa inig load sa page
filterProducts();
// ====================================================================== [E] PAG HIGHLIGHT SA MGA WALA KA ABUT SA STANDAR



 







function batloadder(statments) {
    $("body").append(`<div class="batholder"><div class="batsak"><div class="bat"></div><div class="bat_laod"></div></div></div>`)
    if (!statments) {
       $(".batholder").attr("hidden",false)
    }else{
        $(".batholder").attr("hidden",true)
    }
}
function hasDP() {
  return /\/dp\/[A-Z0-9]+/.test(window.location.pathname);
}

 
// usage
if (hasDP()) {
  batloadder(false) 
 
} else {
  // console.log("Walay dp");
   batloadder(false) 
  setTimeout(() => {
      batloadder(true) 
      // I-run matag 2 ka segundo para ma-apil ang mga bag-ong load nga items
      setInterval(filterProducts, 2000);
  }, 500);
  }


 

$(document).ready(function () {
  $("body").append(`<div nightowlmenu>
    <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="currentColor"><path d="M480-80q-134 0-227-93t-93-227v-200q0-122 96-201t224-79q128 0 224 79t96 201v520H480Zm0-80h80q-19-25-29.5-55.5T520-280v-42q-10 1-20 1.5t-20 .5q-67 0-129.5-23.5T240-415v15q0 100 70 170t170 70Zm120-120q0 50 35 85t85 35v-255q-26 26-56 44.5T600-340v60ZM440-560q0-66-45-111t-109-48q-22 24-34 54t-12 65q0 89 72.5 144.5T480-400q95 0 167.5-55.5T720-600q0-35-12-65.5T674-720q-64 2-109 48t-45 112h-80Zm-128.5-11.5Q300-583 300-600t11.5-28.5Q323-640 340-640t28.5 11.5Q380-617 380-600t-11.5 28.5Q357-560 340-560t-28.5-11.5Zm280 0Q580-583 580-600t11.5-28.5Q603-640 620-640t28.5 11.5Q660-617 660-600t-11.5 28.5Q637-560 620-560t-28.5-11.5ZM370-778q34 14 62 37t48 52q20-29 47.5-52t61.5-37q-25-11-52.5-16.5T480-800q-29 0-56.5 5.5T370-778Zm430 618H520h280Zm-320 0q-100 0-170-70t-70-170q0 100 70 170t170 70h80-80Zm120-120q0 50 35 85t85 35q-50 0-85-35t-35-85ZM480-689Z"/></svg>
    

    <button product_trigger style="position:absolute; bottom:0px; right:-30px;"> <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M240-40H120q-33 0-56.5-23.5T40-120v-120h80v120h120v80Zm480 0v-80h120v-120h80v120q0 33-23.5 56.5T840-40H720ZM480-220q-120 0-217.5-71T120-480q45-118 142.5-189T480-740q120 0 217.5 71T840-480q-45 118-142.5 189T480-220Zm0-80q88 0 161-48t112-132q-39-84-112-132t-161-48q-88 0-161 48T207-480q39 84 112 132t161 48Zm0-40q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Zm0-80q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420ZM40-720v-120q0-33 23.5-56.5T120-920h120v80H120v120H40Zm800 0v-120H720v-80h120q33 0 56.5 23.5T920-840v120h-80ZM480-480Z"/></svg> </button>

    <div owl_esults> 
       ...
    </div>
    </div>


    <div pasars_bagsak>

        <div cardholoder_>  
            <aside aside_items bsrp otherinfos> 
                <div copy_headers> BSRP:</div>
                <div copy_items bsrp_value_bagsak>#${getBestSellersRank()}</div>
            </aside>

            <aside aside_items category otherinfos> 
                <div copy_headers> Category: </div>
                <div copy_items category_value_bagsak> ${getCategory()}</div>
            </aside>

            <aside aside_items months bagsak otherinfos> 
                <div copy_headers> Months: </div>
                <div copy_items months_value_bagsak>---</div>
            </aside>
        </div>

 
        <div cardholoder_>  
            <div style="color:red;" aside_items bagsak_view> <b> Fail</b> </div>

            <aside price bagsak aside_items>   
                <div copy_headers> Price: </div>
                <div copy_items price_value_bagsak> ${getPrice()["price"]}</div>
            </aside>

            <aside reviews bagsak aside_items> 
                <div copy_headers> Reviews: </div>
                <div copy_items reviews_value_bagsak> ${getReviewCount()}</div>
            </aside>

            <aside ratings bagsak aside_items> 
                <div copy_headers> Ratings: </div>
                <div copy_items ratings_value_bagsak> ${getRating()}</div>
            </aside>

            <aside revenue bagsak aside_items> 
                <div copy_headers> Revenue: </div>
                <div copy_items revenue_value_bagsak bagsak__>---</div>
            </aside>
        </div>

        <div cardholoder_>  
            <div style="color:Green;" aside_items pasar_view> <b> Pass</b> </div>

            <aside price pasar aside_items> 
                <div copy_headers> Price: </div>
                <div copy_items price_value_bagsak> ${getPrice()["price"]}</div>
            </aside>

            <aside reviews pasar aside_items> 
                <div copy_headers> Reviews: </div>
                <div copy_items reviews_value_bagsak> ${getReviewCount()}</div>
            </aside>

            <aside ratings pasar aside_items> 
                <div copy_headers> Ratings: </div>
                <div copy_items ratings_value_bagsak> ${getRating()}</div>
            </aside>

            <aside revenue pasar aside_items> 
                <div copy_headers> Revenue: </div>
                <div copy_items revenue_value_pasar pasar__> ---</div>
            </aside>
        </div>
    
    </div>
    
    `);
  $("body").append('<div menu_list>Meno</div>');

});

 




//  PAG IDENTIFY KUNG PASS OR FAIL ANG PRODUCT
function statusUpdate(...args) {
  // Check kung kompleto ang 4 inputs
  if (args.length !== 4) {
    return "<span style='color:red;'>Load Failed</span>";
  }

  // Validate kung 1 or 0 lang
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== 0 && args[i] !== 1) {
      return "<span style='color:red;'>Load Failed</span>";
    }
  }

  // Pangita zero positions
  const zeroPositions = args
    .map((v, i) => v === 0 ? i : -1)
    .filter(i => i !== -1);

  // Kung naa zero → Fail
  if (zeroPositions.length > 0) {
    return "<span style='color:red;'>Fail</span>";
  }

  // Puro 1 → Pass
  return "<span style='color:green;'>Pass</span>";
}




function observeElement() {
  const target = document.body;

  const observer = new MutationObserver(() => {
    const el = document.querySelector("#h10-product-score");

    if (el && el.innerText.trim() !== "") {
      // alert("Data displayed: " + el.innerText);
      observer.disconnect(); // stop observing

    
    setTimeout(() => {
      console.log("============================Hi10=============================")
      console.log(get30DayRevenue())
      $("[revenue_value_bagsak]").text(get30DayRevenue())
      $("[revenue_value_pasar]").text(get30DayRevenue())

      console.log(get30DayRevenueResult(get30DayRevenue()))
      $('[data-testid=showMoreButton]').click()
      setTimeout(() => {
        console.log(getProductAgeInMonths())
   
        batloadder(true) 
        
        setInterval(() => {
          $("[owl_esults]").html(`${statusUpdate(
              priceResult(getPrice()["price"])["StatusCon"],
              ReviewCountratingResult(getReviewCount())["StatusCon"],
              ratingResult(getRating())["StatusCon"],
              get30DayRevenueResult(get30DayRevenue())["StatusCon"]
            )}`)
                  $("[months_value_bagsak]").text(getProductAgeInMonths())
                  $("[revenue_value_bagsak]").text(get30DayRevenue())
                  $("[revenue_value_pasar]").text(get30DayRevenue())

                  if (get30DayRevenueResult(get30DayRevenue())["Status"] == "Pass") {
                      $("[revenue][pasar]").css({"display":"flex"})
                      $("[revenue][bagsak]").css({"display":"none"})
                  }else{
                      $("[revenue][bagsak]").css({"display":"flex"})
                      $("[revenue][pasar]").css({"display":"none"})

                  }
        }, 500);





        $("[bsrp]").css({"display":"flex"})
        $("[category]").css({"display":"flex"})
        $("[months]").css({"display":"flex"})

        if (priceResult(getPrice()["price"])["Status"] == "Pass") {
            $("[price][pasar]").css({"display":"flex"})
            $("[price][bagsak]").css({"display":"none"})
        }else{
            $("[price][bagsak]").css({"display":"flex"})
            $("[price][pasar]").css({"display":"none"})
        }

        if (ReviewCountratingResult(getReviewCount())["Status"] == "Pass") {
            $("[reviews][pasar]").css({"display":"flex"})
            $("[reviews][bagsak]").css({"display":"none"})

        }else{
            $("[reviews][bagsak]").css({"display":"flex"})
            $("[reviews][pasar]").css({"display":"none"})

        }

        if (ratingResult(getRating())["Status"] == "Pass") {
            $("[ratings][pasar]").css({"display":"flex"})
            $("[ratings][bagsak]").css({"display":"none"})
        }else{
            $("[ratings][bagsak]").css({"display":"flex"})
            $("[ratings][pasar]").css({"display":"none"})
        }

        if (get30DayRevenueResult(get30DayRevenue())["Status"] == "Pass") {
            $("[revenue][pasar]").css({"display":"flex"})
            $("[revenue][bagsak]").css({"display":"none"})
        }else{
            $("[revenue][bagsak]").css({"display":"flex"})
            $("[revenue][pasar]").css({"display":"none"})
        }



 
            /*
              Pass
              Fail
            */ 
            // console.log(
            //   statusUpdate(
            //   priceResult(getPrice()["price"])["StatusCon"],
            //   ReviewCountratingResult(getReviewCount())["StatusCon"],
            //   ratingResult(getRating())["StatusCon"],
            //   get30DayRevenueResult(get30DayRevenue())["StatusCon"]
            // )
            // )

      }, 2000);
      console.log("============================Hi10=============================")
    }, 3000);

    }
  });

  observer.observe(target, {
    childList: true,
    subtree: true
  });
}

// call function
observeElement();

 



