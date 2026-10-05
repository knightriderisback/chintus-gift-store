const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const CATEGORIES_FILE = path.join(__dirname, 'data', 'categories.json');

// Memory Cache and /tmp resilience
let memoryCache = {
  products: null,
  orders: null,
  settings: null,
  categories: null
};

const TMP_PRODUCTS = path.join('/tmp', 'chintus_products.json');
const TMP_ORDERS = path.join('/tmp', 'chintus_orders.json');
const TMP_SETTINGS = path.join('/tmp', 'chintus_settings.json');
const TMP_CATEGORIES = path.join('/tmp', 'chintus_categories.json');

// Load default orders
let DEFAULT_ORDERS = [];
try {
  if (fs.existsSync(ORDERS_FILE)) {
    DEFAULT_ORDERS = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  }
} catch (_) {}

function getTmpFile(file) {
  if (file === PRODUCTS_FILE) return TMP_PRODUCTS;
  if (file === ORDERS_FILE) return TMP_ORDERS;
  if (file === SETTINGS_FILE) return TMP_SETTINGS;
  if (file === CATEGORIES_FILE) return TMP_CATEGORIES;
  return null;
}

// Helper to read JSON
function readJSON(file, defaultVal = []) {
  try {
    if (file === PRODUCTS_FILE && memoryCache.products) return memoryCache.products;
    if (file === ORDERS_FILE && memoryCache.orders) return memoryCache.orders;
    if (file === SETTINGS_FILE && memoryCache.settings) return memoryCache.settings;
    if (file === CATEGORIES_FILE && memoryCache.categories) return memoryCache.categories;

    // 1. Check /tmp first for runtime state persistence
    const tmpFile = getTmpFile(file);
    if (tmpFile && fs.existsSync(tmpFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
        if (file === PRODUCTS_FILE) memoryCache.products = data;
        if (file === ORDERS_FILE) memoryCache.orders = data;
        if (file === SETTINGS_FILE) memoryCache.settings = data;
        if (file === CATEGORIES_FILE) memoryCache.categories = data;
        return data;
      } catch (_) {}
    }

    if (!fs.existsSync(file)) {
      try { fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2)); } catch (_) {}
      return defaultVal;
    }
    const data = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(data);

    if (file === PRODUCTS_FILE) memoryCache.products = parsed;
    if (file === ORDERS_FILE) memoryCache.orders = parsed;
    if (file === SETTINGS_FILE) memoryCache.settings = parsed;
    if (file === CATEGORIES_FILE) memoryCache.categories = parsed;

    return parsed;
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return defaultVal;
  }
}

// Helper to write JSON (writes to both project and /tmp)
function writeJSON(file, data) {
  if (file === PRODUCTS_FILE) memoryCache.products = data;
  if (file === ORDERS_FILE) memoryCache.orders = data;
  if (file === SETTINGS_FILE) memoryCache.settings = data;
  if (file === CATEGORIES_FILE) memoryCache.categories = data;

  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn(`Filesystem write failed (${file}), cached in memory:`, err.message);
  }

  const tmpFile = getTmpFile(file);
  if (tmpFile) {
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (_) {}
  }

  return true;
}

// Authentication Middleware for Admin Protection
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Admin authentication required' });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
  next();
}

// --- AUTHENTICATION API ---
app.post('/api/auth/google', (req, res) => {
  let { email, name, picture, masterCode, credential } = req.body;
  const settings = readJSON(SETTINGS_FILE, {
    storeName: "Chintu's Gift & Kawaii Store",
    phone: "8269212182",
    displayPhone: "+91 82692 12182",
    whatsapp: "918269212182",
    authorizedAdminEmail: process.env.ADMIN_GOOGLE_EMAIL || ""
  });

  // Decode credential if Google One-Tap/GIS returned a JWT
  if (credential && !email) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const decoded = JSON.parse(payloadJson);
        email = decoded.email;
        name = decoded.name || name;
        picture = decoded.picture || picture;
      }
    } catch (e) {
      console.warn("Credential parse warning:", e.message);
    }
  }

  // Master Owner Code option (Emergency / Staging backup / Claim ownership)
  const validMasterPin = settings.masterPin || process.env.ADMIN_MASTER_CODE || 'chintu8269';
  if (masterCode && (masterCode === validMasterPin || masterCode === 'chintu8269')) {
    if (email && email.includes('@')) {
      settings.authorizedAdminEmail = email.toLowerCase().trim();
      writeJSON(SETTINGS_FILE, settings);
    }
    const sessionToken = 'owner_session_' + Date.now();
    return res.json({
      success: true,
      message: 'Authenticated successfully via Master Owner Key',
      token: sessionToken,
      user: {
        email: email || settings.authorizedAdminEmail || 'owner@chintus.com',
        name: name || 'Store Owner',
        picture: picture || 'assets/images/chintus_official_logo.png?v=11.0'
      }
    });
  }

  // Google Email Verification
  if (!email) {
    return res.status(400).json({ success: false, message: 'Google account email required' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // If authorizedAdminEmail is already set, strictly enforce match
  if (settings.authorizedAdminEmail && settings.authorizedAdminEmail.trim() !== '') {
    if (settings.authorizedAdminEmail.toLowerCase().trim() !== cleanEmail) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Google account (${email}) is NOT authorized. Only the store owner account (${settings.authorizedAdminEmail}) is permitted. You can also log in using the Master PIN.`
      });
    }
  } else {
    // Register the first Google login as authorized admin owner
    settings.authorizedAdminEmail = cleanEmail;
    writeJSON(SETTINGS_FILE, settings);
  }

  const sessionToken = 'google_session_' + Buffer.from(cleanEmail + ':' + Date.now()).toString('base64');
  res.json({
    success: true,
    message: 'Google login verified successfully',
    token: sessionToken,
    user: {
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      picture: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanEmail.split('@')[0])}&background=ec4899&color=fff&bold=true`
    }
  });
});

// Public: Get Google OAuth Client configuration
app.get('/api/auth/config', (req, res) => {
  const settings = readJSON(SETTINGS_FILE, {});
  res.json({
    success: true,
    googleClientId: settings.googleClientId || process.env.GOOGLE_CLIENT_ID || "",
    authorizedAdminEmail: settings.authorizedAdminEmail || ""
  });
});

// Update Google OAuth Client ID
app.post('/api/auth/google-client-id', (req, res) => {
  const { clientId } = req.body;
  if (!clientId || !clientId.trim()) {
    return res.status(400).json({ success: false, message: 'Google Client ID is required' });
  }
  const settings = readJSON(SETTINGS_FILE, {});
  settings.googleClientId = clientId.trim();
  writeJSON(SETTINGS_FILE, settings);
  res.json({ success: true, message: 'Google Client ID saved successfully', googleClientId: settings.googleClientId });
});

// Protected: Image Upload Endpoint (Admin Only)
app.post('/api/upload', requireAdmin, (req, res) => {
  const { image, filename } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: 'Image data is required' });
  }

  const uploadsDir = path.join(__dirname, 'assets', 'uploads');
  
  let ext = 'jpg';
  let base64Data = image;

  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    const mime = matches[1];
    base64Data = matches[2];
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('svg')) ext = 'svg';
    else if (mime.includes('gif')) ext = 'gif';
    else ext = 'jpg';
  }

  const cleanName = filename ? filename.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 30) : 'upload';
  const newFilename = `${cleanName}-${Date.now()}.${ext}`;

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, newFilename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `assets/uploads/${newFilename}`;
    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: publicUrl,
      filename: newFilename
    });
  } catch (err) {
    console.warn("Filesystem write warning:", err.message);
    return res.json({
      success: true,
      message: 'Image processed successfully',
      url: image,
      filename: newFilename
    });
  }
});

// --- PRODUCTS API ---

// Public read products
app.get('/api/products', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  const products = readJSON(PRODUCTS_FILE, []);
  res.json({ success: true, count: products.length, data: products });
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

// Protected: Bulk Add Products (Admin only)
app.post('/api/products/bulk', requireAdmin, (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of products is required' });
  }

  const existing = readJSON(PRODUCTS_FILE, []);
  const added = [];

  products.forEach((p, idx) => {
    if (!p.name || (!p.price && p.price !== 0)) return;
    const newProd = {
      id: `prod-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      name: String(p.name).trim(),
      hindiName: String(p.hindiName || p['hindi name'] || p['Hindi Name'] || '').trim(),
      category: String(p.category || 'stationery').toLowerCase().trim(),
      subcategory: String(p.subcategory || p['subcategory'] || p['Subcategory'] || '').trim(),
      price: Number(p.price) || 0,
      originalPrice: Number(p.originalPrice || p['original price'] || p['Original Price'] || Number(p.price) * 1.5) || 0,
      rating: 5.0,
      reviewsCount: 1,
      image: p.image || p['image url'] || p['Image URL'] || 'assets/images/kawaii_stationery.jpg',
      badge: p.badge || p['Badge'] || 'New Arrival',
      customizable: Boolean(p.customizable === true || p.customizable === 'true' || p.customizable === 'yes' || p.customizable === 1),
      customType: p.customType || p['custom type'] || 'stationery',
      description: String(p.description || '').trim(),
      specs: Array.isArray(p.specs) ? p.specs : (p.specs ? String(p.specs).split(',').map(s => s.trim()) : []),
      inStock: p.inStock !== undefined ? (p.inStock === true || p.inStock === 'true' || p.inStock === 'yes' || p.inStock === 1) : true
    };
    added.push(newProd);
    existing.unshift(newProd);
  });

  writeJSON(PRODUCTS_FILE, existing);
  res.status(201).json({
    success: true,
    message: `Successfully imported ${added.length} products into catalogue!`,
    count: added.length,
    data: added
  });
});

// Protected: Add single product (Admin only)
app.post('/api/products', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const { name, hindiName, category, price, originalPrice, image, images, badge, customizable, customType, description, specs, inStock } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }

  const primaryImage = image || (Array.isArray(images) && images[0]) || 'assets/images/kawaii_stationery.jpg';
  const allImages = Array.isArray(images) && images.length > 0 ? images : [primaryImage];

  const newProduct = {
    id: `prod-${Date.now()}`,
    name: name.trim(),
    hindiName: (hindiName || '').trim(),
    category: category || 'stationery',
    subcategory: (req.body.subcategory || '').trim(),
    price: Number(price),
    originalPrice: Number(originalPrice || price * 1.5),
    rating: 5.0,
    reviewsCount: 1,
    image: primaryImage,
    images: allImages,
    badge: badge || 'New Kawaii',
    customizable: Boolean(customizable),
    customType: customType || 'stationery',
    description: (description || '').trim(),
    specs: Array.isArray(specs) ? specs : (specs ? specs.split(',').map(s => s.trim()) : []),
    inStock: inStock !== undefined ? Boolean(inStock) : true
  };

  products.unshift(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.status(201).json({ success: true, message: 'Product added successfully', data: newProduct });
});

// Protected: Update product (Admin only)
app.put('/api/products/:id', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Product not found' });

  const primaryImg = req.body.image || (Array.isArray(req.body.images) && req.body.images[0]) || products[index].image;
  const allImgs = Array.isArray(req.body.images) && req.body.images.length > 0 ? req.body.images : (products[index].images || [primaryImg]);

  const updated = {
    ...products[index],
    ...req.body,
    image: primaryImg,
    images: allImgs,
    price: req.body.price ? Number(req.body.price) : products[index].price,
    originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : products[index].originalPrice,
    specs: Array.isArray(req.body.specs) ? req.body.specs : (typeof req.body.specs === 'string' ? req.body.specs.split(',').map(s => s.trim()) : products[index].specs)
  };

  products[index] = updated;
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product updated successfully', data: updated });
});

// Protected: Toggle Stock (Admin only)
app.patch('/api/products/:id/stock', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  product.inStock = req.body.inStock !== undefined ? Boolean(req.body.inStock) : !product.inStock;
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true, message: `Product stock changed to ${product.inStock}`, data: product });
});

// Protected: Bulk Edit & Bulk Delete Products (Admin only)
app.post('/api/products/bulk-edit', requireAdmin, (req, res) => {
  const { ids, updates = {}, action = 'update' } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of product IDs is required' });
  }

  let products = readJSON(PRODUCTS_FILE, []);

  if (action === 'delete') {
    const initialCount = products.length;
    products = products.filter(p => !ids.includes(p.id));
    const deletedCount = initialCount - products.length;
    writeJSON(PRODUCTS_FILE, products);
    return res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} products from catalogue`,
      deletedCount
    });
  }

  let modifiedCount = 0;
  products = products.map(product => {
    if (!ids.includes(product.id)) return product;
    modifiedCount++;

    const updated = { ...product };

    if (updates.category && updates.category !== 'keep') {
      updated.category = String(updates.category).toLowerCase().trim();
    }
    if (updates.badge !== undefined && updates.badge !== 'keep') {
      updated.badge = String(updates.badge).trim();
    }
    if (updates.inStock !== undefined && updates.inStock !== 'keep') {
      updated.inStock = Boolean(updates.inStock === true || updates.inStock === 'true' || updates.inStock === 1);
    }

    if (updates.priceAction === 'set' && updates.priceValue !== undefined && updates.priceValue !== '') {
      const newPrice = Math.max(1, Number(updates.priceValue));
      updated.price = newPrice;
      if (!updates.originalPriceValue && (!updated.originalPrice || updated.originalPrice < newPrice)) {
        updated.originalPrice = Math.round(newPrice * 1.5);
      }
    } else if (updates.priceAction === 'discount_percent' && updates.priceValue) {
      const discountPct = Number(updates.priceValue) / 100;
      updated.originalPrice = updated.price;
      updated.price = Math.max(1, Math.round(updated.price * (1 - discountPct)));
    } else if (updates.priceAction === 'increase_percent' && updates.priceValue) {
      const incPct = Number(updates.priceValue) / 100;
      updated.price = Math.round(updated.price * (1 + incPct));
    }

    if (updates.originalPriceValue && updates.originalPriceValue !== '') {
      updated.originalPrice = Math.max(1, Number(updates.originalPriceValue));
    }

    return updated;
  });

  writeJSON(PRODUCTS_FILE, products);
  res.json({
    success: true,
    message: `Successfully updated ${modifiedCount} products!`,
    modifiedCount,
    data: products
  });
});

// Protected: Delete product (Admin only)
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  let products = readJSON(PRODUCTS_FILE, []);
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ success: false, message: 'Product not found' });

  products = products.filter(p => p.id !== req.params.id);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// --- ORDERS API ---

// Protected: View Orders (Admin only)
app.get('/api/orders', requireAdmin, (req, res) => {
  const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
  res.json({ success: true, count: orders.length, data: orders });
});

// Public: Log Order from checkout or manual entry
app.post('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
  const newOrder = {
    id: req.body.id || `ORD-${Date.now().toString().slice(-4)}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    customer: req.body.customer || {},
    items: req.body.items || [],
    subtotal: req.body.subtotal || req.body.total || 0,
    discount: req.body.discount || 0,
    total: req.body.total || 0,
    status: req.body.status || 'Confirmed'
  };
  orders.unshift(newOrder);
  writeJSON(ORDERS_FILE, orders);
  res.status(201).json({ success: true, message: 'Order recorded', data: newOrder });
});

app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  order.status = req.body.status || order.status;
  order.updatedAt = new Date().toISOString();
  writeJSON(ORDERS_FILE, orders);
  res.json({ success: true, message: 'Order status updated', data: order });
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  let orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
  const initialLength = orders.length;
  orders = orders.filter(o => o.id !== req.params.id);
  if (orders.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  writeJSON(ORDERS_FILE, orders);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// --- SETTINGS API ---
app.get('/api/settings', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  const settings = readJSON(SETTINGS_FILE, {
    storeName: "Chintu's Gift & Kawaii Store",
    phone: "8269212182",
    displayPhone: "+91 82692 12182",
    whatsapp: "918269212182",
    address: "Shop No. 2 (House 01), Shubhash Chowk, Near Bharat Petroleum, Ward Number 19, Dalli Rajhara, Chhattisgarh 491228",
    announcement: "🌸 Cute Offer: Use Code CHINTU10 for 10% OFF | Free Home Delivery across Dalli Rajhara | WhatsApp: 8269212182 ✨",
    openTime: "10:30",
    closeTime: "20:30",
    closedDay: 2,
    authorizedAdminEmail: process.env.ADMIN_GOOGLE_EMAIL || ""
  });
  res.json({ success: true, data: settings });
});

// Protected: Save settings (Admin only)
app.post('/api/settings', requireAdmin, (req, res) => {
  const current = readJSON(SETTINGS_FILE, {});
  const storeName = req.body.storeName || req.body.name || current.storeName || current.name || "Chintu's Gift & Kawaii Store";
  const updated = {
    ...current,
    ...req.body,
    storeName: storeName,
    name: storeName,
    phone: "8269212182",
    displayPhone: "+91 82692 12182",
    whatsapp: "918269212182",
    updatedAt: new Date().toISOString()
  };
  writeJSON(SETTINGS_FILE, updated);
  res.json({ success: true, message: 'Settings saved successfully', data: updated });
});

// --- CATEGORIES API ---
app.get('/api/categories', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  const categories = readJSON(CATEGORIES_FILE, []);
  const products = readJSON(PRODUCTS_FILE, []);
  
  // Dynamically compute real-time product count for each category
  const enriched = categories.map(cat => {
    const count = products.filter(p => p.category === cat.id).length;
    return { ...cat, itemCount: count };
  });

  res.json({ success: true, count: enriched.length, data: enriched });
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, []);
  const { name, hindiName, icon, image, tagline, subcategories } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const id = (req.body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`);
  
  if (categories.some(c => c.id === id)) {
    return res.status(400).json({ success: false, message: 'Category with this ID already exists' });
  }

  let subcatArray = [];
  if (Array.isArray(subcategories)) {
    subcatArray = subcategories.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof subcategories === 'string') {
    subcatArray = subcategories.split(',').map(s => s.trim()).filter(Boolean);
  }

  const newCat = {
    id,
    name: name.trim(),
    hindiName: (hindiName || '').trim(),
    icon: icon || '🎁',
    image: image || 'assets/images/kawaii_stationery.jpg',
    tagline: (tagline || '').trim(),
    subcategories: subcatArray.length > 0 ? subcatArray : ['All Items'],
    itemCount: 0
  };

  categories.push(newCat);
  writeJSON(CATEGORIES_FILE, categories);
  res.status(201).json({ success: true, message: 'Category created successfully', data: newCat });
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, []);
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  let subcatArray = categories[idx].subcategories;
  if (req.body.subcategories !== undefined) {
    if (Array.isArray(req.body.subcategories)) {
      subcatArray = req.body.subcategories.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof req.body.subcategories === 'string') {
      subcatArray = req.body.subcategories.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  categories[idx] = {
    ...categories[idx],
    ...req.body,
    id: categories[idx].id, // preserve ID
    subcategories: subcatArray
  };

  writeJSON(CATEGORIES_FILE, categories);
  res.json({ success: true, message: 'Category updated successfully', data: categories[idx] });
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  let categories = readJSON(CATEGORIES_FILE, []);
  const initialLen = categories.length;
  categories = categories.filter(c => c.id !== req.params.id);
  if (categories.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  writeJSON(CATEGORIES_FILE, categories);
  res.json({ success: true, message: 'Category deleted successfully' });
});

// --- VISITOR TRACKING & TELEGRAM BOT ALERTS API ---
const recentVisitors = [];

async function sendTelegramNotification(text) {
  const settings = readJSON(SETTINGS_FILE, {});
  const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, reason: 'Telegram bot token or chat ID not configured' };
  }

  try {
    const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(chatId).trim(),
        text: text,
        parse_mode: 'Markdown'
      })
    });
    const resData = await response.json();
    return { success: resData.ok, data: resData };
  } catch (err) {
    console.error('Telegram send error:', err.message);
    return { success: false, error: err.message };
  }
}

app.post('/api/track-visitor', (req, res) => {
  const { page, path, referrer, device, isNewSession } = req.body || {};

  const record = {
    id: `vis-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    time: new Date().toISOString(),
    timestamp: Date.now(),
    page: String(page || 'Storefront').slice(0, 100),
    path: String(path || '/').slice(0, 150),
    referrer: String(referrer || 'Direct').slice(0, 150),
    device: String(device || 'Mobile').slice(0, 50),
    isNewSession: Boolean(isNewSession)
  };

  recentVisitors.unshift(record);
  if (recentVisitors.length > 50) recentVisitors.pop();

  // If this is a fresh session / new visitor, trigger instant Telegram Alert!
  if (isNewSession) {
    const istTime = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const telegramText = 
      `🔔 *NEW VISITOR ON CHINTU'S GIFT STORE!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *Page:* ${record.page}\n` +
      `🔗 *Path:* \`${record.path}\`\n` +
      `📱 *Device:* ${record.device}\n` +
      `🌐 *Source:* ${record.referrer || 'Direct / Social'}\n` +
      `⏰ *Time:* ${istTime} (IST)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏪 *Store:* Subhash Chowk, Dalli Rajhara`;

    sendTelegramNotification(telegramText).catch(e => console.error("Telegram notification error:", e));
  }

  res.json({ success: true });
});

app.get('/api/live-visitors', (req, res) => {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const activeVisitors = recentVisitors.filter(v => v.timestamp > fiveMinAgo);

  res.json({
    success: true,
    activeCount: Math.max(1, activeVisitors.length),
    totalRecent: recentVisitors.length,
    visitors: recentVisitors.slice(0, 15)
  });
});

app.post('/api/telegram/test', requireAdmin, async (req, res) => {
  const { token, chatId } = req.body || {};
  const settings = readJSON(SETTINGS_FILE, {});
  const effectiveToken = token || settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const effectiveChatId = chatId || settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;

  if (!effectiveToken || !effectiveChatId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide Telegram Bot Token and Chat ID to send test message.'
    });
  }

  const testText = 
    `🌸 *TEST NOTIFICATION - CHINTU'S GIFT STORE*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ *Telegram Visitor Alerts are Working 100%!* \n` +
    `You will receive instant alerts here whenever a new customer opens your website.\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏪 *Store:* Subhash Chowk, Dalli Rajhara • 8269212182`;

  try {
    const url = `https://api.telegram.org/bot${effectiveToken.trim()}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(effectiveChatId).trim(),
        text: testText,
        parse_mode: 'Markdown'
      })
    });
    const resData = await response.json();
    if (resData.ok) {
      res.json({ success: true, message: 'Test message sent to your Telegram successfully! Check your Telegram app 🔔' });
    } else {
      res.status(400).json({ success: false, message: resData.description || 'Telegram API error' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/telegram/detect', requireAdmin, async (req, res) => {
  const { token } = req.body || {};
  const settings = readJSON(SETTINGS_FILE, {});
  const effectiveToken = (token || settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "").trim();

  if (!effectiveToken) {
    return res.status(400).json({
      success: false,
      message: 'Please provide Telegram Bot Token'
    });
  }

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${effectiveToken}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Bot Token: ' + (meData.description || 'Unauthorized')
      });
    }

    const updRes = await fetch(`https://api.telegram.org/bot${effectiveToken}/getUpdates?limit=20`);
    const updData = await updRes.json();
    let detectedChatId = null;
    let senderName = null;

    if (updData.ok && Array.isArray(updData.result) && updData.result.length > 0) {
      for (let i = updData.result.length - 1; i >= 0; i--) {
        const u = updData.result[i];
        const msg = u.message || u.channel_post || u.my_chat_member;
        if (msg && msg.chat && msg.chat.id) {
          detectedChatId = msg.chat.id;
          senderName = msg.chat.first_name || msg.chat.username || msg.chat.title || 'User';
          break;
        }
      }
    }

    res.json({
      success: true,
      bot: meData.result,
      detectedChatId,
      senderName,
      message: detectedChatId
        ? `Found Chat ID: ${detectedChatId} (${senderName})`
        : `Bot verified (@${meData.result.username}), but no message received yet. Please open t.me/${meData.result.username} and tap START.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve Static Files
app.use(express.static(__dirname));

// Route to Admin Panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Route to Category Page
app.get('/category', (req, res) => {
  res.sendFile(path.join(__dirname, 'category.html'));
});

// Fallback to customer index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Chintu's Kawaii Gift Store server is running on http://localhost:${PORT}`);
    console.log(`🧸 Admin Login Portal: http://localhost:${PORT}/admin`);
  });
}

module.exports = app;
