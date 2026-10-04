// Client script for Chintu's Gift & Kawaii Store - Category Pages
// Handles Category Banner, Subcategories filtering, 8-product pagination, and multi-photo galleries

const STORE_PHONE = "8269212182";
const STORE_DISPLAY_PHONE = "+91 82692 12182";
const STORE_WA = "918269212182";

let allCategories = typeof DEFAULT_CATEGORIES !== 'undefined' ? [...DEFAULT_CATEGORIES] : [];
let allProducts = typeof PRODUCTS_DATA !== 'undefined' ? [...PRODUCTS_DATA] : [];
let currentCategory = "stationery";
let currentSubcategory = "all";
let searchQuery = "";
let sortBy = "default";
let visibleProductsCount = 8;
let cart = [];

// Instant Fast Cache Initialization
(function initFastData() {
  try {
    // 1. Settings & Logo (Sanitize old logo.jpg)
    const cachedSettings = localStorage.getItem('chintu_store_settings');
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      if (parsed.storeLogo === 'assets/images/logo.jpg' || !parsed.storeLogo) {
        parsed.storeLogo = 'assets/images/kawaii_logo.jpg';
        try { localStorage.setItem('chintu_store_settings', JSON.stringify(parsed)); } catch (_) {}
      }
      applyPageSettings(parsed);
    }

    // 2. Categories
    const cachedCats = localStorage.getItem('chintu_categories');
    if (cachedCats) {
      const parsed = JSON.parse(cachedCats);
      if (Array.isArray(parsed) && parsed.length > 0) allCategories = parsed;
    }

    // 3. Products
    const cachedProds = localStorage.getItem('chintu_custom_products');
    if (cachedProds) {
      const parsed = JSON.parse(cachedProds);
      if (Array.isArray(parsed) && parsed.length > 0) allProducts = parsed;
    }
  } catch (_) {}
})();

document.addEventListener("DOMContentLoaded", () => {
  // Read URL query parameters (?cat=...&subcat=...&search=...)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  const searchParam = urlParams.get('search');
  const subcatParam = urlParams.get('subcat');

  if (catParam) {
    currentCategory = catParam;
  }
  if (searchParam) {
    searchQuery = searchParam.trim();
    const sInput = document.getElementById("category-search-input");
    if (sInput) sInput.value = searchQuery;
  }
  if (subcatParam) {
    currentSubcategory = subcatParam;
  }

  loadStoreSettings();
  loadCart();
  renderCategoryView();
  fetchFreshData();
  initVisitorTracker("Category: " + currentCategory);

  // Close QuickView on Outside Click or Escape
  const qm = document.getElementById("quickview-modal");
  if (qm) {
    qm.addEventListener("click", (e) => {
      if (e.target === qm) closeQuickView();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeQuickView();
  });
});

// Settings & Branding
function applyPageSettings(settings) {
  if (!settings) return;
  if (settings.theme) {
    document.body.classList.remove('theme-sakura-pink', 'theme-lavender-dream', 'theme-peach-coral', 'theme-cotton-candy', 'theme-matcha-mint');
    document.body.classList.add(settings.theme);
  }
  let targetLogo = settings.storeLogo || "assets/images/kawaii_logo.jpg";
  if (targetLogo === "assets/images/logo.jpg") {
    targetLogo = "assets/images/kawaii_logo.jpg";
  }
  document.querySelectorAll(".store-logo-img").forEach(el => {
    el.src = targetLogo;
    el.style.objectFit = 'contain';
  });
  const logoWrapper = document.getElementById("store-logo-wrapper");
  if (logoWrapper) {
    const shape = settings.logoShape || 'natural';
    const size = settings.logoHeight || 'md';
    logoWrapper.className = `store-logo-wrap logo-shape-${shape} logo-size-${size} shrink-0`;
  }
  if (settings.brandShort) {
    document.querySelectorAll(".store-brand-title").forEach(el => el.textContent = settings.brandShort);
  }
}

async function loadStoreSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.data) {
      applyPageSettings(data.data);
    }
  } catch (_) {}
}

async function fetchFreshData() {
  // 1. Fetch categories
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      allCategories = data.data;
      localStorage.setItem('chintu_categories', JSON.stringify(allCategories));
      renderCategoryView();
    }
  } catch (_) {}

  // 2. Fetch products
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      allProducts = data.data;
      localStorage.setItem('chintu_custom_products', JSON.stringify(allProducts));
      renderCategoryProducts();
    }
  } catch (_) {}
}

function getActiveCategoryObject() {
  const found = allCategories.find(c => c.id === currentCategory);
  if (found) return found;
  if (allCategories.length > 0) return allCategories[0];
  return {
    id: "stationery",
    name: "Fancy Stationery",
    hindiName: "फैंसी स्टेशनरी",
    icon: "✏️",
    tagline: "Pastel diaries, aesthetic highlighters & kawaii stickers",
    subcategories: ["Pastel Diaries & Locks", "Aesthetic Highlighters & Pens", "Washi Tapes & Stickers", "Pencil Pouches & Organizers"]
  };
}

// Render Category Banner, Breadcrumb, and Subcategory filter pills
function renderCategoryView() {
  const cat = getActiveCategoryObject();
  
  // Document title
  document.title = `${cat.name} (${cat.hindiName || ''}) | Chintu's Gift Store Dalli Rajhara`;

  // Breadcrumb
  const breadcrumbName = document.getElementById("cat-breadcrumb-name");
  if (breadcrumbName) breadcrumbName.textContent = cat.name;

  // Banner details
  const iconEl = document.getElementById("cat-banner-icon");
  if (iconEl) iconEl.textContent = cat.icon || "🎀";

  const titleEl = document.getElementById("cat-banner-title");
  if (titleEl) titleEl.textContent = cat.name;

  const hindiEl = document.getElementById("cat-banner-hindi");
  if (hindiEl) hindiEl.textContent = cat.hindiName || "";

  const taglineEl = document.getElementById("cat-banner-tagline");
  if (taglineEl) taglineEl.textContent = cat.tagline || `Browse our cutest collection of ${cat.name} in Dalli Rajhara!`;

  // Render Category Switcher dropdown/pills
  const switcher = document.getElementById("category-switcher-container");
  if (switcher) {
    switcher.innerHTML = allCategories.map(c => `
      <button onclick="switchCategory('${c.id}')" class="px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm border ${c.id === currentCategory ? 'bg-pink-600 text-white border-pink-600 ring-2 ring-pink-300' : 'bg-white/90 text-pink-900 border-pink-200 hover:bg-pink-100'}">
        <span>${c.icon || '🎁'}</span>
        <span>${c.name}</span>
      </button>
    `).join('');
  }

  // Render Subcategory filter chips
  renderSubcategoriesPills(cat);

  // Render Products
  renderCategoryProducts();
}

const SUBCAT_ICONS = {
  // Stationery
  "Pencils & Gel Pens": "✏️",
  "Cute Erasers & Sharpeners": "🧼",
  "Pastel Diaries & Locks": "📔",
  "Aesthetic Highlighters": "🖍️",
  "Pencil Pouches & Organizers": "👝",
  "Washi Tapes & Stickers": "🎀",
  // Cosmetics
  "Cute Lip Balms & Glosses": "💄",
  "Korean Velvet Tint Mud": "💋",
  "Pocket Mirrors & Brushes": "🪞",
  "Hand Creams & Skincare": "🌸",
  "Hair Accessories & Clips": "✨",
  "Makeup Vanity Pouches": "👛",
  // Toys
  "Giant Cuddle Teddies": "🧸",
  "Boba & Food Plushies": "🧋",
  "Kawaii Animal Plushies": "🐰",
  "Reversible Emotion Plushies": "🐙",
  "Plush Backpacks & Charms": "🎒",
  // Personalized
  "3D LED Acrylic Lamps": "💡",
  "Photo Magic Mugs": "☕",
  "Spotify Music Plaques": "🎵",
  "Photo Rotating Cube Lamps": "🪵",
  "Custom Name Keychains": "🔑",
  // Birthday
  "Birthday Gift Hampers": "🎁",
  "Surprise Explosion Boxes": "📦",
  "Celebration Baskets": "🧺",
  "Greeting Cards & Seals": "💌",
  "Birthday Party Props": "👑",
  // Novelties
  "Pastel Sippers & Bottles": "🥤",
  "Mini Crossbody Bags": "👜",
  "Silicone Night Lamps": "🐼",
  "Smart Desk Clocks": "⏰",
  "Mini Mist Humidifiers": "💨"
};

function renderSubcategoriesPills(cat) {
  const container = document.getElementById("subcategories-pill-container");
  if (!container) return;

  const subcats = Array.isArray(cat.subcategories) && cat.subcategories.length > 0 
    ? cat.subcategories 
    : ["All Items"];

  const allPills = ["all", ...subcats];

  container.innerHTML = allPills.map(sub => {
    const isAll = sub === "all";
    const isActive = currentSubcategory === sub;
    const icon = isAll ? "✨" : (SUBCAT_ICONS[sub] || "🎀");
    const count = allProducts.filter(p => p.category === cat.id && (isAll || p.subcategory === sub)).length;
    const label = isAll ? "All Items (सभी)" : sub;

    return `
      <button onclick="switchSubcategory('${sub}')" class="subcat-chip px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border shadow-sm flex items-center gap-1.5 cursor-pointer ${isActive ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-md scale-105 ring-2 ring-pink-300' : 'bg-white text-pink-900 border-pink-200/90 hover:bg-pink-50 hover:border-pink-300'}">
        <span>${icon}</span>
        <span>${label}</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700'}">${count}</span>
      </button>
    `;
  }).join('');
}

function switchCategory(catId) {
  currentCategory = catId;
  currentSubcategory = "all";
  visibleProductsCount = 8;
  const newUrl = `${window.location.pathname}?cat=${catId}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
  renderCategoryView();
}

function switchSubcategory(subcat) {
  currentSubcategory = subcat;
  visibleProductsCount = 8;
  renderCategoryView();
}

// Render Products Grid with 8 items pagination & "Show More"
function renderCategoryProducts() {
  const container = document.getElementById("category-products-grid");
  const loadMoreContainer = document.getElementById("category-load-more-container");
  const countBadge = document.getElementById("cat-products-count-badge");
  if (!container) return;

  // Filter by category
  let filtered = allProducts.filter(p => {
    const matchCat = currentCategory === "all" || p.category === currentCategory;
    const matchSubcat = currentSubcategory === "all" || p.subcategory === currentSubcategory;
    const matchSearch = !searchQuery || 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.hindiName && p.hindiName.includes(searchQuery)) ||
                        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSubcat && matchSearch;
  });

  // Sorting
  if (sortBy === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Cute Gifts`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-pink-700 bg-white/60 rounded-3xl border border-pink-200 p-8 shadow-sm">
        <div class="text-5xl mb-3 animate-bounce">🎀</div>
        <h4 class="text-lg font-black text-pink-900 mb-1 font-fun">No products found in this collection</h4>
        <p class="text-xs text-pink-700 mb-4">Try selecting "All" subcategory or searching another term.</p>
        <button onclick="switchSubcategory('all')" class="px-5 py-2 rounded-full kawaii-btn-pink text-xs font-black shadow-md">
          View All ${getActiveCategoryObject().name}
        </button>
      </div>
    `;
    if (loadMoreContainer) loadMoreContainer.innerHTML = "";
    return;
  }

  const displayed = filtered.slice(0, visibleProductsCount);

  container.innerHTML = displayed.map(product => {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    const hasMultipleImages = Array.isArray(product.images) && product.images.length > 1;
    const photoCount = hasMultipleImages ? product.images.length : 1;

    return `
      <div class="product-card group relative pink-acrylic p-3 sm:p-4 flex flex-col justify-between overflow-hidden border border-pink-200/90 shadow-sm hover:shadow-xl transition-all rounded-3xl bg-white/80">
        
        <!-- Top Badges -->
        <div class="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          ${product.badge ? `<span class="kawaii-badge">${product.badge}</span>` : ''}
          ${hasMultipleImages ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600/90 text-white shadow-sm flex items-center gap-1"><i class="fa-solid fa-camera text-[9px]"></i> ${photoCount} Photos</span>` : ''}
          ${product.customizable ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-600 text-white shadow-sm flex items-center gap-1"><i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i> Custom</span>` : ''}
        </div>

        <!-- Product Image -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-pink-50 cursor-pointer border border-pink-100" onclick="openQuickView('${product.id}')">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" decoding="async">
          <div class="absolute inset-0 bg-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-xs font-black text-pink-700 bg-white/95 px-3 py-1.5 rounded-full shadow-md backdrop-blur flex items-center gap-1.5">
              <i class="fa-solid fa-eye text-pink-500"></i> Quick View
            </span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="flex-1 flex flex-col">
          <!-- Rating & Stock -->
          <div class="flex items-center gap-1.5 mb-1">
            <div class="flex text-amber-400 text-xs">
              ${renderStars(product.rating || 5.0)}
            </div>
            <span class="text-[11px] text-pink-700 font-bold">(${product.reviewsCount || 15})</span>
            ${product.inStock ? '<span class="text-[10px] text-emerald-600 font-bold ml-auto">● In Stock</span>' : '<span class="text-[10px] text-rose-500 font-bold ml-auto">✕ Out of Stock</span>'}
          </div>

          <h3 class="text-xs sm:text-sm font-black text-purple-950 group-hover:text-pink-600 transition line-clamp-2 mb-1 cursor-pointer font-fun" onclick="openQuickView('${product.id}')">
            ${product.name}
          </h3>

          ${product.hindiName ? `<p class="text-[10px] font-bold text-pink-700 truncate mb-1">${product.hindiName}</p>` : ''}

          <p class="text-[11px] text-pink-900/70 line-clamp-2 mb-3 leading-relaxed">
            ${product.description || ''}
          </p>

          <!-- Price & Order Actions -->
          <div class="mt-auto pt-2.5 border-t border-pink-100">
            <div class="flex items-baseline gap-2 mb-2.5">
              <span class="text-lg sm:text-xl font-black text-pink-600 font-fun">₹${product.price}</span>
              <span class="text-xs text-slate-400 line-through">₹${product.originalPrice}</span>
              <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">${discount}% OFF</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button onclick="addToCart('${product.id}')" ${!product.inStock ? 'disabled' : ''} class="px-2 py-2 rounded-xl kawaii-btn-pink text-[11px] font-black flex items-center justify-center gap-1 shadow-sm">
                <i class="fa-solid fa-bag-shopping text-[10px]"></i> Add Cart
              </button>
              
              <button onclick="buyOnWhatsApp('${product.id}')" class="px-2 py-2 rounded-xl kawaii-btn-green text-[11px] font-black flex items-center justify-center gap-1 shadow-sm">
                <i class="fa-brands fa-whatsapp text-xs"></i> Order
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }).join("");

  // Update Show More / Load More button
  if (loadMoreContainer) {
    if (visibleProductsCount < filtered.length) {
      loadMoreContainer.innerHTML = `
        <button id="show-more-products-btn" onclick="loadMoreCategoryProducts()" class="px-8 py-3 rounded-full kawaii-btn-pink text-xs sm:text-sm font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border-2 border-pink-300 cursor-pointer">
          <i class="fa-solid fa-sparkles text-yellow-300"></i>
          <span>Show More Gifts (और देखें)</span>
          <span class="text-[10px] bg-white/30 text-pink-900 px-2 py-0.5 rounded-full font-black">Showing ${displayed.length} of ${filtered.length}</span>
          <i class="fa-solid fa-chevron-down text-xs animate-bounce"></i>
        </button>
      `;
    } else if (filtered.length > 8) {
      loadMoreContainer.innerHTML = `
        <div class="flex items-center gap-2 py-2.5 px-5 rounded-full bg-pink-100/90 text-pink-800 text-xs font-bold border border-pink-200 shadow-sm">
          <span>✨</span>
          <span>You've seen all <strong>${filtered.length}</strong> gifts in ${getActiveCategoryObject().name}! 🎀</span>
        </div>
      `;
    } else {
      loadMoreContainer.innerHTML = "";
    }
  }
}

function loadMoreCategoryProducts() {
  visibleProductsCount += 8;
  renderCategoryProducts();
}

function renderStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<i class="fa-solid fa-star"></i>';
    } else {
      stars += '<i class="fa-regular fa-star"></i>';
    }
  }
  return stars;
}

// Quick View Modal
function openQuickView(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("quickview-modal");
  const modalBody = document.getElementById("quickview-body");
  if (!modal || !modalBody) return;

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const allImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : [product.image || 'assets/images/kawaii_stationery.jpg'];

  modalBody.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <div class="aspect-square rounded-2xl overflow-hidden bg-pink-50 border border-pink-200 relative group">
          <img id="quickview-main-img" src="${allImages[0]}" alt="${product.name}" class="w-full h-full object-cover transition duration-300">
        </div>
        ${allImages.length > 1 ? `
          <div class="flex items-center gap-2 overflow-x-auto py-1 px-0.5">
            ${allImages.map((imgUrl, idx) => `
              <button type="button" onclick="selectQuickViewImage('${imgUrl}', this)" class="qv-thumb shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-pink-600 ring-2 ring-pink-400 scale-105' : 'border-pink-200 opacity-80 hover:opacity-100'}">
                <img src="${imgUrl}" alt="Thumb" class="w-full h-full object-cover">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
            ${product.badge ? `<span class="kawaii-badge">${product.badge}</span>` : ''}
            ${allImages.length > 1 ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200"><i class="fa-solid fa-camera mr-1"></i>${allImages.length} Photos</span>` : ''}
            <span class="text-xs text-emerald-700 font-extrabold"><i class="fa-solid fa-circle-check mr-1"></i>In Stock at Subhash Chowk</span>
          </div>
          <h2 class="text-base sm:text-lg font-black text-purple-950 mb-1 font-fun">${product.name}</h2>
          ${product.hindiName ? `<p class="text-xs font-bold text-pink-700 mb-2">${product.hindiName}</p>` : ''}
          <div class="flex items-center gap-2 mb-3">
            <div class="flex text-amber-400 text-xs">${renderStars(product.rating || 5.0)}</div>
            <span class="text-xs text-pink-700 font-bold">(${product.reviewsCount || 12} reviews)</span>
          </div>

          <div class="flex items-baseline gap-2 mb-3">
            <span class="text-2xl font-black text-pink-600 font-fun">₹${product.price}</span>
            <span class="text-xs text-slate-400 line-through">₹${product.originalPrice}</span>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">${discount}% OFF</span>
          </div>

          <p class="text-xs text-pink-900/80 mb-4 leading-relaxed">${product.description || ''}</p>
        </div>

        <div class="pt-3 border-t border-pink-200 flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="addToCart('${product.id}'); closeQuickView();" class="py-2.5 rounded-xl kawaii-btn-pink text-xs font-black flex items-center justify-center gap-1.5 shadow-md">
              <i class="fa-solid fa-bag-shopping"></i> Add to Cart
            </button>
            <button onclick="buyOnWhatsApp('${product.id}')" class="py-2.5 rounded-xl kawaii-btn-green text-xs font-black flex items-center justify-center gap-1.5 shadow-md">
              <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp Buy
            </button>
          </div>
          <button type="button" onclick="closeQuickView()" class="w-full py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-black transition flex items-center justify-center gap-1.5 border border-slate-300 hover:border-rose-300 shadow-sm cursor-pointer mt-1">
            <i class="fa-solid fa-xmark text-sm"></i> <span>Close Product View (बंद करें ✕)</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeQuickView() {
  const modal = document.getElementById("quickview-modal");
  if (modal) modal.classList.add("hidden");
}

function selectQuickViewImage(imgUrl, clickedBtn) {
  const mainImg = document.getElementById("quickview-main-img");
  if (mainImg) mainImg.src = imgUrl;
  document.querySelectorAll(".qv-thumb").forEach(b => {
    b.classList.remove("border-pink-600", "ring-2", "ring-pink-400", "scale-105");
    b.classList.add("border-pink-200", "opacity-80");
  });
  if (clickedBtn) {
    clickedBtn.classList.remove("border-pink-200", "opacity-80");
    clickedBtn.classList.add("border-pink-600", "ring-2", "ring-pink-400", "scale-105");
  }
}

// Shopping Cart & WhatsApp Flow
function loadCart() {
  const saved = localStorage.getItem("chintu_cart");
  if (saved) {
    try {
      cart = JSON.parse(saved);
      updateCartUI();
    } catch (_) {}
  }
}

function saveCart() {
  localStorage.setItem("chintu_cart", JSON.stringify(cart));
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added "${product.name.slice(0, 22)}..." to cart! 🛍️`);
}

function updateCartUI() {
  const countEl = document.getElementById("cart-count-badge");
  const drawer = document.getElementById("cart-items-container");
  const totalEl = document.getElementById("cart-subtotal");
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (countEl) countEl.textContent = totalCount;

  if (drawer) {
    if (cart.length === 0) {
      drawer.innerHTML = `
        <div class="py-12 text-center text-pink-700">
          <div class="text-4xl mb-2">🛍️</div>
          <p class="font-bold text-xs">Your kawaii bag is empty!</p>
        </div>
      `;
    } else {
      drawer.innerHTML = cart.map((item, idx) => `
        <div class="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-pink-200/80 shadow-sm">
          <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-xl object-cover border border-pink-100">
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-black text-pink-950 truncate">${item.name}</h4>
            <span class="text-xs font-black text-pink-600">₹${item.price}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="changeCartQty(${idx}, -1)" class="w-6 h-6 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold flex items-center justify-center text-xs">-</button>
            <span class="text-xs font-black text-pink-900 w-4 text-center">${item.qty}</span>
            <button onclick="changeCartQty(${idx}, 1)" class="w-6 h-6 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold flex items-center justify-center text-xs">+</button>
          </div>
        </div>
      `).join('');
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (totalEl) totalEl.textContent = `₹${subtotal}`;
}

function changeCartQty(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart();
  updateCartUI();
}

function toggleCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (drawer) drawer.classList.toggle("hidden");
}

function buyOnWhatsApp(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const text = `🌸 *Hello Chintu's Gift Shop (8269212182)*,\n` +
               `I want to order this item from ${getActiveCategoryObject().name}:\n` +
               `🎁 *${product.name}*\n` +
               `💰 Price: ₹${product.price}\n\n` +
               `Is this available for fast home delivery or pickup at Subhash Chowk, Dalli Rajhara?`;

  const url = `https://wa.me/${STORE_WA}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

function checkoutCartWhatsApp() {
  if (cart.length === 0) {
    showToast("Your cart is empty! Add gifts first 🎀", "error");
    return;
  }

  const itemsList = cart.map(i => `• ${i.name} (Qty: ${i.qty}) - ₹${i.price * i.qty}`).join('\n');
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const msg = `🌸 *New Order from Chintu's Gift Store*\n\n` +
              `*Items Ordered:*\n${itemsList}\n\n` +
              `💰 *Total Amount:* ₹${subtotal}\n\n` +
              `Please confirm availability & delivery details for Dalli Rajhara!`;

  window.open(`https://wa.me/${STORE_WA}?text=${encodeURIComponent(msg)}`, '_blank');
}

// Search and Sort Listeners
function setupCategoryListeners() {
  const searchInput = document.getElementById("category-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      visibleProductsCount = 8;
      renderCategoryProducts();
    });
  }

  const sortSelect = document.getElementById("category-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortBy = e.target.value;
      visibleProductsCount = 8;
      renderCategoryProducts();
    });
  }
}

document.addEventListener("DOMContentLoaded", setupCategoryListeners);

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-msg ${type === 'error' ? 'border-l-4 border-rose-500' : 'border-l-4 border-pink-500'}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation text-rose-500' : 'fa-circle-check text-pink-500'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Real-Time Visitor Tracking for Push Notifications & Admin Radar
function initVisitorTracker(pageName) {
  try {
    const isNewSession = !sessionStorage.getItem('chintu_visited_session');
    if (isNewSession) {
      sessionStorage.setItem('chintu_visited_session', 'visit_' + Date.now());
    }

    const ua = navigator.userAgent || '';
    let device = 'Desktop PC';
    if (/android/i.test(ua)) device = 'Android Phone';
    else if (/iphone/i.test(ua)) device = 'Apple iPhone';
    else if (/ipad/i.test(ua)) device = 'Apple iPad';
    else if (/tablet/i.test(ua)) device = 'Tablet Device';
    else if (/mobile/i.test(ua)) device = 'Mobile Phone';

    let referrer = document.referrer ? document.referrer : 'Direct / WhatsApp / Social';
    try {
      if (document.referrer && document.referrer.includes(window.location.host)) {
        referrer = 'Internal Store Browsing';
      }
    } catch (_) {}

    const payload = {
      page: pageName || document.title || 'Category Storefront',
      path: window.location.pathname + window.location.search,
      referrer: referrer,
      device: device,
      isNewSession: isNewSession
    };

    fetch('/api/track-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch (_) {}
}

