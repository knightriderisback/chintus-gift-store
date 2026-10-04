// Client script for Chintu's Gift & Kawaii Store - Category Pages
// Handles Category Banner, Subcategories filtering, 8-product pagination, multi-photo galleries, and WhatsApp Inquiries (No Price, No Stock Mode)

const STORE_PHONE = "8269212182";
const STORE_DISPLAY_PHONE = "+91 82692 12182";
const STORE_WA = "918269212182";

let allCategories = typeof DEFAULT_CATEGORIES !== 'undefined' ? [...DEFAULT_CATEGORIES] : [];
let allProducts = typeof PRODUCTS_DATA !== 'undefined' ? [...PRODUCTS_DATA] : [];
let currentCategory = "cosmetics";
let currentSubcategory = "all";
let searchQuery = "";
let sortBy = "default";
let visibleProductsCount = 8;
let cart = [];
let quickViewImages = [];
let quickViewCurrentIndex = 0;

const CANONICAL_MASCOT_LOGO = "assets/images/chintus_official_logo.png?v=11.0";

function resolveSafeLogo(logo) {
  if (!logo || typeof logo !== 'string') return CANONICAL_MASCOT_LOGO;
  const l = logo.trim();
  if (l.startsWith('data:image/') || l.startsWith('/uploads/')) {
    return l;
  }
  return CANONICAL_MASCOT_LOGO;
}

// Fallback images when Google Drive links are not public yet or on network error
function getProductFallbackImage(cat) {
  if (cat === 'cosmetics') return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=75';
  if (cat === 'stationery') return 'assets/images/kawaii_stationery.jpg';
  if (cat === 'skincare') return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=75';
  if (cat === 'lifestyle') return 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=75';
  return CANONICAL_MASCOT_LOGO;
}

window.handleProductImgError = function(img, cat) {
  img.onerror = null;
  img.src = getProductFallbackImage(cat);
};

// Instant Fast Cache Initialization
(function initFastData() {
  try {
    // 1. Settings & Logo (Sanitize any old logo)
    const cachedSettings = localStorage.getItem('chintu_store_settings');
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      parsed.storeLogo = resolveSafeLogo(parsed.storeLogo);
      try { localStorage.setItem('chintu_store_settings', JSON.stringify(parsed)); } catch (_) {}
      applyPageSettings(parsed);
    }

    // 2. Categories (Upgrade if old dummy cache exists & filter out references)
    const cachedCats = localStorage.getItem('chintu_categories');
    if (cachedCats) {
      const parsed = JSON.parse(cachedCats);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(c => c.id === 'cosmetics')) {
        allCategories = parsed.filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
        try { localStorage.setItem('chintu_categories', JSON.stringify(allCategories)); } catch (_) {}
      } else if (typeof DEFAULT_CATEGORIES !== 'undefined' && Array.isArray(DEFAULT_CATEGORIES)) {
        allCategories = [...DEFAULT_CATEGORIES].filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
        try { localStorage.setItem('chintu_categories', JSON.stringify(allCategories)); } catch (_) {}
      }
    } else if (typeof DEFAULT_CATEGORIES !== 'undefined' && Array.isArray(DEFAULT_CATEGORIES)) {
      allCategories = [...DEFAULT_CATEGORIES].filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
    }

    // 3. Products (Upgrade if old dummy cache exists & filter out reference items)
    const cachedProds = localStorage.getItem('chintu_custom_products');
    if (cachedProds) {
      const parsed = JSON.parse(cachedProds);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(p => p.sku && p.sku.startsWith('COSM'))) {
        allProducts = parsed.filter(p => p.category !== 'references' && !String(p.id).startsWith('ref-'));
        try { localStorage.setItem('chintu_custom_products', JSON.stringify(allProducts)); } catch (_) {}
      } else if (typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
        allProducts = [...PRODUCTS_DATA].filter(p => p.category !== 'references' && !String(p.id).startsWith('ref-'));
        try { localStorage.setItem('chintu_custom_products', JSON.stringify(allProducts)); } catch (_) {}
      }
    } else if (typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
      allProducts = [...PRODUCTS_DATA].filter(p => p.category !== 'references' && !String(p.id).startsWith('ref-'));
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
  if (currentCategory === 'references' || currentCategory === 'shades-lookbook') {
    currentCategory = 'cosmetics';
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
  setupCategoryListeners();
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
  let targetLogo = resolveSafeLogo(settings.storeLogo);
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
      data.data.storeLogo = resolveSafeLogo(data.data.storeLogo);
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
      const cleanCats = data.data.filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
      const hasChanged = JSON.stringify(cleanCats) !== JSON.stringify(allCategories);
      allCategories = cleanCats;
      localStorage.setItem('chintu_categories', JSON.stringify(allCategories));
      if (hasChanged) renderCategoryView();
    }
  } catch (_) {}

  // 2. Fetch products
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const cleanProds = data.data.filter(p => p.category !== 'references' && !String(p.id).startsWith('ref-'));
      const hasChanged = JSON.stringify(cleanProds) !== JSON.stringify(allProducts);
      allProducts = cleanProds;
      localStorage.setItem('chintu_custom_products', JSON.stringify(allProducts));
      if (hasChanged) renderCategoryProducts();
    }
  } catch (_) {}
}

function getActiveCategoryObject() {
  const found = allCategories.find(c => c.id === currentCategory);
  if (found) return found;
  if (allCategories.length > 0) return allCategories[0];
  return {
    id: "cosmetics",
    name: "Beauty & Cosmetics",
    hindiName: "कॉस्मेटिक्स व ब्यूटी प्रोडक्ट्स",
    icon: "💄",
    tagline: "High coverage liquid foundations, ultra-matte lipsticks, moisturizing glosses & beauty essentials",
    subcategories: ["Lipsticks", "Foundations & Face Base", "Lip Glosses", "Lip Products", "Lip Glosses & Balms", "Lip Care & Treatments", "Lip Liners", "Nail Art & Press-ons", "Eye & Face Palettes", "Single Eye Shadows"]
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
  if (taglineEl) taglineEl.textContent = cat.tagline || `Browse our exclusive collection of ${cat.name} in Dalli Rajhara!`;

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

  // Render Subcategory Visual Explorer Cards
  renderSubcategoriesCards(cat);

  // Render Products
  renderCategoryProducts();
}

const SUBCAT_ICONS = {
  // Beauty & Cosmetics
  "Lipsticks": "💄",
  "Foundations & Face Base": "✨",
  "Lip Glosses": "💋",
  "Lip Products": "🫦",
  "Lip Glosses & Balms": "🌸",
  "Lip Care & Treatments": "🧴",
  "Lip Liners": "✏️",
  "Nail Art & Press-ons": "💅",
  "Eye & Face Palettes": "🎨",
  "Single Eye Shadows": "👁️",
  // Stationery & School Supplies
  "Rulers & Geometry": "📐",
  "Pencil Cases & Pouches": "👝",
  "Pencil Sharpeners": "✏️",
  "Erasers & Novelty": "🧼",
  "Pens & Highlighters": "🖊️",
  // Skincare & Personal Care
  "Face Packs & Masks": "🧖‍♀️",
  "Face & Body Scrubs": "🫧",
  "Face Wash & Cleansers": "🧴",
  "Moisturizers & Creams": "💧",
  // Kids & Lifestyle
  "Water Bottles & Sippers": "🥤",
  // Marketing & Reference
  "Color Matrix Chart": "📊",
  "Color Swatch Chart": "🎨",
  "Model Look Reference": "📸"
};

const SUBCAT_HINDI = {
  // Stationery & School Supplies
  "Erasers & Novelty": "इरेज़र्स व क्यूट रबर",
  "Pencil Sharpeners": "पेंसिल शार्पनर्स",
  "Pencil Cases & Pouches": "पेंसिल बॉक्स व पाउच",
  "Rulers & Geometry": "स्केल व ज्योमेट्री सेट",
  "Pens & Highlighters": "पेन व हाइलाइटर्स",
  // Beauty & Cosmetics
  "Lipsticks": "लिपस्टिक्स व लिप शेड्स",
  "Foundations & Face Base": "फाउंडेशन व बेस",
  "Lip Glosses": "लिप ग्लॉस",
  "Lip Products": "लिप केयर",
  "Lip Glosses & Balms": "लिप ग्लॉस व बाम",
  "Lip Care & Treatments": "लिप ट्रीटमेंट",
  "Lip Liners": "लिप लाइनर",
  "Nail Art & Press-ons": "नेल आर्ट व नेल्स",
  "Eye & Face Palettes": "आई व फेस पैलेट",
  "Single Eye Shadows": "आई शैडो",
  // Skincare & Personal Care
  "Face Packs & Masks": "फेस मास्क व पैक",
  "Face & Body Scrubs": "बॉडी व फेस स्क्रब",
  "Face Wash & Cleansers": "फेस वॉश व क्लींजर",
  "Moisturizers & Creams": "मॉइस्चराइज़र व क्रीम",
  // Kids & Lifestyle
  "Water Bottles & Sippers": "सिपर व वाटर बॉटल"
};

function renderSubcategoriesCards(cat) {
  const container = document.getElementById("subcategories-cards-grid");
  if (!container) return;

  const subcats = Array.isArray(cat.subcategories) && cat.subcategories.length > 0 
    ? cat.subcategories 
    : [];

  const cardsHtml = subcats.map(sub => {
    const isActive = currentSubcategory === sub;
    const icon = SUBCAT_ICONS[sub] || "🎀";
    const hindi = SUBCAT_HINDI[sub] || "";
    const count = allProducts.filter(p => p.category === cat.id && p.subcategory === sub).length;

    return `
      <div onclick="filterBySubcategory('${sub.replace(/'/g, "\\'")}')" class="subcat-card group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 ${isActive ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-md ring-2 ring-pink-400 scale-[1.02]' : 'bg-white hover:bg-pink-50 text-pink-950 border-pink-200/90 shadow-2xs hover:shadow-md hover:border-pink-300'}">
        <div class="min-w-0">
          <div class="flex items-center justify-between mb-2 gap-1.5">
            <span class="w-8 h-8 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-600'} flex items-center justify-center text-base shadow-2xs group-hover:scale-110 transition-transform shrink-0">
              ${icon}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-pink-600' : 'bg-pink-100 text-pink-700'} shrink-0 whitespace-nowrap">
              ${count} items
            </span>
          </div>
          <h3 class="text-xs sm:text-sm font-black ${isActive ? 'text-white' : 'text-purple-950'} font-fun truncate leading-tight mb-0.5">
            ${sub}
          </h3>
          ${hindi ? `<div class="text-[10px] font-bold ${isActive ? 'text-pink-100' : 'text-pink-600'} truncate">${hindi}</div>` : ''}
        </div>
        <div class="mt-2.5 pt-2 border-t ${isActive ? 'border-white/20 text-white' : 'border-pink-100 text-pink-600'} flex items-center justify-between text-[10px] font-extrabold min-w-0">
          <span class="truncate">${isActive ? 'Selected ✓' : 'View Products'}</span>
          <i class="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform shrink-0 ml-1"></i>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cardsHtml;
  updateActiveFilterIndicator();
}

function filterBySubcategory(subcat) {
  currentSubcategory = subcat;
  visibleProductsCount = 8;
  renderSubcategoriesCards(getActiveCategoryObject());
  renderCategoryProducts();
  updateActiveFilterIndicator();

  // Update browser URL query without reload
  const url = new URL(window.location.href);
  if (subcat === 'all') {
    url.searchParams.delete('subcat');
  } else {
    url.searchParams.set('subcat', subcat);
  }
  window.history.replaceState({}, '', url.toString());

  // Smooth scroll to products section
  const grid = document.getElementById("category-products-grid");
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateActiveFilterIndicator() {
  const bar = document.getElementById("active-filter-indicator");
  const label = document.getElementById("active-filter-label");
  const countBadge = document.getElementById("active-filter-count-badge");
  if (!bar) return;

  if (currentSubcategory === 'all') {
    bar.classList.add("hidden");
  } else {
    bar.classList.remove("hidden");
    if (label) label.textContent = currentSubcategory;
    const cat = getActiveCategoryObject();
    const count = allProducts.filter(p => p.category === cat.id && p.subcategory === currentSubcategory).length;
    if (countBadge) countBadge.textContent = `${count} products`;
  }
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
  filterBySubcategory(subcat);
}

// Render Products Grid with 8 items pagination & "Show More" (NO PRICE, NO STOCK MODE)
function renderCategoryProducts() {
  const container = document.getElementById("category-products-grid");
  const loadMoreContainer = document.getElementById("category-load-more-container");
  const countBadge = document.getElementById("cat-products-count-badge");
  if (!container) return;

  // Filter by category, subcategory, search
  let filtered = allProducts.filter(p => {
    const matchCat = currentCategory === "all" || p.category === currentCategory;
    const matchSubcat = currentSubcategory === "all" || p.subcategory === currentSubcategory;
    const matchSearch = !searchQuery || 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSubcat && matchSearch;
  });

  // Sorting (No price sorting)
  if (sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "brand") {
    filtered.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Items`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-pink-700 bg-white/60 rounded-3xl border border-pink-200 p-8 shadow-sm">
        <div class="text-5xl mb-3 animate-bounce">🎀</div>
        <h4 class="text-lg font-black text-pink-900 mb-1 font-fun">No products found in this selection</h4>
        <p class="text-xs text-pink-700 mb-4">Try selecting "All Items" subcategory or searching another term.</p>
        <button onclick="switchSubcategory('all')" class="px-5 py-2 rounded-full kawaii-btn-pink text-xs font-black shadow-md">
          View All ${getActiveCategoryObject().name}
        </button>
      </div>
    `;
    if (loadMoreContainer) loadMoreContainer.innerHTML = "";
    return;
  }

  const displayed = filtered.slice(0, visibleProductsCount);

  container.innerHTML = displayed.map((product, pIndex) => {
    const hasMultipleImages = Array.isArray(product.images) && product.images.length > 1;
    const photoCount = hasMultipleImages ? product.images.length : 1;
    const primaryImg = (Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : (product.image || getProductFallbackImage(product.category));

    return `
      <div class="product-card group relative pink-acrylic p-3 sm:p-4 flex flex-col justify-between overflow-hidden border border-pink-200/90 shadow-sm hover:shadow-xl transition-all rounded-3xl bg-white/85">
        
        <!-- Top Badges -->
        <div class="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          ${product.brand ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-600 text-white shadow-sm">${product.brand}</span>` : ''}
          ${hasMultipleImages ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-700/90 text-white shadow-sm flex items-center gap-1"><i class="fa-solid fa-camera text-[8px]"></i> ${photoCount} Photos</span>` : ''}
        </div>

        <!-- SKU Tag Top Right -->
        <div class="absolute top-3 right-3 z-10">
          <span class="px-2 py-0.5 rounded-md text-[9px] font-mono font-black bg-white/95 text-pink-800 border border-pink-200 shadow-sm">
            ${product.sku || product.id}
          </span>
        </div>

        <!-- Product Image -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-pink-50 cursor-pointer border border-pink-100" onclick="openQuickView('${product.id}')">
          <img src="${primaryImg}" alt="${product.name}" onerror="handleProductImgError(this, '${product.category}')" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" loading="${pIndex < 2 ? 'eager' : 'lazy'}" decoding="async">
          <div class="absolute inset-0 bg-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-xs font-black text-pink-700 bg-white/95 px-3 py-1.5 rounded-full shadow-md backdrop-blur flex items-center gap-1.5">
              <i class="fa-solid fa-eye text-pink-500"></i> View Details
            </span>
          </div>
        </div>

        <!-- Product Details (No Numeric Price, Rupee + WhatsApp Rate Mode) -->
        <div class="flex-1 flex flex-col min-w-0">
          <!-- Subcategory Tag -->
          <div class="flex items-center gap-1.5 mb-1.5 min-w-0">
            <span class="text-[10px] font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100 truncate max-w-full">
              ${product.subcategory || getActiveCategoryObject().name}
            </span>
          </div>

          <h3 class="text-xs sm:text-sm font-black text-purple-950 group-hover:text-pink-600 transition line-clamp-2 mb-1.5 cursor-pointer font-fun leading-snug break-words" onclick="openQuickView('${product.id}')">
            ${product.name}
          </h3>

          <p class="text-[11px] text-pink-900/70 line-clamp-2 mb-2.5 leading-relaxed break-words">
            ${product.description || ''}
          </p>

          <!-- Price/Rate Slot: Rupee Symbol + WhatsApp Logo ONLY -->
          <div class="mb-2.5 flex items-center justify-between gap-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition cursor-pointer shadow-2xs hover:scale-105 active:scale-95" onclick="inquireOnWhatsApp('${product.id}')" title="Ask Rate on WhatsApp">
              <span class="text-xl font-black text-pink-600 font-fun leading-none shrink-0">₹</span>
              <i class="fa-brands fa-whatsapp text-emerald-600 text-xl shrink-0"></i>
            </div>
            <span class="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100 shrink-0">
              Inquiry
            </span>
          </div>

          <!-- WhatsApp Inquiry & Add to Inquiry Bag Actions -->
          <div class="mt-auto pt-2 border-t border-pink-100">
            <div class="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button onclick="addToCart('${product.id}')" class="px-2 py-2 rounded-xl kawaii-btn-pink text-[11px] font-black flex items-center justify-center gap-1 shadow-sm transition hover:scale-102 active:scale-98 min-w-0" title="Add to Inquiry Bag">
                <i class="fa-solid fa-plus text-[10px] shrink-0"></i>
                <span class="truncate">Add to Bag</span>
              </button>
              
              <button onclick="inquireOnWhatsApp('${product.id}')" class="px-2 py-2 rounded-xl kawaii-btn-green text-[11px] font-black flex items-center justify-center gap-1 shadow-sm transition hover:scale-102 active:scale-98 min-w-0" title="Inquire on WhatsApp">
                <i class="fa-brands fa-whatsapp text-xs shrink-0"></i>
                <span class="truncate">WhatsApp</span>
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
          <span>Show More Items (और देखें)</span>
          <span class="text-[10px] bg-white/30 text-pink-900 px-2 py-0.5 rounded-full font-black">Showing ${displayed.length} of ${filtered.length}</span>
          <i class="fa-solid fa-chevron-down text-xs animate-bounce"></i>
        </button>
      `;
    } else if (filtered.length > 8) {
      loadMoreContainer.innerHTML = `
        <div class="flex items-center gap-2 py-2.5 px-5 rounded-full bg-pink-100/90 text-pink-800 text-xs font-bold border border-pink-200 shadow-sm">
          <span>✨</span>
          <span>You've explored all <strong>${filtered.length}</strong> items in ${getActiveCategoryObject().name}! 🎀</span>
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

// Quick View Modal with Multi-Photo Gallery (NO PRICE, NO STOCK MODE)
function openQuickView(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("quickview-modal");
  const modalBody = document.getElementById("quickview-body");
  if (!modal || !modalBody) return;

  quickViewImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : [product.image || getProductFallbackImage(product.category)];
  quickViewCurrentIndex = 0;

  modalBody.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      <!-- Multi-Photo Gallery -->
      <div class="flex flex-col gap-2.5">
        <div class="aspect-square rounded-2xl overflow-hidden bg-pink-50 border border-pink-200 relative group">
          <img id="quickview-main-img" src="${quickViewImages[0]}" alt="${product.name}" onerror="handleProductImgError(this, '${product.category}')" class="w-full h-full object-cover transition duration-300">
          
          ${quickViewImages.length > 1 ? `
            <button onclick="prevQuickViewImage('${product.category}')" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-pink-700 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer">
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button onclick="nextQuickViewImage('${product.category}')" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-pink-700 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer">
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
            <span id="quickview-counter-badge" class="absolute bottom-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-950/70 text-white backdrop-blur">
              1 / ${quickViewImages.length} Photos
            </span>
          ` : ''}
        </div>

        ${quickViewImages.length > 1 ? `
          <div class="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
            ${quickViewImages.map((imgUrl, idx) => `
              <button type="button" onclick="selectQuickViewImageByIndex(${idx}, '${product.category}')" class="qv-thumb shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${idx === 0 ? 'border-pink-600 ring-2 ring-pink-400 scale-105' : 'border-pink-200 opacity-80 hover:opacity-100'}">
                <img src="${imgUrl}" alt="Photo ${idx + 1}" onerror="handleProductImgError(this, '${product.category}')" class="w-full h-full object-cover">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Details (No Price, No Stock Mode) -->
      <div class="flex flex-col justify-between">
        <div>
          <!-- Badges & SKU -->
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            ${product.brand ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-pink-600 text-white shadow-sm">${product.brand}</span>` : ''}
            <span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-black bg-purple-100 text-purple-800 border border-purple-200">
              SKU: ${product.sku || product.id}
            </span>
            <span class="text-xs text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full font-bold">
              ${product.subcategory || ''}
            </span>
          </div>

          <h2 class="text-base sm:text-lg font-black text-purple-950 mb-1.5 font-fun">${product.name}</h2>
          
          <div class="flex items-center gap-2 mb-3">
            <div class="flex text-amber-400 text-xs">${renderStars(product.rating || 4.9)}</div>
            <span class="text-xs text-pink-700 font-bold">(${product.reviewsCount || 15} Customer inquiries)</span>
          </div>

          <!-- Description -->
          <div class="bg-pink-50/70 p-3 rounded-2xl border border-pink-100 mb-3">
            <h4 class="text-[11px] font-black text-pink-900 uppercase tracking-wide mb-1">Product Description</h4>
            <p class="text-xs text-pink-950/80 leading-relaxed">${product.description || 'Premium quality product available at Chintu\'s Gift Store, Subhash Chowk, Dalli Rajhara.'}</p>
          </div>

          <!-- Product Specifications -->
          <div class="space-y-1 mb-4 text-[11px] text-pink-900">
            <div class="flex items-center gap-2"><span class="font-bold text-pink-600">Brand:</span> <span>${product.brand || 'Chintu\'s Boutique'}</span></div>
            <div class="flex items-center gap-2"><span class="font-bold text-pink-600">Category:</span> <span>${product.categoryName || getActiveCategoryObject().name}</span></div>
            <div class="flex items-center gap-2"><span class="font-bold text-pink-600">Subcategory:</span> <span>${product.subcategory || '-'}</span></div>
            <div class="flex items-center gap-2"><span class="font-bold text-pink-600">Location:</span> <span>Subhash Chowk, Dalli Rajhara</span></div>
          </div>
        <!-- Product Rate Indicator in Modal with prominent ₹ and WhatsApp Logo -->
        <div class="mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between shadow-2xs gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="h-10 px-3 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center gap-1.5 shrink-0 shadow-xs">
              <span class="text-xl font-black text-pink-600 font-fun leading-none">₹</span>
              <i class="fa-brands fa-whatsapp text-emerald-600 text-xl"></i>
            </div>
            <div class="min-w-0">
              <span class="text-[10px] uppercase font-black tracking-wider text-emerald-700 block">Rate & Availability</span>
              <span class="text-xs sm:text-sm font-black text-purple-950 font-fun truncate block">Inquire via WhatsApp</span>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-xs shrink-0 whitespace-nowrap">Ask Rate</span>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 border-t border-pink-200 flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="addToCart('${product.id}'); closeQuickView();" class="py-2.5 rounded-xl kawaii-btn-pink text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition hover:scale-102 active:scale-98 cursor-pointer min-w-0">
              <i class="fa-solid fa-plus shrink-0"></i>
              <span class="truncate">Add to Bag</span>
            </button>
            <button onclick="inquireOnWhatsApp('${product.id}')" class="py-2.5 rounded-xl kawaii-btn-green text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition hover:scale-102 active:scale-98 cursor-pointer min-w-0">
              <i class="fa-brands fa-whatsapp text-sm shrink-0"></i>
              <span class="truncate">Inquire WhatsApp</span>
            </button>
          </div>
          <button type="button" onclick="closeQuickView()" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-black transition flex items-center justify-center gap-1.5 border border-slate-300 hover:border-rose-300 shadow-sm cursor-pointer mt-1">
            <i class="fa-solid fa-xmark text-sm shrink-0"></i>
            <span class="truncate">Close Product View (बंद करें ✕)</span>
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

function selectQuickViewImageByIndex(idx, cat) {
  if (idx < 0 || idx >= quickViewImages.length) return;
  quickViewCurrentIndex = idx;
  const mainImg = document.getElementById("quickview-main-img");
  if (mainImg) {
    mainImg.src = quickViewImages[idx];
    mainImg.onerror = function() { handleProductImgError(this, cat); };
  }
  const badge = document.getElementById("quickview-counter-badge");
  if (badge) {
    badge.textContent = `${idx + 1} / ${quickViewImages.length} Photos`;
  }
  document.querySelectorAll(".qv-thumb").forEach((b, i) => {
    if (i === idx) {
      b.classList.remove("border-pink-200", "opacity-80");
      b.classList.add("border-pink-600", "ring-2", "ring-pink-400", "scale-105");
    } else {
      b.classList.remove("border-pink-600", "ring-2", "ring-pink-400", "scale-105");
      b.classList.add("border-pink-200", "opacity-80");
    }
  });
}

function prevQuickViewImage(cat) {
  const nextIdx = (quickViewCurrentIndex - 1 + quickViewImages.length) % quickViewImages.length;
  selectQuickViewImageByIndex(nextIdx, cat);
}

function nextQuickViewImage(cat) {
  const nextIdx = (quickViewCurrentIndex + 1) % quickViewImages.length;
  selectQuickViewImageByIndex(nextIdx, cat);
}

// Single Product Direct WhatsApp Inquiry
function inquireOnWhatsApp(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const catObj = getActiveCategoryObject();
  const text = `🌸 *Namaste Chintu's Gift Store (8269212182)*,\n\n` +
               `I would like to inquire about this product from your catalogue:\n` +
               `📦 *Product:* ${product.name}\n` +
               `🏷️ *SKU:* ${product.sku || product.id}\n` +
               `📁 *Category:* ${product.categoryName || catObj.name} > ${product.subcategory || ''}\n` +
               (product.brand ? `🏢 *Brand:* ${product.brand}\n` : '') +
               `\nPlease share the price, availability, and ordering details! Thank you! 🎀`;

  const url = `https://wa.me/${STORE_WA}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// Inquiry Bag (Cart) Management (No Price Mode)
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
      sku: product.sku || product.id,
      name: product.name,
      brand: product.brand || '',
      category: product.category,
      categoryName: product.categoryName || '',
      subcategory: product.subcategory || '',
      image: (Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : (product.image || getProductFallbackImage(product.category)),
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added to Inquiry Bag! 🛍️`);
}

function updateCartUI() {
  const countBadge = document.getElementById("cart-count-badge");
  const drawer = document.getElementById("cart-items-container");
  const totalCountEl = document.getElementById("cart-total-count");
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (countBadge) countBadge.textContent = totalCount;
  if (totalCountEl) totalCountEl.textContent = `${totalCount} items`;

  if (drawer) {
    if (cart.length === 0) {
      drawer.innerHTML = `
        <div class="py-12 text-center text-pink-700">
          <div class="text-4xl mb-2">🛍️</div>
          <p class="font-bold text-xs">Your inquiry bag is empty!</p>
          <p class="text-[11px] text-pink-600/80 mt-1">Explore categories and add items to inquire on WhatsApp.</p>
        </div>
      `;
    } else {
      drawer.innerHTML = cart.map((item, idx) => `
        <div class="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-pink-200/80 shadow-sm">
          <img src="${item.image}" alt="${item.name}" onerror="handleProductImgError(this, '${item.category}')" class="w-12 h-12 rounded-xl object-cover border border-pink-100">
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-black text-purple-950 truncate">${item.name}</h4>
            <div class="flex items-center gap-2 text-[10px] text-pink-600 font-bold">
              <span>SKU: ${item.sku || item.id}</span>
              ${item.brand ? `<span>• ${item.brand}</span>` : ''}
            </div>
            <div class="flex items-center gap-2 mt-1">
              <button onclick="changeCartQty(${idx}, -1)" class="w-5 h-5 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-700 flex items-center justify-center text-xs font-bold">-</button>
              <span class="text-xs font-bold text-pink-900">${item.qty}</span>
              <button onclick="changeCartQty(${idx}, 1)" class="w-5 h-5 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-700 flex items-center justify-center text-xs font-bold">+</button>
            </div>
          </div>
          <button onclick="removeCartItem(${idx})" class="text-rose-400 hover:text-rose-600 p-1.5" title="Remove">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      `).join('');
    }
  }
}

function changeCartQty(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }
  saveCart();
  updateCartUI();
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartUI();
}

function toggleCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (drawer) {
    drawer.classList.toggle("hidden");
    if (!drawer.classList.contains("hidden")) {
      updateCartUI();
    }
  }
}

// Bulk Inquiry on WhatsApp for all selected items
function checkoutCartWhatsApp() {
  if (cart.length === 0) {
    showToast("Your inquiry bag is empty! Add items first 🎀", "error");
    return;
  }

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const itemsList = cart.map((i, idx) => `${idx + 1}. *${i.name}* (SKU: ${i.sku || i.id}) - Qty: ${i.qty}`).join('\n');

  const msg = `🌸 *New Catalogue Inquiry from Chintu's Gift Store*\n\n` +
              `*Selected Items for Inquiry:*\n${itemsList}\n\n` +
              `📦 *Total Items:* ${totalCount} items selected\n\n` +
              `Please share the price, availability, and delivery details for Dalli Rajhara. Thank you! 🎀`;

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
