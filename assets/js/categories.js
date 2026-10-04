// Store Categories Configuration for Chintu's Gift & Kawaii Store - Dalli Rajhara

const DEFAULT_CATEGORIES = [
  {
    "id": "stationery",
    "name": "Fancy Stationery",
    "hindiName": "फैंसी स्टेशनरी",
    "icon": "✏️",
    "image": "assets/images/kawaii_stationery.jpg",
    "tagline": "Pastel locked diaries, aesthetic highlighters, washi tapes, gel pens & pencil pouches",
    "subcategories": [
      "Pencils & Gel Pens",
      "Cute Erasers & Sharpeners",
      "Pastel Diaries & Locks",
      "Aesthetic Highlighters",
      "Pencil Pouches & Organizers",
      "Washi Tapes & Stickers"
    ],
    "itemCount": 17
  },
  {
    "id": "cosmetics",
    "name": "Cosmetic & Personal Care",
    "hindiName": "कॉस्मेटिक व ब्यूटी",
    "icon": "💄",
    "image": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=75",
    "tagline": "Cute lip balms, velvet lip tints, LED vanity mirrors, hair accessories & vanity pouches",
    "subcategories": [
      "Cute Lip Balms & Glosses",
      "Korean Velvet Tint Mud",
      "Pocket Mirrors & Brushes",
      "Hand Creams & Skincare",
      "Hair Accessories & Clips",
      "Makeup Vanity Pouches"
    ],
    "itemCount": 17
  },
  {
    "id": "toys",
    "name": "Soft Toys & Plushies",
    "hindiName": "सॉफ्ट टॉयज व प्लशीज",
    "icon": "🧸",
    "image": "https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=400&q=75",
    "tagline": "Giant cuddly teddy bears, viral Boba squishies, soft animal cushions & plush bag charms",
    "subcategories": [
      "Giant Cuddle Teddies",
      "Boba & Food Plushies",
      "Kawaii Animal Plushies",
      "Reversible Emotion Plushies",
      "Plush Backpacks & Charms"
    ],
    "itemCount": 17
  },
  {
    "id": "personalized",
    "name": "Personalized 3D Gifts",
    "hindiName": "पर्सनलाइज्ड व कस्टम गिफ्ट्स",
    "icon": "✨",
    "image": "assets/images/pink_acrylic_lamp.jpg",
    "tagline": "Laser-cut 3D LED lamps, photo magic mugs, custom Spotify plaques & rotating cube lamps",
    "subcategories": [
      "3D LED Acrylic Lamps",
      "Photo Magic Mugs",
      "Spotify Music Plaques",
      "Photo Rotating Cube Lamps",
      "Custom Name Keychains"
    ],
    "itemCount": 17
  },
  {
    "id": "birthday",
    "name": "Birthday Hampers",
    "hindiName": "बर्थडे हैंपर्स व सेलिब्रेशन",
    "icon": "🎂",
    "image": "assets/images/birthday_hampers.jpg",
    "tagline": "Curated celebration gift hampers, surprise explosion boxes, baskets & birthday props",
    "subcategories": [
      "Birthday Gift Hampers",
      "Surprise Explosion Boxes",
      "Celebration Baskets",
      "Greeting Cards & Seals",
      "Birthday Party Props"
    ],
    "itemCount": 16
  },
  {
    "id": "novelties",
    "name": "Bags, Bottles & Novelties",
    "hindiName": "बैग्स, बॉटल्स व नॉवेल्टीज",
    "icon": "🎒",
    "image": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=75",
    "tagline": "Pastel sippers, cute water bottles, mini crossbody bags, silicone night lamps & clocks",
    "subcategories": [
      "Pastel Sippers & Bottles",
      "Mini Crossbody Bags",
      "Silicone Night Lamps",
      "Smart Desk Clocks",
      "Mini Mist Humidifiers"
    ],
    "itemCount": 16
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_CATEGORIES };
}
