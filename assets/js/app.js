// Core Client Script for Chintu's Gift & Kawaii Store - Dalli Rajhara

const STORE_PHONE = "8269212182";
const STORE_DISPLAY_PHONE = "+91 82692 12182";
const STORE_WA = "918269212182";

let productsList = [];
let categoriesList = typeof DEFAULT_CATEGORIES !== 'undefined' ? [...DEFAULT_CATEGORIES] : [];
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let sortBy = "default";
let currentLang = "en";
let activeDiscount = 0;
let discountCode = "";
let visibleProductsCount = 8;

// Customizer State
let customizerState = {
  productType: "lamp",
  title: "Pink Acrylic 3D Heart Bear LED Lamp",
  price: 699,
  nameText: "Aman & Neha",
  dateText: "14 Feb 2024",
  messageText: "Forever Together 💖",
  fontStyle: "font-cursive",
  lightColor: "#f472b6",
  uploadedPhoto: null
};

const CANONICAL_MASCOT_LOGO = "assets/images/chintus_official_logo.png?v=11.0";

function resolveSafeLogo(logo) {
  if (!logo || typeof logo !== 'string') return CANONICAL_MASCOT_LOGO;
  const l = logo.trim();
  if (l.startsWith('data:image/') || l.startsWith('/uploads/')) {
    return l;
  }
  return CANONICAL_MASCOT_LOGO;
}

// Instant 0ms Fast Cache Rendering (Zero Latency on Page Load)
(function initFastRender() {
  try {
    const cachedSettings = localStorage.getItem('chintu_store_settings');
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      parsed.storeLogo = resolveSafeLogo(parsed.storeLogo);
      try { localStorage.setItem('chintu_store_settings', JSON.stringify(parsed)); } catch (_) {}
      applyStoreSettings(parsed);
    }
    const cachedCats = localStorage.getItem('chintu_categories');
    if (cachedCats) {
      const cats = JSON.parse(cachedCats);
      if (Array.isArray(cats) && cats.length > 0 && cats.some(c => c.id === 'cosmetics')) {
        categoriesList = cats.filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
        try { localStorage.setItem('chintu_categories', JSON.stringify(categoriesList)); } catch (_) {}
      } else if (typeof DEFAULT_CATEGORIES !== 'undefined' && Array.isArray(DEFAULT_CATEGORIES)) {
        categoriesList = [...DEFAULT_CATEGORIES].filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
        try { localStorage.setItem('chintu_categories', JSON.stringify(categoriesList)); } catch (_) {}
      }
    } else if (typeof DEFAULT_CATEGORIES !== 'undefined' && Array.isArray(DEFAULT_CATEGORIES)) {
      categoriesList = [...DEFAULT_CATEGORIES].filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
    }
  } catch (_) {}
})();

document.addEventListener("DOMContentLoaded", () => {
  loadStoreSettings();
  loadCart();
  checkStoreOpenStatus();
  fetchCategoriesAndRender();
  initCustomizer();
  initQuiz();
  setupEventListeners();
  initVisitorTracker("Storefront Homepage");
  setInterval(checkStoreOpenStatus, 60000);

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

// Load settings from backend or local storage (Local custom settings NEVER get overwritten by server defaults)
async function loadStoreSettings() {
  const local = localStorage.getItem('chintu_store_settings');
  let parsedLocal = null;
  if (local) {
    try {
      parsedLocal = JSON.parse(local);
      if (parsedLocal) {
        parsedLocal.storeLogo = resolveSafeLogo(parsedLocal.storeLogo);
        localStorage.setItem('chintu_store_settings', JSON.stringify(parsedLocal));
      }
      applyStoreSettings(parsedLocal);
    } catch (_) {}
  }

  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.data) {
      const serverSettings = data.data;
      serverSettings.storeLogo = resolveSafeLogo(serverSettings.storeLogo);
      let finalSettings;

      // Safe logo resolution: custom logo always prevails
      let bestLogo = CANONICAL_MASCOT_LOGO;
      if (parsedLocal && parsedLocal.storeLogo && parsedLocal.storeLogo.trim() !== "") {
        bestLogo = resolveSafeLogo(parsedLocal.storeLogo);
      } else if (serverSettings.storeLogo && serverSettings.storeLogo.trim() !== "") {
        bestLogo = resolveSafeLogo(serverSettings.storeLogo);
      }

      if (parsedLocal && typeof parsedLocal === 'object' && Object.keys(parsedLocal).length > 0) {
        finalSettings = Object.assign({}, serverSettings, parsedLocal);
        finalSettings.storeLogo = bestLogo;

        if (parsedLocal.instagramHandle) {
          finalSettings.instagramHandle = parsedLocal.instagramHandle;
        } else if (serverSettings.instagramHandle) {
          finalSettings.instagramHandle = serverSettings.instagramHandle;
        }

        if (parsedLocal.sectionsConfig && Object.keys(parsedLocal.sectionsConfig).length > 0) {
          finalSettings.sectionsConfig = parsedLocal.sectionsConfig;
        } else if (serverSettings.sectionsConfig && Object.keys(serverSettings.sectionsConfig).length > 0) {
          finalSettings.sectionsConfig = serverSettings.sectionsConfig;
        }
      } else {
        finalSettings = serverSettings;
        finalSettings.storeLogo = bestLogo;
      }

      localStorage.setItem('chintu_store_settings', JSON.stringify(finalSettings));
      applyStoreSettings(finalSettings);
      return;
    }
  } catch (e) {
    console.log("Using cached/default store settings:", e.message);
  }

  if (parsedLocal) {
    applyStoreSettings(parsedLocal);
    return;
  }

  applyStoreSettings({
    phone: STORE_PHONE,
    displayPhone: STORE_DISPLAY_PHONE,
    whatsapp: STORE_WA,
    announcement: "🌸 Cute Offer: Use Code CHINTU10 for 10% OFF | Free Home Delivery across Dalli Rajhara | WhatsApp: 8269212182 ✨",
    openTime: "10:30",
    closeTime: "20:30",
    closedDay: 2
  });
}

function applyStoreSettings(settings) {
  if (!settings) return;
  settings.storeLogo = resolveSafeLogo(settings.storeLogo);
  window.currentStoreSettings = settings;

  // 1. Theme and Aesthetic Styling
  document.body.classList.remove('theme-sakura-pink', 'theme-lavender-dream', 'theme-peach-coral', 'theme-cotton-candy', 'theme-matcha-mint');
  if (settings.theme) {
    document.body.classList.add(settings.theme);
  }
  document.body.classList.remove('blur-soft', 'blur-normal', 'blur-strong');
  if (settings.blurIntensity) {
    document.body.classList.add('blur-' + settings.blurIntensity);
  }
  if (settings.floatingStickers === false) {
    document.body.classList.add('hide-stickers');
  } else {
    document.body.classList.remove('hide-stickers');
  }

  // 2. Branding (Store Name, Logo, Tagline) & Adaptive PNG Molding
  const brandName = settings.storeName || settings.name;
  if (brandName) {
    document.title = `${brandName} | Dalli Rajhara`;
  }
  if (settings.brandShort) {
    document.querySelectorAll(".store-brand-title").forEach(el => el.textContent = settings.brandShort);
  }
  if (settings.brandTagline) {
    document.querySelectorAll(".store-brand-tagline").forEach(el => el.textContent = settings.brandTagline);
  }
  if (settings.storeLogo) {
    document.querySelectorAll(".store-logo-img").forEach(el => {
      el.src = settings.storeLogo;
      el.style.objectFit = 'contain';
    });
  }

  // Apply Logo Mold & Custom Shape / Height
  const logoWrapper = document.getElementById("store-logo-wrapper");
  if (logoWrapper) {
    const shape = settings.logoShape || 'natural';
    const size = settings.logoHeight || 'md';
    logoWrapper.className = `store-logo-wrap logo-shape-${shape} logo-size-${size} shrink-0`;
  }

  // 3. Top Announcement & Offers
  const annEl = document.getElementById("announcement-text");
  if (annEl && settings.announcement) annEl.textContent = settings.announcement;

  if (settings.deliveryNotice) {
    document.querySelectorAll(".store-delivery-notice").forEach(el => el.textContent = settings.deliveryNotice);
  }

  // 4. Hero Section Customization
  if (settings.heroBadge) {
    const badgeEl = document.getElementById("hero-badge-text");
    if (badgeEl) badgeEl.textContent = settings.heroBadge;
  }
  if (settings.heroHeading) {
    const headingEl = document.getElementById("hero-heading");
    if (headingEl) headingEl.innerHTML = settings.heroHeading.includes('<span') ? settings.heroHeading : `${settings.heroHeading} <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600">Subhash Chowk</span>`;
  }
  if (settings.heroSubtitle) {
    const subEl = document.getElementById("hero-subtitle");
    if (subEl) subEl.textContent = settings.heroSubtitle;
  }
  if (settings.heroImage) {
    const heroImg = document.getElementById("hero-main-img");
    if (heroImg) heroImg.src = settings.heroImage;
  }
  if (settings.heroCtaText) {
    const ctaText = document.getElementById("hero-cta-btn-text");
    if (ctaText) ctaText.textContent = settings.heroCtaText;
  }

  // 5. Contact, Address & Location
  const phone = settings.phone || STORE_PHONE;
  const dispPhone = settings.displayPhone || STORE_DISPLAY_PHONE;
  const wa = settings.whatsapp || STORE_WA;

  document.querySelectorAll(".store-phone-display").forEach(el => el.textContent = dispPhone);
  document.querySelectorAll(".store-phone-link").forEach(el => el.href = `tel:+91${phone}`);
  document.querySelectorAll(".store-wa-link").forEach(el => el.href = `https://wa.me/${wa}`);

  if (settings.address) {
    document.querySelectorAll(".store-address-text").forEach(el => el.textContent = settings.address);
  }
  if (settings.mapsUrl) {
    document.querySelectorAll(".store-maps-link").forEach(el => el.href = settings.mapsUrl);
  }
  if (settings.instagramHandle) {
    let instaUrl = settings.instagramHandle.trim();
    let displayHandle = instaUrl;
    if (instaUrl.startsWith('http://') || instaUrl.startsWith('https://')) {
      const parts = instaUrl.split('/').filter(Boolean);
      displayHandle = '@' + (parts[parts.length - 1] || 'chintusgiftstore');
    } else {
      const clean = instaUrl.replace('@', '');
      instaUrl = `https://instagram.com/${clean}`;
      displayHandle = `@${clean}`;
    }
    document.querySelectorAll(".store-insta-link").forEach(el => el.href = instaUrl);
    document.querySelectorAll(".store-insta-handle").forEach(el => el.textContent = displayHandle);
  }

  // 6. Section Control Centre: Hide/Show, Move, and Custom Content
  if (settings.sectionsConfig && typeof settings.sectionsConfig === 'object') {
    const flow = document.getElementById("main-content-flow");

    Object.entries(settings.sectionsConfig).forEach(([secId, cfg]) => {
      const sec = document.querySelector(`[data-section-id="${secId}"]`);
      if (!sec) return;

      // Visibility toggle
      if (cfg.visible === false) {
        sec.classList.add('hidden');
      } else {
        sec.classList.remove('hidden');
      }

      // Content customizer
      if (cfg.badge) {
        const b = sec.querySelector('.section-badge') || sec.querySelector('#hero-badge-text');
        if (b) b.textContent = cfg.badge;
      }
      if (cfg.title) {
        const t = sec.querySelector('.section-title') || sec.querySelector('#hero-heading');
        if (t) t.textContent = cfg.title;
      }
      if (cfg.subtitle) {
        const s = sec.querySelector('.section-subtitle') || sec.querySelector('#hero-subtitle');
        if (s) s.textContent = cfg.subtitle;
      }
      if (cfg.ctaText) {
        const c = sec.querySelector('.section-cta') || sec.querySelector('#hero-cta-btn-text');
        if (c) c.textContent = cfg.ctaText;
      }
    });

    // Reorder flow sections inside #main-content-flow
    if (flow) {
      const childSections = Array.from(flow.children).filter(el => el.hasAttribute('data-section-id'));
      childSections.sort((a, b) => {
        const idA = a.getAttribute('data-section-id');
        const idB = b.getAttribute('data-section-id');
        const orderA = settings.sectionsConfig[idA]?.order ?? 99;
        const orderB = settings.sectionsConfig[idB]?.order ?? 99;
        return orderA - orderB;
      });
      childSections.forEach(node => flow.appendChild(node));
    }
  }
}

// Render Categories Showcase on Front Page
function renderCategoriesShowcase(cats) {
  const container = document.getElementById("categories-showcase-grid");
  if (!container) return;

  const list = (Array.isArray(cats) && cats.length > 0) ? cats : categoriesList;
  if (!list || list.length === 0) return;

  container.innerHTML = list.map(cat => {
    const subcats = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    const count = cat.itemCount || (productsList ? productsList.filter(p => p.category === cat.id).length : 0);
    const countText = count > 0 ? `${count}+ Gifts` : 'Explore';

    return `
      <div class="category-card group relative pink-acrylic p-4 sm:p-5 flex flex-col justify-between overflow-hidden border border-pink-200/90 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-3xl">
        <div>
          <!-- Category Cover Image & Icon Badge -->
          <div class="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-4 bg-pink-100/70 border border-pink-100 cursor-pointer" onclick="window.location.href='/category?cat=${encodeURIComponent(cat.id)}'">
            <img src="${cat.image || 'assets/images/kawaii_stationery.jpg'}" alt="${cat.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-pink-950/70 via-pink-950/20 to-transparent"></div>
            
            <!-- Top Badges -->
            <div class="absolute top-3 left-3 flex items-center gap-1.5">
              <span class="w-9 h-9 rounded-2xl bg-white/95 backdrop-blur border border-pink-200 shadow-md flex items-center justify-center text-lg">
                ${cat.icon || '🎀'}
              </span>
            </div>
            
            <div class="absolute top-3 right-3">
              <span class="px-3 py-1 rounded-full text-[11px] font-black bg-pink-600/90 text-white shadow-md backdrop-blur">
                ${countText}
              </span>
            </div>

            <!-- Bottom Title on Image -->
            <div class="absolute bottom-3 left-3 right-3">
              <h3 class="text-base sm:text-lg font-black text-white font-fun drop-shadow flex items-center gap-1.5">
                <span>${cat.name}</span>
              </h3>
              ${cat.hindiName ? `<div class="text-[11px] font-bold text-pink-200 drop-shadow">${cat.hindiName}</div>` : ''}
            </div>
          </div>

          <!-- Tagline -->
          <p class="text-xs text-pink-900/80 font-medium mb-3 line-clamp-2 leading-relaxed">
            ${cat.tagline || 'Explore exclusive gifts and soft toys for every celebration in Dalli Rajhara!'}
          </p>

          <!-- Subcategories chips preview -->
          ${subcats.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 mb-4">
              ${subcats.slice(0, 3).map(sub => `
                <a href="/category?cat=${encodeURIComponent(cat.id)}&subcat=${encodeURIComponent(sub)}" class="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/80 hover:bg-pink-100 text-pink-800 border border-pink-200 transition">
                  ${sub}
                </a>
              `).join('')}
              ${subcats.length > 3 ? `<span class="text-[10px] font-bold px-2 py-1 rounded-full bg-pink-50 text-pink-600">+${subcats.length - 3} more</span>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Action Button -->
        <div class="pt-3 border-t border-pink-100 flex items-center justify-between">
          <span class="text-xs font-black text-pink-700 font-fun">Subhash Chowk Store</span>
          <a href="/category?cat=${encodeURIComponent(cat.id)}" class="px-4 py-2 rounded-2xl kawaii-btn-pink text-xs font-black shadow-sm flex items-center gap-1.5 group-hover:shadow-md transition">
            <span>Explore Gifts</span>
            <i class="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-0.5"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Fetch categories from backend REST API with instant 0ms cached render & stale-while-revalidate
async function fetchCategoriesAndRender() {
  // 1. Instant 0ms render from cache or static default
  const cached = localStorage.getItem('chintu_categories');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        categoriesList = parsed;
        renderCategoriesShowcase(categoriesList);
      }
    } catch (_) {}
  }
  if (categoriesList.length === 0 && typeof DEFAULT_CATEGORIES !== 'undefined') {
    categoriesList = [...DEFAULT_CATEGORIES];
    renderCategoriesShowcase(categoriesList);
  } else if (categoriesList.length > 0) {
    renderCategoriesShowcase(categoriesList);
  }

  // 2. Fetch fresh categories from backend API
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const cleanCats = data.data.filter(c => c.id !== 'references' && c.id !== 'shades-lookbook');
      const hasChanged = JSON.stringify(categoriesList) !== JSON.stringify(cleanCats);
      categoriesList = cleanCats;
      localStorage.setItem('chintu_categories', JSON.stringify(categoriesList));
      if (hasChanged) renderCategoriesShowcase(categoriesList);
    }
  } catch (e) {
    console.warn("Categories API not reachable, using cached:", e);
  }
}

function redirectToCategorySearch() {
  const input = document.getElementById("front-search-input");
  const query = input ? input.value.trim() : "";
  if (query) {
    window.location.href = `/category?search=${encodeURIComponent(query)}`;
  } else {
    window.location.href = `/category?cat=stationery`;
  }
}

// Fetch products from backend REST API with instant 0ms cached render & stale-while-revalidate
async function fetchProductsAndRender() {
  // 1. Instant 0ms render from pre-existing or cached products
  if (productsList && productsList.length > 0) {
    renderProducts();
  } else {
    const cached = localStorage.getItem('chintu_custom_products');
    if (cached) {
      try {
        const prods = JSON.parse(cached);
        if (Array.isArray(prods) && prods.length > 0) {
          productsList = prods;
          renderProducts();
        }
      } catch (_) {}
    }
    if (productsList.length === 0 && typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
      productsList = [...PRODUCTS_DATA];
      renderProducts();
    }
  }

  // 2. Background revalidation from server
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      productsList = data.data;
      localStorage.setItem('chintu_custom_products', JSON.stringify(productsList));
      renderProducts();
    }
  } catch (e) {
    console.warn("Backend API not reachable, using offline cache:", e);
  }
}

// Store Timings Check (IST)
function checkStoreOpenStatus() {
  const badgeEl = document.getElementById("store-status-badge");
  const timeDescEl = document.getElementById("store-timing-desc");
  if (!badgeEl) return;

  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  
  const day = istDate.getDay();
  const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();

  const openMinutes = 10 * 60 + 30; // 10:30 = 630
  const closeMinutes = 20 * 60 + 30; // 20:30 = 1230

  if (day === 2) { // Tuesday
    badgeEl.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
      <span class="w-2 h-2 rounded-full bg-rose-500"></span> Closed Today (Tuesday)
    </span>`;
    if (timeDescEl) timeDescEl.textContent = "Closed on Tuesdays (Online active)";
  } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    badgeEl.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
      <span class="w-2 h-2 rounded-full bg-emerald-500 absolute"></span>
      <span class="ml-1">🌸 Open Now (10:30 AM - 8:30 PM)</span>
    </span>`;
    if (timeDescEl) timeDescEl.textContent = "Open Today until 8:30 PM";
  } else {
    badgeEl.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
      <span class="w-2 h-2 rounded-full bg-amber-500"></span> Closed • Opens 10:30 AM
    </span>`;
    if (timeDescEl) timeDescEl.textContent = "Opens Tomorrow 10:30 AM";
  }
}

// Render Products Grid with 8 items pagination & "Show More"
function renderProducts() {
  const container = document.getElementById("products-grid");
  const loadMoreContainer = document.getElementById("products-load-more-container");
  if (!container) return;

  let filtered = productsList.filter(p => {
    const matchCategory = currentCategory === "all" || p.category === currentCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.hindiName && p.hindiName.includes(searchQuery)) ||
                        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  if (sortBy === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-pink-700">
        <div class="text-5xl mb-3 animate-cartoon-bounce">🧸</div>
        <h4 class="text-lg font-black text-pink-800 mb-1 font-fun">No matching kawaii gifts found</h4>
        <p class="text-xs text-pink-600">Try searching for "Teddy", "Highlighter", "Lamp", or "Diary"</p>
        <button onclick="resetFilters()" class="mt-4 px-5 py-2 rounded-full kawaii-btn-pink text-xs font-bold shadow-md">View All Items</button>
      </div>
    `;
    if (loadMoreContainer) loadMoreContainer.innerHTML = "";
    return;
  }

  const displayed = filtered.slice(0, visibleProductsCount);

  container.innerHTML = displayed.map(product => {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    const title = currentLang === "hi" && product.hindiName ? product.hindiName : product.name;
    const hasMultipleImages = Array.isArray(product.images) && product.images.length > 1;

    return `
      <div class="product-card group relative pink-acrylic p-3 sm:p-4 flex flex-col justify-between overflow-hidden border border-pink-200/80 shadow-sm hover:shadow-lg transition">
        
        <!-- Top Badges -->
        <div class="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          ${product.badge ? `<span class="kawaii-badge">${product.badge}</span>` : ''}
          ${hasMultipleImages ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600/90 text-white shadow-sm flex items-center gap-1"><i class="fa-solid fa-images text-[9px]"></i> ${product.images.length} Photos</span>` : ''}
          ${product.customizable ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-600 text-white shadow-sm flex items-center gap-1"><i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i> Custom</span>` : ''}
        </div>

        <!-- Product Image -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-pink-50 cursor-pointer border border-pink-100" onclick="openQuickView('${product.id}')">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" decoding="async">
          <div class="absolute inset-0 bg-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-xs font-black text-pink-700 bg-white/95 px-3 py-1.5 rounded-full shadow-md backdrop-blur">Quick View</span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="flex-1 flex flex-col">
          <!-- Rating -->
          <div class="flex items-center gap-1.5 mb-1">
            <div class="flex text-amber-400 text-xs">
              ${renderStars(product.rating || 5.0)}
            </div>
            <span class="text-[11px] text-pink-700 font-bold">(${product.reviewsCount || 10})</span>
            ${product.inStock ? '<span class="text-[10px] text-emerald-600 font-bold ml-auto">● In Stock</span>' : '<span class="text-[10px] text-rose-500 font-bold ml-auto">✕ Out of Stock</span>'}
          </div>

          <h3 class="text-xs sm:text-sm font-black text-purple-950 group-hover:text-pink-600 transition line-clamp-2 mb-1 cursor-pointer font-fun" onclick="openQuickView('${product.id}')">
            ${title}
          </h3>

          <p class="text-[11px] text-pink-900/70 line-clamp-2 mb-3 leading-relaxed">
            ${product.description || ''}
          </p>

          <!-- Price & Actions -->
          <div class="mt-auto pt-2.5 border-t border-pink-100">
            <div class="flex items-baseline gap-2 mb-2.5">
              <span class="text-lg sm:text-xl font-black text-pink-600 font-fun">₹${product.price}</span>
              <span class="text-xs text-slate-400 line-through">₹${product.originalPrice}</span>
              <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">${discount}% OFF</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              ${product.customizable ? `
                <button onclick="loadProductInCustomizer('${product.id}')" class="px-2 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-800 text-[11px] font-black flex items-center justify-center gap-1 transition">
                  <i class="fa-solid fa-paintbrush text-[10px]"></i> Customize
                </button>
              ` : `
                <button onclick="addToCart('${product.id}')" ${!product.inStock ? 'disabled' : ''} class="px-2 py-2 rounded-xl kawaii-btn-pink text-[11px] font-black flex items-center justify-center gap-1 shadow-sm">
                  <i class="fa-solid fa-bag-shopping text-[10px]"></i> Add Cart
                </button>
              `}
              
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
        <button id="show-more-products-btn" onclick="loadMoreProducts()" class="px-8 py-3 rounded-full kawaii-btn-pink text-xs sm:text-sm font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border-2 border-pink-300 cursor-pointer">
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
          <span>You've seen all <strong>${filtered.length}</strong> adorable gifts! 🎀</span>
        </div>
      `;
    } else {
      loadMoreContainer.innerHTML = "";
    }
  }
}

function loadMoreProducts() {
  visibleProductsCount += 8;
  renderProducts();
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

function resetFilters() {
  visibleProductsCount = 8;
  currentCategory = "all";
  searchQuery = "";
  sortBy = "default";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  document.querySelectorAll(".category-tab").forEach(tab => {
    tab.classList.toggle("bg-pink-600", tab.dataset.category === "all");
    tab.classList.toggle("text-white", tab.dataset.category === "all");
  });
  renderProducts();
}

// Customizer Studio
function initCustomizer() {
  updateCustomizerPreview();

  const nameInput = document.getElementById("custom-name-input");
  const dateInput = document.getElementById("custom-date-input");
  const msgInput = document.getElementById("custom-msg-input");
  const photoInput = document.getElementById("custom-photo-upload");

  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      customizerState.nameText = e.target.value || "Aman & Neha";
      updateCustomizerPreview();
    });
  }

  if (dateInput) {
    dateInput.addEventListener("input", (e) => {
      customizerState.dateText = e.target.value || "";
      updateCustomizerPreview();
    });
  }

  if (msgInput) {
    msgInput.addEventListener("input", (e) => {
      customizerState.messageText = e.target.value || "";
      updateCustomizerPreview();
    });
  }

  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          customizerState.uploadedPhoto = event.target.result;
          updateCustomizerPreview();
          showToast("Photo uploaded to preview! 🌸");
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function setCustomizerProduct(type) {
  customizerState.productType = type;
  if (type === "lamp") {
    customizerState.title = "Pink Acrylic 3D Heart Bear LED Lamp";
    customizerState.price = 699;
  } else if (type === "mug") {
    customizerState.title = "Color-Changing Photo Magic Mug";
    customizerState.price = 349;
  } else if (type === "plaque") {
    customizerState.title = "Pink Acrylic Spotify Music Plaque";
    customizerState.price = 499;
  } else if (type === "keychain") {
    customizerState.title = "Customized Pink Acrylic Keychain";
    customizerState.price = 199;
  } else if (type === "hamper") {
    customizerState.title = "Custom Kawaii Celebration Hamper";
    customizerState.price = 999;
  }

  document.querySelectorAll(".custom-prod-btn").forEach(btn => {
    const isSelected = btn.dataset.type === type;
    btn.classList.toggle("ring-2", isSelected);
    btn.classList.toggle("ring-pink-500", isSelected);
    btn.classList.toggle("bg-pink-100", isSelected);
  });

  const priceEl = document.getElementById("customizer-price-display");
  if (priceEl) priceEl.textContent = "Inquire Rate";

  updateCustomizerPreview();
}

function setCustomizerFont(fontClass) {
  customizerState.fontStyle = fontClass;
  document.querySelectorAll(".font-btn").forEach(btn => {
    btn.classList.toggle("border-pink-500", btn.dataset.font === fontClass);
    btn.classList.toggle("bg-pink-100", btn.dataset.font === fontClass);
  });
  updateCustomizerPreview();
}

function setCustomizerLightColor(colorHex) {
  customizerState.lightColor = colorHex;
  updateCustomizerPreview();
}

function updateCustomizerPreview() {
  const container = document.getElementById("customizer-mockup-area");
  if (!container) return;

  const defaultPhoto = "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=500&q=80";
  const userPhoto = customizerState.uploadedPhoto || defaultPhoto;

  if (customizerState.productType === "lamp") {
    container.innerHTML = `
      <img src="assets/images/pink_acrylic_lamp.jpg" alt="Pink Acrylic Lamp" class="custom-mockup-bg">
      <div class="absolute inset-0 flex flex-col items-center justify-center p-4" style="margin-top: -30px;">
        <div class="${customizerState.fontStyle} text-xl sm:text-2xl font-black text-center transition duration-300" style="color: ${customizerState.lightColor}; text-shadow: 0 0 12px ${customizerState.lightColor}, 0 0 25px rgba(244, 114, 182, 0.8);">
          ${customizerState.nameText}
        </div>
        ${customizerState.dateText ? `
          <div class="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-pink-900 bg-white/70 px-2 py-0.5 rounded-full backdrop-blur">
            ${customizerState.dateText}
          </div>
        ` : ''}
        ${customizerState.messageText ? `
          <div class="text-[11px] font-semibold italic mt-1 text-pink-700 bg-white/80 px-2.5 py-0.5 rounded-full shadow-sm">
            ${customizerState.messageText}
          </div>
        ` : ''}
      </div>
    `;
  } else if (customizerState.productType === "mug") {
    container.innerHTML = `
      <img src="assets/images/product_mug.jpg" alt="Magic Mug" class="custom-mockup-bg">
      <div class="absolute top-[36%] left-[31%] w-[38%] h-[48%] overflow-hidden rounded shadow-inner">
        <img src="${userPhoto}" class="w-full h-full object-cover">
        <div class="absolute bottom-1 left-0 right-0 bg-pink-950/70 text-center text-white ${customizerState.fontStyle} text-xs py-0.5">
          ${customizerState.nameText}
        </div>
      </div>
    `;
  } else if (customizerState.productType === "plaque") {
    container.innerHTML = `
      <img src="assets/images/kawaii_stationery.jpg" alt="Spotify Plaque" class="custom-mockup-bg">
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="pink-acrylic p-3 w-44 shadow-2xl border-2 border-pink-300 text-center">
          <div class="w-full aspect-square rounded-xl overflow-hidden mb-2 border border-pink-200">
            <img src="${userPhoto}" class="w-full h-full object-cover">
          </div>
          <div class="text-xs font-black text-purple-950 truncate ${customizerState.fontStyle}">${customizerState.nameText}</div>
          <div class="text-[10px] text-pink-700 truncate">${customizerState.messageText || "Our Sweet Song"}</div>
          <div class="flex items-center justify-between text-[9px] text-pink-900 mt-2 px-1">
            <span>1:24</span>
            <div class="w-16 h-1 bg-pink-300 rounded-full overflow-hidden">
              <div class="w-8 h-full bg-pink-600"></div>
            </div>
            <span>3:45</span>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <img src="assets/images/kawaii_hero.jpg" alt="Hamper" class="custom-mockup-bg">
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="pink-acrylic p-4 text-center max-w-xs border border-pink-300 shadow-xl">
          <div class="text-base font-black text-pink-600 font-fun ${customizerState.fontStyle}">${customizerState.nameText}</div>
          <div class="text-xs text-pink-900 mt-1">${customizerState.messageText}</div>
          <div class="text-[10px] text-pink-600 font-bold mt-2">🎀 Kawaii Gift Box Included</div>
        </div>
      </div>
    `;
  }
}

function loadProductInCustomizer(productId) {
  const product = productsList.find(p => p.id === productId);
  if (!product) return;
  setCustomizerProduct(product.customType || "lamp");
  const customSection = document.getElementById("customizer-studio");
  if (customSection) {
    customSection.scrollIntoView({ behavior: "smooth" });
  }
}

function addCustomizedToCart() {
  const customItem = {
    id: `custom-${Date.now()}`,
    name: `${customizerState.title} (Personalized)`,
    price: customizerState.price,
    image: customizerState.productType === "lamp" ? "assets/images/pink_acrylic_lamp.jpg" : "assets/images/product_mug.jpg",
    customDetails: {
      name: customizerState.nameText,
      date: customizerState.dateText,
      message: customizerState.messageText,
      font: customizerState.fontStyle
    },
    quantity: 1
  };

  cart.push(customItem);
  saveCart();
  updateCartUI();
  openCartDrawer();
  showToast("Customized design added to cart! 🌸");
}

function orderCustomOnWhatsApp() {
  const text = `🌸 *NEW CUSTOM DESIGN ORDER - CHINTU'S GIFT SHOP*\n` +
               `========================================\n` +
               `🎀 *Product:* ${customizerState.title}\n` +
               `✨ *Custom Name:* ${customizerState.nameText}\n` +
               (customizerState.dateText ? `📅 *Date:* ${customizerState.dateText}\n` : '') +
               (customizerState.messageText ? `💌 *Card Message:* ${customizerState.messageText}\n` : '') +
               `========================================\n` +
               `Please share the best rate, availability, and home delivery details for Dalli Rajhara!`;

  const url = `https://wa.me/${STORE_WA}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// Cart Functionality
function addToCart(productId) {
  const product = productsList.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId && !item.customDetails);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added to cart! 🧸`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function updateCartQuantity(index, delta) {
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("chintu_gift_cart", JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem("chintu_gift_cart");
  if (saved) {
    try {
      cart = JSON.parse(saved);
    } catch (e) {
      cart = [];
    }
  }
  updateCartUI();
}

function updateCartUI() {
  const countEls = document.querySelectorAll(".cart-count-badge");
  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  countEls.forEach(el => {
    el.textContent = totalItems;
    el.classList.toggle("hidden", totalItems === 0);
  });

  const cartItemsContainer = document.getElementById("cart-drawer-items");
  const totalCountEl = document.getElementById("cart-total-count");

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="py-16 text-center text-pink-700">
        <div class="text-5xl mb-3 animate-cartoon-bounce">🛍️</div>
        <p class="text-sm font-black text-pink-800 font-fun">Your inquiry bag is empty</p>
        <p class="text-xs text-pink-600 mt-1">Explore categories & add items to inquire on WhatsApp!</p>
      </div>
    `;
    if (totalCountEl) totalCountEl.textContent = "0 items";
    return;
  }

  if (totalCountEl) totalCountEl.textContent = `${totalItems} items`;

  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="flex gap-2.5 py-2.5 border-b border-pink-100 items-center">
      <img src="${item.image || 'assets/images/chintus_official_logo.png?v=11.0'}" alt="${item.name}" onerror="this.onerror=null; this.src='assets/images/chintus_official_logo.png?v=11.0';" class="w-14 h-14 rounded-xl object-contain bg-white border border-pink-200">
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-purple-950 truncate">${item.name}</h4>
        <div class="flex items-center gap-2 text-[10px] text-pink-600 font-bold">
          <span>SKU: ${item.sku || item.id}</span>
          ${item.brand ? `<span>• ${item.brand}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="updateCartQuantity(${index}, -1)" class="w-6 h-6 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold flex items-center justify-center text-xs">-</button>
        <span class="text-xs font-black text-purple-950 w-4 text-center">${item.quantity || 1}</span>
        <button onclick="updateCartQuantity(${index}, 1)" class="w-6 h-6 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold flex items-center justify-center text-xs">+</button>
      </div>
      <button onclick="removeFromCart(${index})" class="text-slate-400 hover:text-rose-600 p-1">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
  `).join("");
}

function applyCoupon() {
  const input = document.getElementById("coupon-input");
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  const cfgCode = (window.currentStoreSettings?.couponCode || "CHINTU10").toUpperCase();
  const cfgDiscount = Number(window.currentStoreSettings?.couponDiscount) || 10;
  const cfgMinOrder = Number(window.currentStoreSettings?.couponMinOrder) || 0;

  const currentSubtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  if (cfgMinOrder > 0 && currentSubtotal < cfgMinOrder) {
    showToast(`Coupon requires minimum order of ₹${cfgMinOrder}!`, "error");
    return;
  }

  if (code === cfgCode) {
    activeDiscount = cfgDiscount;
    discountCode = cfgCode;
    showToast(`Coupon '${cfgCode}' applied! ${cfgDiscount}% OFF 🌸`);
  } else if (code === "FIRSTGIFT") {
    activeDiscount = 15;
    discountCode = "FIRSTGIFT";
    showToast("Coupon 'FIRSTGIFT' applied! 15% OFF 🎉");
  } else if (code === "CHINTU10") {
    activeDiscount = 10;
    discountCode = "CHINTU10";
    showToast("Coupon 'CHINTU10' applied! 10% OFF 🌸");
  } else {
    showToast(`Invalid code! Try ${cfgCode}`, "error");
    return;
  }
  updateCartUI();
}

function openCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  if (drawer && overlay) {
    drawer.classList.add("active");
    overlay.classList.add("active");
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  if (drawer && overlay) {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
  }
}

function openCheckoutModal() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", "error");
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.classList.add("hidden");
}

async function completeCheckoutWhatsApp() {
  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const deliveryType = document.querySelector('input[name="delivery_type"]:checked')?.value || "Home Delivery";
  const address = document.getElementById("checkout-address").value.trim();
  const cardMsg = document.getElementById("checkout-card-msg").value.trim();

  if (!name || !phone) {
    showToast("Please provide your name and phone number!", "error");
    return;
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (activeDiscount / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Send order to backend API to log in orders.json
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name, phone, address, deliveryType, cardMessage: cardMsg },
        items: cart,
        subtotal,
        discount: discountAmount,
        total: finalTotal
      })
    });
  } catch (err) {
    console.warn("Could not sync with backend orders API:", err);
  }

  // Format WhatsApp message to 8269212182
  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const itemsText = cart.map((item, idx) => `${idx + 1}. *${item.name}* (SKU: ${item.sku || item.id}) - Qty: ${item.quantity || 1}`).join('\n');

  let msg = `🌸 *NEW CATALOGUE INQUIRY - CHINTU'S GIFT STORE*\n` +
            `========================================\n` +
            `👤 *Customer Name:* ${name}\n` +
            `📞 *WhatsApp Phone:* ${phone}\n` +
            `🚚 *Preference:* ${deliveryType}\n` +
            (deliveryType === "Home Delivery" ? `📍 *Address:* ${address || 'Local Dalli Rajhara'}\n` : `📍 *Pickup Point:* Chintu's, Subhash Chowk, Dalli Rajhara\n`) +
            (cardMsg ? `💌 *Inquiry Note:* "${cardMsg}"\n` : '') +
            `========================================\n` +
            `📦 *SELECTED ITEMS FOR INQUIRY:*\n` +
            `${itemsText}\n` +
            `========================================\n` +
            `📊 *Total Items:* ${totalItems} items\n\n` +
            `Please share the price, availability, and delivery details for Dalli Rajhara. Thank you! 🎀`;

  const waUrl = `https://wa.me/${STORE_WA}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");

  cart = [];
  saveCart();
  updateCartUI();
  closeCheckoutModal();
  showToast("Inquiry dispatched via WhatsApp to 8269212182! 💖");
}

function buyOnWhatsApp(productId) {
  const product = productsList.find(p => p.id === productId);
  if (!product) return;

  const text = `🌸 *Hello Chintu's Gift Shop (8269212182)*,\n` +
               `I want to order this item:\n` +
               `🎁 *${product.name}*\n` +
               `💰 Price: ₹${product.price}\n\n` +
               `Is this available for fast delivery or pickup at Subhash Chowk, Dalli Rajhara?`;

  const url = `https://wa.me/${STORE_WA}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

async function openQuickView(productId) {
  let product = (Array.isArray(productsList) && productsList.length > 0) ? productsList.find(p => p.id === productId) : null;
  if (!product && typeof window !== 'undefined' && Array.isArray(window.PRODUCTS_DATA)) {
    product = window.PRODUCTS_DATA.find(p => p.id === productId);
  }
  if (!product) {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        productsList = data.data;
        product = productsList.find(p => p.id === productId);
      }
    } catch (_) {}
  }
  if (!product) return;

  const modal = document.getElementById("quickview-modal");
  const modalBody = document.getElementById("quickview-body");
  if (!modal || !modalBody) return;

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  // Multi-image support
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
          ${product.customizable ? `
            <button onclick="loadProductInCustomizer('${product.id}'); closeQuickView();" class="w-full py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-800 text-xs font-black transition flex items-center justify-center gap-1">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Customize Name / Photo
            </button>
          ` : ''}
          <button type="button" onclick="closeQuickView()" class="w-full py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-black transition flex items-center justify-center gap-1.5 border border-slate-300 hover:border-rose-300 shadow-sm cursor-pointer mt-1">
            <i class="fa-solid fa-xmark text-sm"></i> <span>Close Product View (बंद करें ✕)</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
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

function closeQuickView() {
  const modal = document.getElementById("quickview-modal");
  if (modal) modal.classList.add("hidden");
}

// Occasion Quiz
function initQuiz() {
  const form = document.getElementById("gift-quiz-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const recipient = document.querySelector('input[name="quiz_recipient"]:checked')?.value || "partner";
    const occasion = document.querySelector('input[name="quiz_occasion"]:checked')?.value || "birthday";

    let matched = productsList.filter(p => {
      if (recipient === "kids") return p.category === "toys" || p.category === "novelties";
      if (recipient === "friend") return p.category === "stationery" || p.category === "personalized";
      return p.category === "personalized" || p.category === "birthday";
    }).slice(0, 3);

    if (matched.length === 0) matched = productsList.slice(0, 3);

    const resultsContainer = document.getElementById("quiz-results-container");
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="mt-6 p-4 sm:p-6 pink-acrylic border-2 border-pink-300">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-pink-700 font-fun flex items-center gap-1.5">
              <span>🌸</span> Best Kawaii Matches For You
            </h4>
            <span class="text-[10px] font-bold bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-full uppercase">${recipient} • ${occasion}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${matched.map(p => `
              <div class="p-2.5 rounded-2xl bg-white border border-pink-200 flex flex-col justify-between shadow-sm">
                <img src="${p.image}" class="w-full aspect-square rounded-xl object-cover mb-2">
                <h5 class="text-xs font-black text-purple-950 truncate font-fun">${p.name}</h5>
                <div class="text-xs font-black text-pink-600 mt-1 mb-2">₹${p.price}</div>
                <button onclick="addToCart('${p.id}')" class="py-1.5 rounded-lg kawaii-btn-pink text-[10px] font-black">Add to Cart</button>
              </div>
            `).join("")}
          </div>
        </div>
      `;
      resultsContainer.scrollIntoView({ behavior: "smooth" });
    }
  });
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "hi" : "en";
  const btn = document.getElementById("lang-btn-text");
  if (btn) btn.textContent = currentLang === "en" ? "हिन्दी" : "English";
  renderProducts();
  showToast(currentLang === "hi" ? "भाषा हिन्दी में बदली गई 🌸" : "Language switched to English 🌸");
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

function setupEventListeners() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      visibleProductsCount = 8;
      renderProducts();
    });
  }

  document.querySelectorAll(".category-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".category-tab").forEach(t => {
        t.classList.remove("bg-pink-600", "text-white");
        t.classList.add("bg-white/80", "text-pink-800");
      });
      tab.classList.add("bg-pink-600", "text-white");
      tab.classList.remove("bg-white/80", "text-pink-800");
      currentCategory = tab.dataset.category;
      visibleProductsCount = 8;
      renderProducts();
    });
  });

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortBy = e.target.value;
      visibleProductsCount = 8;
      renderProducts();
    });
  }

  const copyBtn = document.getElementById("copy-address-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText("Shop No. 2, House 01, Subhash Chowk, Near Bharat Petroleum, Ward Number 19, Dalli Rajhara, Chhattisgarh 491228");
      showToast("Store address copied! 📍");
    });
  }
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
      page: pageName || document.title || 'Storefront',
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

