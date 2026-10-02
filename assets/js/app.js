// Core Client Script for Chintu's Gift & Kawaii Store - Dalli Rajhara

const STORE_PHONE = "8269212182";
const STORE_DISPLAY_PHONE = "+91 82692 12182";
const STORE_WA = "918269212182";

let productsList = [];
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let sortBy = "default";
let currentLang = "en";
let activeDiscount = 0;
let discountCode = "";

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

document.addEventListener("DOMContentLoaded", () => {
  loadStoreSettings();
  loadCart();
  checkStoreOpenStatus();
  fetchProductsAndRender();
  initCustomizer();
  initQuiz();
  setupEventListeners();
  setInterval(checkStoreOpenStatus, 60000);
});

// Load settings from backend or local defaults
async function loadStoreSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.data) {
      applyStoreSettings(data.data);
      return;
    }
  } catch (e) {
    console.log("Using default store settings");
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

  // 2. Branding (Store Name, Logo, Tagline)
  if (settings.storeName) {
    document.title = `${settings.storeName} | Dalli Rajhara`;
  }
  if (settings.brandShort) {
    document.querySelectorAll(".store-brand-title").forEach(el => el.textContent = settings.brandShort);
  }
  if (settings.brandTagline) {
    document.querySelectorAll(".store-brand-tagline").forEach(el => el.textContent = settings.brandTagline);
  }
  if (settings.storeLogo) {
    document.querySelectorAll(".store-logo-img").forEach(el => el.src = settings.storeLogo);
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
}

// Fetch products from backend REST API
async function fetchProductsAndRender() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      productsList = data.data;
      renderProducts();
      return;
    }
  } catch (e) {
    console.warn("Backend API not reachable, falling back to local dataset:", e);
  }

  if (typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
    productsList = PRODUCTS_DATA;
    renderProducts();
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

// Render Products Grid
function renderProducts() {
  const container = document.getElementById("products-grid");
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
    return;
  }

  container.innerHTML = filtered.map(product => {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    const title = currentLang === "hi" && product.hindiName ? product.hindiName : product.name;

    return `
      <div class="product-card group relative pink-acrylic p-3 sm:p-4 flex flex-col justify-between overflow-hidden border border-pink-200/80 shadow-sm hover:shadow-lg transition">
        
        <!-- Top Badges -->
        <div class="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          ${product.badge ? `<span class="kawaii-badge">${product.badge}</span>` : ''}
          ${product.customizable ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-600 text-white shadow-sm flex items-center gap-1"><i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i> Custom</span>` : ''}
        </div>

        <!-- Product Image -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-pink-50 cursor-pointer border border-pink-100" onclick="openQuickView('${product.id}')">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" loading="lazy">
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
  if (priceEl) priceEl.textContent = `₹${customizerState.price}`;

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
               `💰 *Price:* ₹${customizerState.price}\n` +
               `✨ *Custom Name:* ${customizerState.nameText}\n` +
               (customizerState.dateText ? `📅 *Date:* ${customizerState.dateText}\n` : '') +
               (customizerState.messageText ? `💌 *Card Message:* ${customizerState.messageText}\n` : '') +
               `========================================\n` +
               `Please confirm order for Dalli Rajhara store and share UPI QR / Payment details!`;

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
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  countEls.forEach(el => {
    el.textContent = totalItems;
    el.classList.toggle("hidden", totalItems === 0);
  });

  const cartItemsContainer = document.getElementById("cart-drawer-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  const discountEl = document.getElementById("cart-discount");
  const totalEl = document.getElementById("cart-total");

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="py-16 text-center text-pink-700">
        <div class="text-5xl mb-3 animate-cartoon-bounce">🛍️</div>
        <p class="text-sm font-black text-pink-800 font-fun">Your cart is empty</p>
        <p class="text-xs text-pink-600 mt-1">Add soft toys and fancy stationery!</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = "₹0";
    if (discountEl) discountEl.textContent = "₹0";
    if (totalEl) totalEl.textContent = "₹0";
    return;
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (activeDiscount / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount);

  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="flex gap-2.5 py-2.5 border-b border-pink-100 items-center">
      <img src="${item.image}" alt="${item.name}" class="w-14 h-14 rounded-xl object-cover bg-white border border-pink-200">
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-purple-950 truncate">${item.name}</h4>
        ${item.customDetails ? `
          <div class="text-[10px] text-pink-600 font-bold">Custom: "${item.customDetails.name}"</div>
        ` : ''}
        <div class="text-xs font-extrabold text-pink-600 mt-0.5">₹${item.price}</div>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="updateCartQuantity(${index}, -1)" class="w-6 h-6 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold flex items-center justify-center text-xs">-</button>
        <span class="text-xs font-black text-purple-950 w-4 text-center">${item.quantity}</span>
        <button onclick="updateCartQuantity(${index}, 1)" class="w-6 h-6 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold flex items-center justify-center text-xs">+</button>
      </div>
      <button onclick="removeFromCart(${index})" class="text-slate-400 hover:text-rose-600 p-1">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
  `).join("");

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (discountEl) discountEl.textContent = `-₹${discountAmount}`;
  if (totalEl) totalEl.textContent = `₹${finalTotal}`;
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
  let msg = `🛍️ *NEW ORDER FROM WEBSITE - CHINTU'S GIFT SHOP*\n` +
            `========================================\n` +
            `👤 *Customer Name:* ${name}\n` +
            `📞 *Customer Phone:* ${phone}\n` +
            `🚚 *Delivery:* ${deliveryType}\n` +
            (deliveryType === "Home Delivery" ? `📍 *Address:* ${address || 'Local Dalli Rajhara'}\n` : `📍 *Pickup Point:* Chintu's, Subhash Chowk, Dalli Rajhara\n`) +
            (cardMsg ? `💌 *Greeting Card Message:* "${cardMsg}"\n` : '') +
            `========================================\n` +
            `📦 *ITEMS ORDERED:*\n`;

  cart.forEach((item, i) => {
    msg += `${i + 1}. ${item.name} x ${item.quantity} = ₹${item.price * item.quantity}\n`;
    if (item.customDetails) {
      msg += `   ↳ *Custom:* Name: "${item.customDetails.name}", Msg: "${item.customDetails.message}"\n`;
    }
  });

  msg += `========================================\n` +
         `💰 *Subtotal:* ₹${subtotal}\n` +
         (activeDiscount > 0 ? `🎟️ *Coupon (${discountCode}):* -₹${discountAmount}\n` : '') +
         `🚚 *Delivery Charges:* FREE\n` +
         `⭐ *TOTAL PAYABLE:* ₹${finalTotal}\n\n` +
         `Please confirm my order and share UPI / QR payment instructions!`;

  const waUrl = `https://wa.me/${STORE_WA}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");

  cart = [];
  saveCart();
  updateCartUI();
  closeCheckoutModal();
  showToast("Order dispatched via WhatsApp to 8269212182! 💖");
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

function openQuickView(productId) {
  const product = productsList.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("quickview-modal");
  const modalBody = document.getElementById("quickview-body");
  if (!modal || !modalBody) return;

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  modalBody.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="aspect-square rounded-2xl overflow-hidden bg-pink-50 border border-pink-200">
        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
      </div>
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-1.5 mb-1.5">
            ${product.badge ? `<span class="kawaii-badge">${product.badge}</span>` : ''}
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
      renderProducts();
    });
  });

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortBy = e.target.value;
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
