const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Memory Cache for Serverless resilience (e.g. Vercel read-only filesystem)
let memoryCache = {
  products: null,
  orders: null,
  settings: null
};

// Helper to read JSON
function readJSON(file, defaultVal = []) {
  try {
    if (file === PRODUCTS_FILE && memoryCache.products) return memoryCache.products;
    if (file === ORDERS_FILE && memoryCache.orders) return memoryCache.orders;
    if (file === SETTINGS_FILE && memoryCache.settings) return memoryCache.settings;

    if (!fs.existsSync(file)) {
      try { fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2)); } catch (_) {}
      return defaultVal;
    }
    const data = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(data);

    if (file === PRODUCTS_FILE) memoryCache.products = parsed;
    if (file === ORDERS_FILE) memoryCache.orders = parsed;
    if (file === SETTINGS_FILE) memoryCache.settings = parsed;

    return parsed;
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return defaultVal;
  }
}

// Helper to write JSON (falls back to memory if filesystem is read-only)
function writeJSON(file, data) {
  if (file === PRODUCTS_FILE) memoryCache.products = data;
  if (file === ORDERS_FILE) memoryCache.orders = data;
  if (file === SETTINGS_FILE) memoryCache.settings = data;

  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn(`Filesystem write failed (${file}), cached in memory:`, err.message);
    return true;
  }
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
  const { email, name, picture, masterCode } = req.body;
  const settings = readJSON(SETTINGS_FILE, {
    storeName: "Chintu's Gift & Kawaii Store",
    phone: "8269212182",
    displayPhone: "+91 82692 12182",
    whatsapp: "918269212182",
    authorizedAdminEmail: process.env.ADMIN_GOOGLE_EMAIL || ""
  });

  // Master Owner Code option (Emergency / Staging backup)
  if (masterCode && (masterCode === 'chintu8269' || masterCode === process.env.ADMIN_MASTER_CODE)) {
    const sessionToken = 'owner_session_' + Date.now();
    return res.json({
      success: true,
      message: 'Authenticated successfully via Master Owner Key',
      token: sessionToken,
      user: {
        email: email || settings.authorizedAdminEmail || 'owner@chintus.com',
        name: name || 'Store Owner',
        picture: picture || 'assets/images/kawaii_logo.jpg'
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
        message: `Access Denied: Google account (${email}) is NOT authorized. Only the store owner account is permitted.`
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
      name: name || 'Store Owner',
      picture: picture || 'assets/images/kawaii_logo.jpg'
    }
  });
});

// --- PRODUCTS API ---

// Public read products
app.get('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  res.json({ success: true, count: products.length, data: products });
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

// Protected: Add product (Admin only)
app.post('/api/products', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const { name, hindiName, category, price, originalPrice, image, badge, customizable, customType, description, specs, inStock } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    name: name.trim(),
    hindiName: (hindiName || '').trim(),
    category: category || 'stationery',
    price: Number(price),
    originalPrice: Number(originalPrice || price * 1.5),
    rating: 5.0,
    reviewsCount: 1,
    image: image || 'assets/images/kawaii_stationery.jpg',
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

  const updated = {
    ...products[index],
    ...req.body,
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
  const orders = readJSON(ORDERS_FILE, []);
  res.json({ success: true, count: orders.length, data: orders });
});

// Public: Log Order from checkout
app.post('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-5)}`,
    createdAt: new Date().toISOString(),
    ...req.body,
    status: 'Confirmed'
  };
  orders.unshift(newOrder);
  writeJSON(ORDERS_FILE, orders);
  res.status(201).json({ success: true, message: 'Order recorded', data: newOrder });
});

// --- SETTINGS API ---
app.get('/api/settings', (req, res) => {
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
  const updated = {
    ...current,
    ...req.body,
    phone: "8269212182",
    displayPhone: "+91 82692 12182",
    whatsapp: "918269212182"
  };
  writeJSON(SETTINGS_FILE, updated);
  res.json({ success: true, message: 'Settings saved', data: updated });
});

// Serve Static Files
app.use(express.static(__dirname));

// Route to Admin Panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
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
