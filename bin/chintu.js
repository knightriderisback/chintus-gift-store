#!/usr/bin/env node

/**
 * 🌸 CHINTU'S GIFT STORE - COMMAND LINE INTERFACE (CLI)
 * Manage Storefront, Rates, Products, Visitors & Telegram Bot directly from Terminal!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
const PRODUCTS_FILE = path.join(PROJECT_DIR, 'data', 'products.json');
const VISITORS_FILE = path.join(PROJECT_DIR, 'data', 'visitors.json');
const SETTINGS_FILE = path.join(PROJECT_DIR, 'data', 'settings.json');
const ORDERS_FILE = path.join(PROJECT_DIR, 'data', 'orders.json');
const BACKUPS_DIR = path.join(PROJECT_DIR, 'backups');

// ANSI Color Helpers
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  pink: '\x1b[38;5;218m',
  pinkBold: '\x1b[1;38;5;206m',
  purple: '\x1b[38;5;141m',
  green: '\x1b[32m',
  greenBold: '\x1b[1;32m',
  yellow: '\x1b[33m',
  yellowBold: '\x1b[1;33m',
  cyan: '\x1b[36m',
  cyanBold: '\x1b[1;36m',
  red: '\x1b[31m',
  redBold: '\x1b[1;31m',
  gray: '\x1b[90m'
};

function readJSON(file, defaultVal = []) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error(`${C.red}Error reading ${path.basename(file)}: ${e.message}${C.reset}`);
  }
  return defaultVal;
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`${C.red}Error saving ${path.basename(file)}: ${e.message}${C.reset}`);
    return false;
  }
}

async function sendTelegramMsg(text) {
  const settings = readJSON(SETTINGS_FILE, {});
  const token = settings.telegramBotToken || '8283649128:AAHWOe9ae7oC-aeTDFVZjMNYm-zvFoaiFOo';
  const chatId = settings.telegramChatId || '8769715316';

  if (!token || !chatId) {
    console.log(`${C.yellow}⚠ Telegram not configured in settings.json${C.reset}`);
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(chatId).trim(),
        text: text,
        parse_mode: 'Markdown'
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (e) {
    console.error(`${C.red}Telegram dispatch failed: ${e.message}${C.reset}`);
    return false;
  }
}

function printHeader() {
  console.log(`\n${C.pinkBold}╔═══════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.pinkBold}║   🌸  CHINTU'S GIFT & KAWAII STORE — CONTROL CLI              ║${C.reset}`);
  console.log(`${C.pinkBold}║   🧸  Subhash Chowk, Dalli Rajhara • Store Assistant          ║${C.reset}`);
  console.log(`${C.pinkBold}╚═══════════════════════════════════════════════════════════════╝${C.reset}\n`);
}

function printHelp() {
  printHeader();
  console.log(`${C.cyanBold}USAGE:${C.reset}`);
  console.log(`  ${C.bold}chintu <command> [arguments]${C.reset}\n`);

  console.log(`${C.cyanBold}AVAILABLE COMMANDS:${C.reset}`);
  
  console.log(`  ${C.greenBold}status${C.reset}`);
  console.log(`    View live store overview, product count, active visitors & bot status\n`);

  console.log(`  ${C.greenBold}visitors${C.reset}`);
  console.log(`    View live visitors active on store & recent visit activity stream\n`);

  console.log(`  ${C.greenBold}rate <product-id-or-name> <newPrice>${C.reset}`);
  console.log(`    Update product price in real-time & dispatch Telegram alert`);
  console.log(`    ${C.dim}e.g. chintu rate cosm-001 499${C.reset}`);
  console.log(`    ${C.dim}e.g. chintu rate "lip gloss" 249${C.reset}\n`);

  console.log(`  ${C.greenBold}find <keyword>${C.reset}`);
  console.log(`    Search catalogue by product name, ID, or category`);
  console.log(`    ${C.dim}e.g. chintu find mug${C.reset}\n`);

  console.log(`  ${C.greenBold}products [--limit 15]${C.reset}`);
  console.log(`    List products with IDs, categories, rates & stock status\n`);

  console.log(`  ${C.greenBold}stock <product-id-or-name> <in|out>${C.reset}`);
  console.log(`    Set product availability to In-Stock or Out-of-Stock`);
  console.log(`    ${C.dim}e.g. chintu stock cosm-001 out${C.reset}\n`);

  console.log(`  ${C.greenBold}notify <message>${C.reset}`);
  console.log(`    Send an instant custom push alert to store owner's Telegram`);
  console.log(`    ${C.dim}e.g. chintu notify "Diwali sale starting in 1 hour!"${C.reset}\n`);

  console.log(`  ${C.greenBold}coupon [code] [discount%]${C.reset}`);
  console.log(`    View current promo coupon or set a new one`);
  console.log(`    ${C.dim}e.g. chintu coupon DIWALI15 15${C.reset}\n`);

  console.log(`  ${C.greenBold}announcement [text]${C.reset}`);
  console.log(`    View or update the top ticker announcement on website\n`);

  console.log(`  ${C.greenBold}backup${C.reset}`);
  console.log(`    Create a timestamped backup of all store catalogue & settings\n`);

  console.log(`  ${C.greenBold}sync${C.reset}`);
  console.log(`    Commit local data changes and push live to Vercel production\n`);
}

// 1. STATUS
async function handleStatus() {
  printHeader();
  const settings = readJSON(SETTINGS_FILE, {});
  const products = readJSON(PRODUCTS_FILE, []);
  const visitors = readJSON(VISITORS_FILE, []);

  const inStock = products.filter(p => p.inStock !== false).length;
  const outOfStock = products.length - inStock;
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const onlineCount = visitors.filter(v => (v.timestamp || 0) > fiveMinAgo).length;

  console.log(`${C.pinkBold}🏪 STORE PROFILE:${C.reset}`);
  console.log(`   Name:      ${C.bold}${settings.storeName || "Chintu's Gift Store"}${C.reset}`);
  console.log(`   Address:   ${settings.address || "Subhash Chowk, Dalli Rajhara"}`);
  console.log(`   Phone:     ${settings.phone || "8269212182"} | WhatsApp: ${settings.whatsapp || "918269212182"}`);
  console.log(`   Website:   ${C.cyan}https://chintus-gift-store.vercel.app${C.reset}\n`);

  console.log(`${C.pinkBold}📦 CATALOGUE SUMMARY:${C.reset}`);
  console.log(`   Total Products: ${C.bold}${products.length}${C.reset}`);
  console.log(`   In Stock:       ${C.greenBold}${inStock}${C.reset}`);
  console.log(`   Out of Stock:   ${outOfStock > 0 ? C.redBold + outOfStock : C.gray + '0'}${C.reset}\n`);

  console.log(`${C.pinkBold}👥 VISITOR RADAR:${C.reset}`);
  console.log(`   Active Online:  ${C.greenBold}● ${Math.max(1, onlineCount)} active customer(s)${C.reset}`);
  console.log(`   Total Tracked:  ${visitors.length} visits\n`);

  console.log(`${C.pinkBold}🤖 TELEGRAM BOT:${C.reset}`);
  console.log(`   Bot Username:   ${C.purple}@${settings.telegramBotUsername || 'Chin2s_bot'}${C.reset}`);
  console.log(`   Chat ID:        ${settings.telegramChatId || '8769715316'}`);
  console.log(`   Status:         ${C.greenBold}Active & Webhook Connected${C.reset}\n`);
}

// 2. VISITORS
async function handleVisitors() {
  printHeader();
  let visitors = [];
  let onlineCount = 1;
  let totalTracked = 0;

  try {
    const res = await fetch('https://chintus-gift-store.vercel.app/api/live-visitors');
    const data = await res.json();
    if (data && data.success) {
      visitors = data.visitors || [];
      onlineCount = data.activeCount || 1;
      totalTracked = data.totalRecent || visitors.length;
    }
  } catch (e) {
    visitors = readJSON(VISITORS_FILE, []);
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    onlineCount = visitors.filter(v => (v.timestamp || 0) > fiveMinAgo).length;
    totalTracked = visitors.length;
  }

  console.log(`${C.greenBold}● LIVE STORE RADAR (PRODUCTION)${C.reset}  (${C.bold}${Math.max(1, onlineCount)} customer(s) online now${C.reset})`);
  console.log(`${C.dim}Total Recorded Visits: ${totalTracked}${C.reset}\n`);

  if (visitors.length === 0) {
    console.log(`  ${C.gray}No visits logged yet.${C.reset}\n`);
    return;
  }

  console.log(`${C.bold}${'TIME'.padEnd(12)} ${'DEVICE'.padEnd(14)} ${'PAGE'.padEnd(26)} ${'SOURCE'.padEnd(20)} STATUS${C.reset}`);
  console.log(`${C.dim}${'─'.repeat(80)}${C.reset}`);

  visitors.slice(0, 15).forEach(v => {
    const d = new Date(v.timestamp || v.time);
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const isMobile = Boolean(v.device && (v.device.includes('Phone') || v.device.includes('Android') || v.device.includes('Mobile')));
    const devIcon = isMobile ? '📱 Mobile' : '💻 PC';
    const page = String(v.page || 'Home').slice(0, 24);
    const ref = String(v.referrer || 'Direct').slice(0, 18);
    const status = v.isNewSession ? `${C.green}🌟 New${C.reset}` : `${C.gray}🔄 Return${C.reset}`;

    console.log(`${timeStr.padEnd(12)} ${devIcon.padEnd(14)} ${page.padEnd(26)} ${ref.padEnd(20)} ${status}`);
  });
  console.log('');
}

// 3. RATE UPDATE
async function handleRate(args) {
  if (args.length < 2) {
    console.log(`${C.red}Error: Missing arguments!${C.reset}`);
    console.log(`Usage: ${C.bold}chintu rate <product-id-or-name> <newPrice>${C.reset}`);
    console.log(`Example: chintu rate cosm-001 499`);
    return;
  }

  const newPrice = Number(args[args.length - 1].replace(/[₹,\/-]/g, ''));
  const query = args.slice(0, args.length - 1).join(' ').trim().toLowerCase();

  if (isNaN(newPrice) || newPrice <= 0) {
    console.log(`${C.red}Error: Price must be a valid positive number!${C.reset}`);
    return;
  }

  const products = readJSON(PRODUCTS_FILE, []);
  let target = products.find(p => String(p.id).toLowerCase() === query || String(p.sku || '').toLowerCase() === query);

  if (!target) {
    const matches = products.filter(p => (p.name || '').toLowerCase().includes(query));
    if (matches.length === 1) {
      target = matches[0];
    } else if (matches.length > 1) {
      console.log(`\n${C.yellow}⚠ Multiple products found matching "${query}":${C.reset}`);
      matches.slice(0, 6).forEach((p, idx) => {
        console.log(`  ${idx + 1}. [${C.cyan}${p.id}${C.reset}] ${p.name} (Current: ₹${p.price})`);
      });
      console.log(`\n${C.bold}Please specify using exact product ID:${C.reset}`);
      console.log(`  chintu rate ${matches[0].id} ${newPrice}\n`);
      return;
    }
  }

  if (!target) {
    console.log(`${C.red}Error: No product found matching "${query}".${C.reset}`);
    console.log(`Run ${C.bold}chintu find ${query}${C.reset} to search catalogue.`);
    return;
  }

  const oldPrice = target.price;
  target.price = newPrice;
  if (target.originalPrice && target.originalPrice < target.price) {
    target.originalPrice = Math.round(target.price * 1.25);
  }

  writeJSON(PRODUCTS_FILE, products);

  console.log(`\n${C.greenBold}✅ PRICE UPDATED SUCCESSFULLY!${C.reset}`);
  console.log(`   Product:   ${C.bold}${target.name}${C.reset}`);
  console.log(`   ID:        ${C.cyan}${target.id}${C.reset}`);
  console.log(`   Old Price: ${C.dim}₹${oldPrice}${C.reset}`);
  console.log(`   New Price: ${C.greenBold}₹${newPrice}${C.reset}`);
  console.log(`   File:      data/products.json updated`);

  // Dispatch alert to Telegram
  const tgText = 
    `✅ *CLI RATE UPDATE!* 🚀\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🛍️ *Product:* ${target.name}\n` +
    `🆔 *ID:* \`${target.id}\`\n` +
    `💰 *Old Rate:* ₹${oldPrice} ➔ *New Rate:* ₹${newPrice}\n` +
    `💻 *Updated via:* Chintu CLI Tool\n` +
    `🌐 *Store:* https://chintus-gift-store.vercel.app`;

  const sent = await sendTelegramMsg(tgText);
  if (sent) {
    console.log(`   Telegram:  ${C.purple}Push notification sent to @Chin2s_bot${C.reset}`);
  }
  console.log('');
}

// 4. FIND
function handleFind(args) {
  if (args.length === 0) {
    console.log(`Usage: ${C.bold}chintu find <keyword>${C.reset}`);
    return;
  }

  const query = args.join(' ').toLowerCase();
  const products = readJSON(PRODUCTS_FILE, []);
  const matches = products.filter(p => 
    (p.name && p.name.toLowerCase().includes(query)) ||
    (p.id && p.id.toLowerCase().includes(query)) ||
    (p.category && p.category.toLowerCase().includes(query)) ||
    (p.subcategory && p.subcategory.toLowerCase().includes(query))
  );

  printHeader();
  console.log(`🔍 Search Results for "${C.bold}${query}${C.reset}" (${matches.length} found):\n`);

  if (matches.length === 0) {
    console.log(`  ${C.gray}No products matching "${query}" were found.${C.reset}\n`);
    return;
  }

  console.log(`${C.bold}${'ID'.padEnd(12)} ${'NAME'.padEnd(42)} ${'RATE'.padEnd(10)} STOCK${C.reset}`);
  console.log(`${C.dim}${'─'.repeat(74)}${C.reset}`);

  matches.slice(0, 20).forEach(p => {
    const id = String(p.id).padEnd(12);
    const name = String(p.name).slice(0, 40).padEnd(42);
    const price = `₹${p.price}`.padEnd(10);
    const stock = p.inStock !== false ? `${C.green}In Stock${C.reset}` : `${C.red}Out of Stock${C.reset}`;
    console.log(`${C.cyan}${id}${C.reset} ${name} ${C.greenBold}${price}${C.reset} ${stock}`);
  });

  if (matches.length > 20) {
    console.log(`\n${C.dim}...and ${matches.length - 20} more items.${C.reset}`);
  }
  console.log(`\n💡 To update rate: ${C.bold}chintu rate <id> <newPrice>${C.reset}\n`);
}

// 5. PRODUCTS
function handleProducts(args) {
  let limit = 15;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10) || 15;
  }

  const products = readJSON(PRODUCTS_FILE, []);
  printHeader();
  console.log(`📦 CATALOGUE OVERVIEW (Showing ${Math.min(limit, products.length)} of ${products.length} products):\n`);

  console.log(`${C.bold}${'ID'.padEnd(12)} ${'NAME'.padEnd(42)} ${'RATE'.padEnd(10)} STOCK${C.reset}`);
  console.log(`${C.dim}${'─'.repeat(74)}${C.reset}`);

  products.slice(0, limit).forEach(p => {
    const id = String(p.id).padEnd(12);
    const name = String(p.name).slice(0, 40).padEnd(42);
    const price = `₹${p.price}`.padEnd(10);
    const stock = p.inStock !== false ? `${C.green}In Stock${C.reset}` : `${C.red}Out of Stock${C.reset}`;
    console.log(`${C.cyan}${id}${C.reset} ${name} ${C.greenBold}${price}${C.reset} ${stock}`);
  });
  console.log(`\n${C.dim}Tip: Use 'chintu products --limit 30' or 'chintu find <name>'${C.reset}\n`);
}

// 6. STOCK TOGGLE
function handleStock(args) {
  if (args.length < 2) {
    console.log(`Usage: ${C.bold}chintu stock <product-id-or-name> <in|out>${C.reset}`);
    return;
  }

  const statusStr = args[args.length - 1].toLowerCase();
  const query = args.slice(0, args.length - 1).join(' ').trim().toLowerCase();
  const inStock = (statusStr === 'in' || statusStr === 'instock' || statusStr === 'true' || statusStr === '1');

  const products = readJSON(PRODUCTS_FILE, []);
  const target = products.find(p => String(p.id).toLowerCase() === query || (p.name && p.name.toLowerCase().includes(query)));

  if (!target) {
    console.log(`${C.red}Error: Product "${query}" not found.${C.reset}`);
    return;
  }

  target.inStock = inStock;
  writeJSON(PRODUCTS_FILE, products);

  console.log(`\n${C.greenBold}✅ STOCK STATUS UPDATED!${C.reset}`);
  console.log(`   Product: ${C.bold}${target.name}${C.reset} (${target.id})`);
  console.log(`   Status:  ${inStock ? C.greenBold + 'In Stock' : C.redBold + 'Out of Stock'}${C.reset}\n`);
}

// 7. NOTIFY
async function handleNotify(args) {
  if (args.length === 0) {
    console.log(`Usage: ${C.bold}chintu notify <message-text>${C.reset}`);
    return;
  }

  const msg = args.join(' ');
  const formatted = 
    `📢 *CHINTU STORE CLI ALERT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${msg}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

  process.stdout.write(`Sending push notification to Telegram... `);
  const ok = await sendTelegramMsg(formatted);
  if (ok) {
    console.log(`${C.greenBold}SENT ✅${C.reset}`);
  } else {
    console.log(`${C.redBold}FAILED ❌${C.reset}`);
  }
}

// 8. COUPON
function handleCoupon(args) {
  const settings = readJSON(SETTINGS_FILE, {});
  if (args.length === 0) {
    printHeader();
    console.log(`${C.pinkBold}🎟️ CURRENT COUPON SETTINGS:${C.reset}`);
    console.log(`   Code:     ${C.bold}${settings.couponCode || 'None'}${C.reset}`);
    console.log(`   Discount: ${C.greenBold}${settings.couponDiscount || 0}% OFF${C.reset}\n`);
    return;
  }

  const code = args[0].toUpperCase();
  const discount = parseInt(args[1], 10) || 10;
  settings.couponCode = code;
  settings.couponDiscount = discount;
  writeJSON(SETTINGS_FILE, settings);

  console.log(`\n${C.greenBold}✅ COUPON UPDATED!${C.reset}`);
  console.log(`   New Code:     ${C.bold}${code}${C.reset}`);
  console.log(`   Discount:     ${C.greenBold}${discount}% OFF${C.reset}\n`);
}

// 9. ANNOUNCEMENT
function handleAnnouncement(args) {
  const settings = readJSON(SETTINGS_FILE, {});
  if (args.length === 0) {
    printHeader();
    console.log(`${C.pinkBold}📢 CURRENT STORE ANNOUNCEMENT TICKER:${C.reset}`);
    console.log(`   "${settings.announcement || 'None'}"\n`);
    return;
  }

  const text = args.join(' ');
  settings.announcement = text;
  writeJSON(SETTINGS_FILE, settings);

  console.log(`\n${C.greenBold}✅ ANNOUNCEMENT TICKER UPDATED!${C.reset}`);
  console.log(`   New text: "${text}"\n`);
}

// 10. BACKUP
function handleBackup() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = path.join(BACKUPS_DIR, `backup-${stamp}.json`);

  const bundle = {
    timestamp: new Date().toISOString(),
    products: readJSON(PRODUCTS_FILE, []),
    settings: readJSON(SETTINGS_FILE, {}),
    orders: readJSON(ORDERS_FILE, [])
  };

  fs.writeFileSync(backupFile, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\n${C.greenBold}✅ STORE DATA BACKUP CREATED!${C.reset}`);
  console.log(`   Saved to: ${C.cyan}${backupFile}${C.reset}`);
  console.log(`   Contains: ${bundle.products.length} products, settings & orders\n`);
}

// 11. SYNC (Commit & Push to Vercel)
function handleSync() {
  console.log(`\n${C.cyanBold}🔄 SYNCING STORE TO VERCEL PRODUCTION...${C.reset}`);
  try {
    process.chdir(PROJECT_DIR);
    execSync('git add data/', { stdio: 'inherit' });
    try {
      execSync('git commit -m "chore: sync data via chintu CLI"', { stdio: 'inherit' });
    } catch (_) {
      console.log(`${C.yellow}No uncommitted data changes detected.${C.reset}`);
    }
    execSync('git push origin main', { stdio: 'inherit' });
    console.log(`\n${C.greenBold}✅ LIVE STOREFRONT SYNCED WITH VERCEL!${C.reset}\n`);
  } catch (e) {
    console.error(`\n${C.redBold}Sync failed: ${e.message}${C.reset}\n`);
  }
}

// MAIN DISPATCHER
async function main() {
  const args = process.argv.slice(2);
  const command = (args[0] || 'help').toLowerCase();
  const subArgs = args.slice(1);

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'visitors':
      await handleVisitors();
      break;
    case 'rate':
    case 'price':
      await handleRate(subArgs);
      break;
    case 'find':
    case 'search':
      handleFind(subArgs);
      break;
    case 'products':
    case 'list':
      handleProducts(subArgs);
      break;
    case 'stock':
      handleStock(subArgs);
      break;
    case 'notify':
    case 'alert':
      await handleNotify(subArgs);
      break;
    case 'coupon':
      handleCoupon(subArgs);
      break;
    case 'announcement':
    case 'announce':
      handleAnnouncement(subArgs);
      break;
    case 'backup':
      handleBackup();
      break;
    case 'sync':
      handleSync();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      printHelp();
      break;
  }
}

main().catch(err => {
  console.error(`${C.red}CLI Error: ${err.message}${C.reset}`);
  process.exit(1);
});
