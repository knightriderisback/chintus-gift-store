const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');
const CATEGORIES_FILE = path.join(__dirname, '..', 'data', 'categories.json');

// Default Fallback Data if files unavailable in Serverless environment
const DEFAULT_PRODUCTS = [
  {
    "id": "prod-1",
    "name": "Pink Acrylic 3D Heart Bear LED Illusion Lamp",
    "hindiName": "पिंक एक्रिलिक 3D हार्ट बियर LED लैंप (नाम सहित)",
    "category": "personalized",
    "price": 699,
    "originalPrice": 1299,
    "rating": 4.9,
    "reviewsCount": 42,
    "image": "assets/images/pink_acrylic_lamp.jpg",
    "badge": "Kawaii Hot",
    "customizable": true,
    "customType": "lamp",
    "description": "Premium laser-cut frosted pink acrylic night lamp featuring an adorable cartoon bear hugging an illuminated glowing heart. Custom name and anniversary/birthday date engraved. Multi-color warm pastel glow with touch switch.",
    "specs": ["Cast Pink Frosted Acrylic 5mm", "Soft Touch Pastel Base", "Warm Golden / Soft Pink LED", "USB Powered (5V)", "Dimensions: 7.5 x 8 inches"],
    "inStock": true
  },
  {
    "id": "prod-2",
    "name": "Pastel Aesthetic Highlighters & Kawaii Diary Gift Set",
    "hindiName": "पेस्टेल हाइलाइटर्स और कवाई लॉक्ड डायरी सेट",
    "category": "stationery",
    "price": 499,
    "originalPrice": 899,
    "rating": 4.9,
    "reviewsCount": 58,
    "image": "assets/images/kawaii_stationery.jpg",
    "badge": "Bestseller",
    "customizable": false,
    "description": "Complete dream stationery hamper! Includes 1 pastel hardcover secret diary with golden lock and key, 4 cute bear-shaped pastel highlighters, 6 roll decorative washi tapes, sticky notes, and aesthetic sticker sheets.",
    "specs": ["Diary with Solid Metal Lock & 2 Keys", "4 Bear Pastel Highlighters", "6 Washi Tape Rolls", "3 Kawaii Sticker Sheets"],
    "inStock": true
  },
  {
    "id": "prod-3",
    "name": "Giant 3-Foot Blush Pink Cuddle Teddy Bear",
    "hindiName": "3-फुट ब्लश पिंक सुपर सॉफ्ट टेडी बियर",
    "category": "toys",
    "price": 899,
    "originalPrice": 1599,
    "rating": 5.0,
    "reviewsCount": 67,
    "image": "https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80",
    "badge": "Super Huggable",
    "customizable": false,
    "description": "Ultra-soft micro-plush giant teddy bear in gentle pastel blush pink. Stuffed with 100% hypoallergenic virgin PP cotton. Perfect for birthday surprises, Valentine's gifts, and cozy bedroom decor.",
    "specs": ["Height: 90 cm (3 Feet)", "Ultra-soft Velvet Plush", "100% Non-toxic PP Cotton", "Satin Bow Ribbon Included"],
    "inStock": true
  },
  {
    "id": "prod-4",
    "name": "Cute Boba Milk Tea Squishy Plushie (Large)",
    "hindiName": "क्यूट बोबा मिल्क टी स्क्विशी प्लशी",
    "category": "toys",
    "price": 399,
    "originalPrice": 699,
    "rating": 4.8,
    "reviewsCount": 49,
    "image": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
    "badge": "Trending",
    "customizable": false,
    "description": "Viral sweet smiling Boba cup plushie with embroidered tapioca pearls and cute 3D straw. Super squishy stress-relief companion for desks and beds.",
    "specs": ["Size: 35 cm", "Super Elastic Spandex Plush", "Down Cotton Filling", "Machine Washable"],
    "inStock": true
  },
  {
    "id": "prod-5",
    "name": "Pastel Dual-Tip Aesthetic Highlighters (Pack of 6)",
    "hindiName": "पेस्टेल डुअल-टिप एस्थेटिक हाइलाइटर्स (6 का पैक)",
    "category": "stationery",
    "price": 249,
    "originalPrice": 449,
    "rating": 4.8,
    "reviewsCount": 35,
    "image": "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80",
    "badge": "Study Must",
    "customizable": false,
    "description": "Japanese style non-bleed soft pastel highlighters in dreamy shades: Macaron Pink, Lavender Mist, Mint Green, Butter Yellow, Peach Cream, and Sky Blue. Chisel and fine tips.",
    "specs": ["Set of 6 Pastel Shades", "Dual Chisel & Bullet Tip", "Quick-Dry Anti-Smear Ink", "Clear Acrylic Case"],
    "inStock": true
  },
  {
    "id": "prod-6",
    "name": "Photo Magic Color-Changing Ceramic Mug",
    "hindiName": "फोटो मैजिक कलर-चेंजिंग सेरामिक मग",
    "category": "personalized",
    "price": 349,
    "originalPrice": 599,
    "rating": 4.9,
    "reviewsCount": 51,
    "image": "assets/images/product_mug.jpg",
    "badge": "Magic Gift",
    "customizable": true,
    "customType": "mug",
    "description": "Black ceramic mug that magically reveals your uploaded photo and cute cartoon greetings when hot chai, coffee, or milk is poured! Food safe and microwave safe.",
    "specs": ["325ml Premium Ceramic", "Thermosensitive High Gloss Coat", "Microwave & Dishwasher Safe", "Custom Photo Print"],
    "inStock": true
  },
  {
    "id": "prod-7",
    "name": "Kawaii Sanrio Plush Head Retractable Gel Pens (Set of 4)",
    "hindiName": "कवाई प्लश हेड जेल पेन्स (4 का सेट)",
    "category": "stationery",
    "price": 199,
    "originalPrice": 349,
    "rating": 4.9,
    "reviewsCount": 62,
    "image": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80",
    "badge": "Super Cute",
    "customizable": false,
    "description": "Smooth 0.5mm black gel pens topped with super cute mini plush heads of bunnies, kitties, and bears. Smooth smudge-free writing for students and office notes.",
    "specs": ["4 Different Kawaii Toppers", "0.5mm Japanese Black Gel Ink", "Comfort Soft Grip", "Refillable Body"],
    "inStock": true
  },
  {
    "id": "prod-8",
    "name": "Personalized Pink Acrylic Spotify Song Plaque with Stand",
    "hindiName": "पर्सनलाइज्ड पिंक एक्रिलिक स्पॉटिफाई म्यूजिक प्लेक",
    "category": "personalized",
    "price": 499,
    "originalPrice": 899,
    "rating": 4.9,
    "reviewsCount": 44,
    "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
    "badge": "Top Romantic",
    "customizable": true,
    "customType": "plaque",
    "description": "Crystal acrylic glass with gentle rose-tinted edge, scannable Spotify song code, couple photo, and your song title. Plays your song directly on phone camera scan!",
    "specs": ["Cast Acrylic Plaque 6x8 Inch", "UV High-Def Color Printing", "Natural Solid Pine Stand", "Scannable Working Spotify Barcode"],
    "inStock": true
  },
  {
    "id": "prod-9",
    "name": "Sweet Kawaii Birthday Explosion Surprise Box with Plushie",
    "hindiName": "स्वीट कवाई बर्थडे एक्सप्लोजन बॉक्स विथ प्लशी",
    "category": "birthday",
    "price": 549,
    "originalPrice": 999,
    "rating": 4.9,
    "reviewsCount": 39,
    "image": "assets/images/birthday_hampers.jpg",
    "badge": "Surprise Box",
    "customizable": true,
    "customType": "box",
    "description": "Multi-layer pastel explosion box packed with 24 photo slots, pop-up heartfelt cartoon greeting cards, assorted chocolates, and a center cute mini teddy bear surprise!",
    "specs": ["Handmade Thick Pastel Cardstock", "3 Pop-Open Cascading Layers", "Center Pocket with Mini Teddy", "Includes 24 Photo Slots"],
    "inStock": true
  },
  {
    "id": "prod-10",
    "name": "Kawaii Bear Cartoon Sipper Water Bottle (800ml)",
    "hindiName": "कवाई बियर सिपर बोतल विथ स्ट्रैप (800ml)",
    "category": "novelties",
    "price": 349,
    "originalPrice": 599,
    "rating": 4.8,
    "reviewsCount": 41,
    "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
    "badge": "Trendy",
    "customizable": false,
    "description": "Chubby cartoon bear shaped water bottle with silicone pop-up straw, leak-proof lock, motivational time markers, and cute adjustable rainbow shoulder carrying strap.",
    "specs": ["800ml Capacity", "BPA-Free Food Grade Tritan", "Pop-up Soft Silicone Straw", "Adjustable Shoulder Strap"],
    "inStock": true
  },
  {
    "id": "prod-11",
    "name": "Super Fluffy Bunny Long-Ear Soft Plushie",
    "hindiName": "सुपर फ्लफी लॉन्ग-इयर बन्नी प्लशी (पिंक)",
    "category": "toys",
    "price": 449,
    "originalPrice": 799,
    "rating": 5.0,
    "reviewsCount": 53,
    "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80",
    "badge": "Fan Favorite",
    "customizable": false,
    "description": "Silky soft pastel pink bunny with extra-long floppy ears and embroidered smiling face. Washable and irresistible to cuddle for kids and girls.",
    "specs": ["Size: 40 cm", "Silky Cloud Velvet", "Safety Embroidered Eyes", "Washable Fabric"],
    "inStock": true
  },
  {
    "id": "prod-12",
    "name": "Multi-Layer Pastel Desk Organizer with Mini Drawers",
    "hindiName": "पेस्टेल डेस्क ऑर्गेनाइज़र विथ ड्रावर्स",
    "category": "stationery",
    "price": 399,
    "originalPrice": 699,
    "rating": 4.8,
    "reviewsCount": 28,
    "image": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80",
    "badge": "Organize",
    "customizable": false,
    "description": "Cute pastel pink acrylic desk caddy with 6 compartments and 2 pull-out clear drawers. Keeps your pens, highlighters, tapes, clips, and cosmetics neat and aesthetic.",
    "specs": ["High Impact Pink Acrylic/ABS", "2 Transparent Mini Drawers", "6 Pen & Brush Slots", "Non-Slip Base Feet"],
    "inStock": true
  },
  {
    "id": "prod-13",
    "name": "Enchanted Rose with Glass Dome & Fairy Lights",
    "hindiName": "एन्चांटेड रोज विथ ग्लास डोम और फेयरी लाइट्स",
    "category": "birthday",
    "price": 499,
    "originalPrice": 899,
    "rating": 4.9,
    "reviewsCount": 47,
    "image": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    "badge": "Romantic",
    "customizable": false,
    "description": "Timeless 24K gold foil rose encased inside a clear glass dome surrounded by warm micro fairy LED string lights. Operates on 3 AAA batteries.",
    "specs": ["Borosilicate Glass Dome", "24K Gold Foil Plated Rose", "Micro Copper String LEDs", "Wood Texture Base"],
    "inStock": true
  },
  {
    "id": "prod-14",
    "name": "Customized Cute Pink Acrylic Name & Charm Keychain",
    "hindiName": "कस्टम क्यूट पिंक एक्रिलिक नाम और चार्म कीचेन",
    "category": "personalized",
    "price": 199,
    "originalPrice": 399,
    "rating": 4.9,
    "reviewsCount": 73,
    "image": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80",
    "badge": "Pocket Cute",
    "customizable": true,
    "customType": "keychain",
    "description": "Laser-cut 3D pink frosted acrylic keychain customized with your name or nickname, adorned with a pastel star charm and golden key ring clasp.",
    "specs": ["4mm Pink Cast Acrylic", "Golden Lobster Swivel Clasp", "Permanent Laser Engraved Name", "Mini Acrylic Charm Included"],
    "inStock": true
  },
  {
    "id": "prod-15",
    "name": "Cute Cartoon Plush Headband & Hair Scrunchie Set",
    "hindiName": "क्यूट कार्टून प्लश हेडबैंड और हेयर स्क्रंची सेट",
    "category": "novelties",
    "price": 149,
    "originalPrice": 299,
    "rating": 4.8,
    "reviewsCount": 38,
    "image": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    "badge": "Girl Favorite",
    "customizable": false,
    "description": "Super soft elastic makeup & skincare headband with plush bear ears plus 2 pastel satin cloud hair scrunchies. Ultra comfortable and fashionable.",
    "specs": ["Elastic Soft Microfiber", "3D Cute Plush Bear Ears", "Includes 2 Pastel Scrunchies", "Gentle on Hair"],
    "inStock": true
  },
  {
    "id": "prod-16",
    "name": "Ultimate Kawaii Birthday Celebration Hamper Basket",
    "hindiName": "अल्टीमेट कवाई बर्थडे सेलिब्रेशन हैंपर बास्केट",
    "category": "birthday",
    "price": 999,
    "originalPrice": 1799,
    "rating": 5.0,
    "reviewsCount": 61,
    "image": "assets/images/kawaii_hero.jpg",
    "badge": "Mega Hamper",
    "customizable": true,
    "customType": "hamper",
    "description": "The showstopper gift basket! Contains 1 Fluffy Bunny Plushie, 1 Pastel Locked Diary, 1 Magic Mug with custom photo, 1 Kawaii Gel Pen, assorted chocolates, fairy lights, and a customized greeting card.",
    "specs": ["Pastel Acrylic Gift Basket", "Plushie + Mug + Diary + Pen", "Includes Fairy Lights & Chocolates", "Free Handwritten Greeting Card"],
    "inStock": true
  }
];

// Dynamically sync products from data/products.json if available
try {
  if (fs.existsSync(PRODUCTS_FILE)) {
    const loadedProds = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    if (Array.isArray(loadedProds) && loadedProds.length > 0) {
      DEFAULT_PRODUCTS.length = 0;
      DEFAULT_PRODUCTS.push(...loadedProds);
    }
  }
} catch (_) {}

// Load rich default orders from data/orders.json
let DEFAULT_ORDERS = [];
try {
  if (fs.existsSync(ORDERS_FILE)) {
    DEFAULT_ORDERS = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  }
} catch (_) {}

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

function getTmpFile(file) {
  if (file === PRODUCTS_FILE) return TMP_PRODUCTS;
  if (file === ORDERS_FILE) return TMP_ORDERS;
  if (file === SETTINGS_FILE) return TMP_SETTINGS;
  if (file === CATEGORIES_FILE) return TMP_CATEGORIES;
  return null;
}

function readData(file, defaultVal) {
  if (file === PRODUCTS_FILE && memoryCache.products) return memoryCache.products;
  if (file === ORDERS_FILE && memoryCache.orders) return memoryCache.orders;
  if (file === SETTINGS_FILE && memoryCache.settings) return memoryCache.settings;
  if (file === CATEGORIES_FILE && memoryCache.categories) return memoryCache.categories;

  // 1. Check /tmp first for runtime state persistence across requests in serverless
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

  // 2. Fall back to bundled data file
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (file === PRODUCTS_FILE) memoryCache.products = data;
      if (file === ORDERS_FILE) memoryCache.orders = data;
      if (file === SETTINGS_FILE) memoryCache.settings = data;
      if (file === CATEGORIES_FILE) memoryCache.categories = data;
      return data;
    }
  } catch (_) {}

  return defaultVal;
}

function writeData(file, data) {
  if (file === PRODUCTS_FILE) memoryCache.products = data;
  if (file === ORDERS_FILE) memoryCache.orders = data;
  if (file === SETTINGS_FILE) memoryCache.settings = data;
  if (file === CATEGORIES_FILE) memoryCache.categories = data;

  // 1. Try to write to project file
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}

  // 2. Try to write to /tmp file (writable in AWS Lambda & Vercel serverless)
  const tmpFile = getTmpFile(file);
  if (tmpFile) {
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (_) {}
  }

  return true;
}

// Auth Middleware
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

// Auth Endpoint
app.post('/api/auth/google', (req, res) => {
  let { email, name, picture, masterCode, credential } = req.body;
  const settings = readData(SETTINGS_FILE, {
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
      writeData(SETTINGS_FILE, settings);
    }
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
        message: `Access Denied: Google account (${email}) is NOT authorized. Only the store owner account (${settings.authorizedAdminEmail}) is permitted. You can also log in using the Master PIN.`
      });
    }
  } else {
    // Register the first Google login as authorized admin owner
    settings.authorizedAdminEmail = cleanEmail;
    writeData(SETTINGS_FILE, settings);
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
  const settings = readData(SETTINGS_FILE, {});
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
  const settings = readData(SETTINGS_FILE, {});
  settings.googleClientId = clientId.trim();
  writeData(SETTINGS_FILE, settings);
  res.json({ success: true, message: 'Google Client ID saved successfully', googleClientId: settings.googleClientId });
});

// Protected: Image Upload Endpoint (Admin Only)
app.post('/api/upload', requireAdmin, (req, res) => {
  const { image, filename } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: 'Image data is required' });
  }

  const uploadsDir = path.join(__dirname, '..', 'assets', 'uploads');
  
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

// Products Endpoints
app.get('/api/products', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  const products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  res.json({ success: true, count: products.length, data: products });
});

app.get('/api/products/:id', (req, res) => {
  const products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
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

  const existing = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
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

  writeData(PRODUCTS_FILE, existing);
  res.status(201).json({
    success: true,
    message: `Successfully imported ${added.length} products into catalogue!`,
    count: added.length,
    data: added
  });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
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
  writeData(PRODUCTS_FILE, products);
  res.status(201).json({ success: true, message: 'Product added successfully', data: newProduct });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
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
  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product updated successfully', data: updated });
});

app.patch('/api/products/:id/stock', requireAdmin, (req, res) => {
  const products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  product.inStock = req.body.inStock !== undefined ? Boolean(req.body.inStock) : !product.inStock;
  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, message: `Product stock changed to ${product.inStock}`, data: product });
});

// Protected: Bulk Edit & Bulk Delete Products (Admin only)
app.post('/api/products/bulk-edit', requireAdmin, (req, res) => {
  const { ids, updates = {}, action = 'update' } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of product IDs is required' });
  }

  let products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);

  if (action === 'delete') {
    const initialCount = products.length;
    products = products.filter(p => !ids.includes(p.id));
    const deletedCount = initialCount - products.length;
    writeData(PRODUCTS_FILE, products);
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

  writeData(PRODUCTS_FILE, products);
  res.json({
    success: true,
    message: `Successfully updated ${modifiedCount} products!`,
    modifiedCount,
    data: products
  });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  let products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ success: false, message: 'Product not found' });

  products = products.filter(p => p.id !== req.params.id);
  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// Orders Endpoints
app.get('/api/orders', requireAdmin, (req, res) => {
  const orders = readData(ORDERS_FILE, DEFAULT_ORDERS);
  res.json({ success: true, count: orders.length, data: orders });
});

app.post('/api/orders', (req, res) => {
  const orders = readData(ORDERS_FILE, DEFAULT_ORDERS);
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
  writeData(ORDERS_FILE, orders);
  res.status(201).json({ success: true, message: 'Order recorded', data: newOrder });
});

app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const orders = readData(ORDERS_FILE, DEFAULT_ORDERS);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  order.status = req.body.status || order.status;
  order.updatedAt = new Date().toISOString();
  writeData(ORDERS_FILE, orders);
  res.json({ success: true, message: 'Order status updated', data: order });
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  let orders = readData(ORDERS_FILE, DEFAULT_ORDERS);
  const initialLength = orders.length;
  orders = orders.filter(o => o.id !== req.params.id);
  if (orders.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  writeData(ORDERS_FILE, orders);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// Settings Endpoints
app.get('/api/settings', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  const settings = readData(SETTINGS_FILE, {
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

app.post('/api/settings', requireAdmin, (req, res) => {
  const current = readData(SETTINGS_FILE, {});
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
  writeData(SETTINGS_FILE, updated);
  res.json({ success: true, message: 'Settings saved successfully', data: updated });
});

// Categories Endpoints
app.get('/api/categories', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  const categories = readData(CATEGORIES_FILE, []);
  const products = readData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  
  // Dynamically compute real-time product count for each category
  const enriched = categories.map(cat => {
    const count = products.filter(p => p.category === cat.id).length;
    return { ...cat, itemCount: count };
  });

  res.json({ success: true, count: enriched.length, data: enriched });
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const categories = readData(CATEGORIES_FILE, []);
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
  writeData(CATEGORIES_FILE, categories);
  res.status(201).json({ success: true, message: 'Category created successfully', data: newCat });
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const categories = readData(CATEGORIES_FILE, []);
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

  writeData(CATEGORIES_FILE, categories);
  res.json({ success: true, message: 'Category updated successfully', data: categories[idx] });
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  let categories = readData(CATEGORIES_FILE, []);
  const initialLen = categories.length;
  categories = categories.filter(c => c.id !== req.params.id);
  if (categories.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  writeData(CATEGORIES_FILE, categories);
  res.json({ success: true, message: 'Category deleted successfully' });
});

// --- VISITOR TRACKING & TELEGRAM BOT ALERTS API ---
const recentVisitors = [];

async function sendTelegramNotification(text) {
  const settings = readData(SETTINGS_FILE, {});
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
  const settings = readData(SETTINGS_FILE, {});
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

module.exports = app;
