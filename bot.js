// ================ KUTUBXONALAR ================
const { Telegraf, session } = require("telegraf");
const fs = require("fs");

// ================ TOKEN ================
const BOT_TOKEN = "8660848497:AAE6oVEe-36oknS3axnr7FqJ956BZ_FDLtY";

// ================ BOTNI YARATISH ================
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// ================ BUYURTMA TIZIMI ================
const ORDERS_FILE = "orders.json";
const CART_FILE = "cart.json";

const ORDER_STATUS = {
  NEW: "🆕 Yangi",
  PROCESSING: "⏳ Jarayonda",
  SHIPPED: "🚚 Yuborilgan",
  DELIVERED: "✅ Yetkazilgan",
  CANCELLED: "❌ Bekor qilingan",
};

function saveOrder(orderData) {
  try {
    let allOrders = {};
    if (fs.existsSync(ORDERS_FILE))
      allOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
    const orderId = Date.now().toString();
    allOrders[orderId] = {
      id: orderId,
      ...orderData,
      status: ORDER_STATUS.NEW,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(allOrders, null, 2));
    return orderId;
  } catch (error) {
    console.error("Buyurtmani saqlashda xatolik:", error);
    return null;
  }
}

function loadOrders(userId, role = "customer") {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const allOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
      const filtered = {};
      for (const [id, order] of Object.entries(allOrders)) {
        if (role === "customer" && order.customerId === userId)
          filtered[id] = order;
        else if (role === "seller" && order.storeId === userId)
          filtered[id] = order;
      }
      return filtered;
    }
  } catch (error) {
    console.error("Buyurtmalarni o'qishda xatolik:", error);
  }
  return {};
}

function updateOrderStatus(orderId, newStatus) {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const allOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
      if (allOrders[orderId]) {
        allOrders[orderId].status = newStatus;
        allOrders[orderId].updatedAt = new Date().toISOString();
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(allOrders, null, 2));
        return true;
      }
    }
  } catch (error) {
    console.error("Buyurtma holatini yangilashda xatolik:", error);
  }
  return false;
}

function getOrder(orderId) {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const allOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
      return allOrders[orderId] || null;
    }
  } catch (error) {
    console.error("Buyurtmani o'qishda xatolik:", error);
  }
  return null;
}

// ================ SAVAT TIZIMI ================
function loadCart(userId) {
  try {
    if (fs.existsSync(CART_FILE)) {
      const allCarts = JSON.parse(fs.readFileSync(CART_FILE, "utf8"));
      return allCarts[userId] || [];
    }
  } catch (error) {
    console.error("Savatchani o'qishda xatolik:", error);
  }
  return [];
}

function saveCart(userId, cart) {
  try {
    let allCarts = {};
    if (fs.existsSync(CART_FILE))
      allCarts = JSON.parse(fs.readFileSync(CART_FILE, "utf8"));
    allCarts[userId] = cart;
    fs.writeFileSync(CART_FILE, JSON.stringify(allCarts, null, 2));
  } catch (error) {
    console.error("Savatchani saqlashda xatolik:", error);
  }
}

function addToCart(userId, product, storeId, storeName) {
  const cart = loadCart(userId);
  const existingIndex = cart.findIndex((item) => item.productId === product.id);
  if (existingIndex >= 0) cart[existingIndex].quantity += 1;
  else
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      storeId: storeId,
      storeName: storeName,
    });
  saveCart(userId, cart);
  return true;
}

function removeFromCart(userId, index) {
  const cart = loadCart(userId);
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    saveCart(userId, cart);
    return true;
  }
  return false;
}

function clearCart(userId) {
  saveCart(userId, []);
}

// ================ KATEGORIYALAR ================
const CATEGORIES = [
  "🥑 Mevalar",
  "🥬 Sabzavotlar",
  "🥛 Sut mahsulotlari",
  "🍞 Non mahsulotlari",
  "🍬 Shirinliklar",
  "🥤 Ichimliklar",
  "📦 Boshqa",
];

// ================ ADMIN ID ================
const ADMIN_IDS = ["7093573259"];
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId.toString());
}

// ================ USER MA'LUMOTLARI ================
const USERS_FILE = "users.json";
function loadUser(userId) {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
      return data[userId] || null;
    }
  } catch (error) {
    console.error("Foydalanuvchi ma'lumotlarini o‘qishda xatolik:", error);
  }
  return null;
}
function saveUser(userId, userData) {
  try {
    let allUsers = {};
    if (fs.existsSync(USERS_FILE))
      allUsers = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    allUsers[userId] = userData;
    fs.writeFileSync(USERS_FILE, JSON.stringify(allUsers, null, 2));
    return true;
  } catch (error) {
    console.error("Foydalanuvchi ma'lumotlarini saqlashda xatolik:", error);
    return false;
  }
}

// ================ DO'KON MA'LUMOTLARI ================
const STORES_FILE = "stores.json";
function loadStore(userId) {
  try {
    if (fs.existsSync(STORES_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORES_FILE, "utf8"));
      return data[userId] || null;
    }
  } catch (error) {
    console.error("Do‘kon ma'lumotlarini o‘qishda xatolik:", error);
  }
  return null;
}
function saveStore(userId, storeData) {
  try {
    let allStores = {};
    if (fs.existsSync(STORES_FILE))
      allStores = JSON.parse(fs.readFileSync(STORES_FILE, "utf8"));
    allStores[userId] = storeData;
    fs.writeFileSync(STORES_FILE, JSON.stringify(allStores, null, 2));
    return true;
  } catch (error) {
    console.error("Do‘kon ma'lumotlarini saqlashda xatolik:", error);
    return false;
  }
}
function getAllStores() {
  try {
    if (fs.existsSync(STORES_FILE))
      return JSON.parse(fs.readFileSync(STORES_FILE, "utf8"));
  } catch (error) {
    console.error("Barcha do‘konlarni o‘qishda xatolik:", error);
  }
  return {};
}

// ================ MAHSULOT MA'LUMOTLARI (STOK BILAN) ================
const DATA_FILE = "products.json";

function loadProducts(userId) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return data[userId] || [];
    }
  } catch (error) {
    console.error("Mahsulotlarni o‘qishda xatolik:", error);
  }
  return [];
}

function saveProducts(userId, products) {
  try {
    let allData = {};
    if (fs.existsSync(DATA_FILE))
      allData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    allData[userId] = products;
    fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));
  } catch (error) {
    console.error("Mahsulotlarni saqlashda xatolik:", error);
  }
}

// Mahsulot qo'shish yoki mavjudiga qo'shish
function addOrUpdateProduct(userId, product) {
  const products = loadProducts(userId);
  const existingIndex = products.findIndex(
    (p) =>
      p.name.toLowerCase() === product.name.toLowerCase() &&
      p.category === product.category
  );

  if (existingIndex >= 0) {
    // Mavjud mahsulotga miqdor qo'shish
    const newQuantity = products[existingIndex].quantity + product.quantity;
    products[existingIndex].quantity = newQuantity;
    products[existingIndex].unit = product.unit; // kg yoki dona
    if (product.price) products[existingIndex].price = product.price;
    saveProducts(userId, products);
    return { action: "updated", index: existingIndex };
  } else {
    // Yangi mahsulot
    const newProduct = {
      id: Date.now().toString(),
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: product.quantity,
      unit: product.unit,
      photo: product.photo || null,
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    saveProducts(userId, products);
    return { action: "added", index: products.length - 1 };
  }
}

// Buyurtmadan keyin mahsulot miqdorini kamaytirish
function decreaseProductQuantity(userId, productName, productCategory, amount) {
  const products = loadProducts(userId);
  const productIndex = products.findIndex(
    (p) =>
      p.name.toLowerCase() === productName.toLowerCase() &&
      p.category === productCategory
  );

  if (productIndex >= 0) {
    const newQuantity = products[productIndex].quantity - amount;
    if (newQuantity <= 0) {
      products.splice(productIndex, 1);
    } else {
      products[productIndex].quantity = newQuantity;
    }
    saveProducts(userId, products);
    return true;
  }
  return false;
}

function deleteProduct(userId, index) {
  const products = loadProducts(userId);
  if (index >= 0 && index < products.length) {
    products.splice(index, 1);
    saveProducts(userId, products);
    return true;
  }
  return false;
}

function updateProduct(userId, index, field, value) {
  const products = loadProducts(userId);
  if (index >= 0 && index < products.length) {
    products[index][field] = value;
    saveProducts(userId, products);
    return true;
  }
  return false;
}

function getProductsByCategory(userId, category) {
  const products = loadProducts(userId);
  return products.filter((p) => p.category === category);
}

// Kamaygan mahsulotlarni olish (miqdori 10 dan kam)
function getLowStockProducts(userId) {
  const products = loadProducts(userId);
  return products.filter((p) => p.quantity < 10);
}

// ================ BUYURTMA BERISH HOLATLARI ================
const orderAddressStep = "order_address";
const orderPhoneStep = "order_phone";

// ================ MAHSULOT QO'SHISH HOLATLARI (STOK BILAN) ================
const addCategoryStep = "add_category";
const addNameStep = "add_name";
const addPriceStep = "add_price";
const addQuantityStep = "add_quantity";
const addUnitStep = "add_unit";
const addPhotoStep = "add_photo";

// ================ RO'YXATDAN O'TKAZISH HOLATLARI ================
const regFirstNameStep = "reg_firstname";
const regLastNameStep = "reg_lastname";
const regPhoneStep = "reg_phone";
const regUsernameStep = "reg_username";

// ================ MAHSULOT TAHRIRLASH HOLATLARI ================
const editNewName = "edit_new_name";
const editNewPrice = "edit_new_price";
const editNewCategory = "edit_new_category";
const editNewQuantity = "edit_new_quantity";
const editNewUnit = "edit_new_unit";

// ================ DO'KON TAHRIRLASH HOLATLARI ================
const editStoreNameStep = "edit_store_name";
const editStoreAddressStep = "edit_store_address";
const editStorePhoneStep = "edit_store_phone";

// ================ DO'KON RO'YXATDAN O'TKAZISH HOLATLARI ================
const storeNameStep = "store_name";
const storeAddressStep = "store_address";
const storePhoneStep = "store_phone";

// ================ KATEGORIYA TUGMALARI ================
function getCategoryKeyboard() {
  const keyboard = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    const row = [];
    if (CATEGORIES[i])
      row.push({ text: CATEGORIES[i], callback_data: `cat_${i}` });
    if (CATEGORIES[i + 1])
      row.push({ text: CATEGORIES[i + 1], callback_data: `cat_${i + 1}` });
    keyboard.push(row);
  }
  return keyboard;
}

// ================ DASHBOARD ================
async function showDashboard(ctx) {
  const userId = ctx.from.id;
  const user = loadUser(userId);
  const store = loadStore(userId);
  const isAdminUser = isAdmin(userId);
  const lowStock = getLowStockProducts(userId);

  let message = "🏪 <b>Boshqaruv paneli (Dashboard)</b>\n\n";
  message += `👋 Salom, <b>${user.firstName} ${user.lastName}</b>!\n\n`;

  if (store && lowStock.length > 0) {
    message += `⚠️ <b>Diqqat! ${lowStock.length} ta mahsulot tugayapti!</b>\n/lowstock\n\n`;
  }

  let keyboard = [];

  keyboard.push([
    { text: "📋 Mening profilim", callback_data: "menu_profile" },
  ]);
  keyboard.push([{ text: "🛒 Savatim", callback_data: "menu_cart" }]);
  keyboard.push([
    { text: "📋 Mening buyurtmalarim", callback_data: "menu_myorders" },
  ]);

  if (store) {
    keyboard.push([
      { text: "🏪 Mening do'konim", callback_data: "menu_mystore" },
    ]);
    keyboard.push([
      { text: "📦 Mahsulotlarim", callback_data: "menu_myproducts" },
    ]);
    keyboard.push([
      { text: "➕ Mahsulot qo'shish", callback_data: "menu_addproduct" },
    ]);
    keyboard.push([
      { text: "✏️ Mahsulot tahrirlash", callback_data: "menu_editproduct" },
    ]);
    keyboard.push([
      { text: "🗑 Mahsulot o'chirish", callback_data: "menu_deleteproduct" },
    ]);
    keyboard.push([
      { text: "📂 Kategoriyalar", callback_data: "menu_categories" },
    ]);
    keyboard.push([
      { text: "📋 Kelgan buyurtmalar", callback_data: "menu_storeorders" },
    ]);
    keyboard.push([
      { text: "⚠️ Tugayotgan mahsulotlar", callback_data: "menu_lowstock" },
    ]);
  } else {
    keyboard.push([
      { text: "🏪 Do'kon ochish", callback_data: "menu_createstore" },
    ]);
  }

  keyboard.push([
    { text: "🏬 Do'konlar ro'yxati", callback_data: "menu_stores" },
  ]);

  if (isAdminUser)
    keyboard.push([{ text: "👑 Admin panel", callback_data: "menu_admin" }]);
  keyboard.push([{ text: "❓ Yordam", callback_data: "menu_help" }]);

  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

// ================ START BUYRUQI ================
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const existingUser = loadUser(userId);
  if (existingUser) await showDashboard(ctx);
  else {
    if (!ctx.session) ctx.session = {};
    ctx.session.step = regFirstNameStep;
    await ctx.replyWithHTML(
      "🏪 <b>Online Vitrina Botiga xush kelibsiz!</b>\n\nIltimos, ro'yxatdan o'ting.\n\n1-qadam: <b>Ismingiz</b> nima?\n\nMasalan: <i>Azimjon</i>\n\nBekor qilish uchun /cancel"
    );
  }
});

bot.command("dashboard", async (ctx) => {
  const user = loadUser(ctx.from.id);
  if (!user) {
    await ctx.replyWithHTML("❌ Iltimos, avval ro'yxatdan o'ting: /start");
    return;
  }
  await showDashboard(ctx);
});

bot.command("profile", async (ctx) => {
  const userId = ctx.from.id;
  const user = loadUser(userId);
  if (!user) {
    await ctx.replyWithHTML("❌ Iltimos, avval ro'yxatdan o'ting: /start");
    return;
  }
  let message = "👤 <b>Mening profilim</b>\n\n";
  message += `📛 Ism: ${user.firstName}\n📛 Familiya: ${
    user.lastName
  }\n📞 Telefon: ${user.phone}\n🔹 Telegram: ${
    user.username ? "@" + user.username : "Yo‘q"
  }\n📅 Ro'yxatdan o'tgan: ${new Date(
    user.registeredAt
  ).toLocaleDateString()}\n`;
  await ctx.replyWithHTML(message);
});

// ================ MENU TUGMALARI ================
bot.action("menu_profile", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("👤 Profil ma'lumotlari uchun /profile");
});
bot.action("menu_cart", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("🛒 Savat uchun /cart");
});
bot.action("menu_myorders", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("📋 Buyurtmalarim uchun /myorders");
});
bot.action("menu_mystore", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("🏪 Do'kon ma'lumotlari uchun /mystore");
});
bot.action("menu_myproducts", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("📦 Mahsulotlaringiz uchun /myproducts");
});
bot.action("menu_addproduct", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("➕ Mahsulot qo'shish uchun /addproduct");
});
bot.action("menu_editproduct", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("✏️ Mahsulot tahrirlash uchun /editproduct");
});
bot.action("menu_deleteproduct", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("🗑 Mahsulot o'chirish uchun /deleteproduct");
});
bot.action("menu_categories", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("📂 Kategoriyalarni ko'rish uchun /categories");
});
bot.action("menu_createstore", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("🏪 Do'kon ochish uchun /setupstore");
});
bot.action("menu_stores", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("🏬 Do'konlar ro'yxati uchun /stores");
});
bot.action("menu_storeorders", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("📋 Kelgan buyurtmalar uchun /storeorders");
});
bot.action("menu_lowstock", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("⚠️ Tugayotgan mahsulotlar uchun /lowstock");
});
bot.action("menu_admin", async (ctx) => {
  await ctx.answerCbQuery();
  if (isAdmin(ctx.from.id))
    await ctx.replyWithHTML(
      "👑 <b>Admin panel</b>\n\n/adminusers - Foydalanuvchilar\n/adminstores - Do'konlar\n/adminstats - Statistika\n/adminbroadcast - Xabar\n/admindeleteuser - O'chirish"
    );
  else await ctx.replyWithHTML("❌ Bu funksiya faqat admin uchun!");
});
bot.action("menu_help", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("❓ Yordam uchun /help");
});

// ================ DO'KON FUNKSIYALARI ================
bot.command("setupstore", async (ctx) => {
  const userId = ctx.from.id;
  const existingStore = loadStore(userId);
  if (existingStore) {
    await ctx.replyWithHTML("🏪 Siz allaqachon do'kon ochgansiz!\n\n/mystore");
    return;
  }
  if (!ctx.session) ctx.session = {};
  ctx.session.step = storeNameStep;
  await ctx.replyWithHTML(
    "🏪 <b>Do‘kon ro‘yxatdan o‘tkazish</b>\n\n1-qadam: <b>Do‘kon nomi</b> nima?\n\nMasalan: <i>Salimning mevalari</i>\n\nBekor qilish uchun /cancel"
  );
});

bot.command("mystore", async (ctx) => {
  const userId = ctx.from.id;
  const store = loadStore(userId);
  if (!store) {
    await ctx.replyWithHTML(
      "🏪 Siz hali do‘kon ochmagansiz!\n\nDo‘kon ochish: /setupstore"
    );
    return;
  }
  let message = "🏪 <b>Sizning do‘koningiz</b>\n\n";
  message += `📛 <b>Nomi:</b> ${store.name}\n📍 <b>Manzil:</b> ${
    store.address
  }\n📞 <b>Telefon:</b> ${store.phone}\n📅 <b>Ro‘yxatdan o‘tgan:</b> ${new Date(
    store.registeredAt
  ).toLocaleDateString()}\n\nMa'lumotlarni o‘zgartirish: /editstore`;
  await ctx.replyWithHTML(message);
});

bot.command("editstore", async (ctx) => {
  const userId = ctx.from.id;
  const store = loadStore(userId);
  if (!store) {
    await ctx.replyWithHTML(
      "🏪 Siz hali do‘kon ochmagansiz!\n\nDo‘kon ochish: /setupstore"
    );
    return;
  }
  const keyboard = [
    [{ text: "📛 Nomini o'zgartirish", callback_data: "edit_store_name" }],
    [{ text: "📍 Manzilni o'zgartirish", callback_data: "edit_store_address" }],
    [{ text: "📞 Telefonni o'zgartirish", callback_data: "edit_store_phone" }],
  ];
  await ctx.replyWithHTML(
    `✏️ <b>${store.name}</b> do‘kon ma'lumotlarini tahrirlash\n\n📛 Hozirgi nom: ${store.name}\n📍 Hozirgi manzil: ${store.address}\n📞 Hozirgi telefon: ${store.phone}\n\nQaysi ma'lumotni o'zgartirmoqchisiz?`,
    { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
  );
});

// ================ MAHSULOT QO'SHISH (STOK BILAN) ================
bot.command("addproduct", async (ctx) => {
  const store = loadStore(ctx.from.id);
  if (!store) {
    await ctx.replyWithHTML("❌ Avval do'kon ochishingiz kerak: /setupstore");
    return;
  }
  if (!ctx.session) ctx.session = {};
  ctx.session.step = addCategoryStep;
  const keyboard = getCategoryKeyboard();
  await ctx.replyWithHTML(
    "🆕 <b>Yangi mahsulot qo‘shish</b>\n\n1-qadam: <b>Kategoriyani tanlang:</b>",
    { reply_markup: { inline_keyboard: keyboard } }
  );
});

// ================ MAHSULOTLARNI KO'RISH ================
bot.command("myproducts", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);
  if (products.length === 0) {
    await ctx.replyWithHTML("📭 Mahsulot yo‘q!\n\n/addproduct");
    return;
  }
  let message = "📦 <b>Sizning mahsulotlaringiz</b>\n\n";
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const stockWarning =
      p.quantity < 10
        ? p.quantity < 5
          ? "⚠️⚠️ TUGAMOQDA!"
          : "⚠️ Kamaymoqda"
        : "";
    message += `${i + 1}. <b>${p.name}</b>\n`;
    message += `   💰 ${p.price.toLocaleString()} so'm\n`;
    message += `   📦 Qolgan: ${p.quantity} ${
      p.unit === "kg" ? "kg" : "dona"
    } ${stockWarning ? ` - ${stockWarning}` : ""}\n`;
    message += `   📂 ${p.category}\n\n`;
  }
  await ctx.replyWithHTML(message);
});

// ================ KATEGORIYALAR ================
bot.command("categories", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);
  const categoryCount = {};
  for (const product of products) {
    const cat = product.category || "📦 Boshqa";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }
  let message = "📂 <b>Kategoriyalar va mahsulotlar soni</b>\n\n";
  for (const cat of CATEGORIES) {
    const count = categoryCount[cat] || 0;
    message += `${cat}: ${count} ta mahsulot\n`;
  }
  const keyboard = [];
  for (let i = 0; i < CATEGORIES.length; i++)
    keyboard.push([{ text: CATEGORIES[i], callback_data: `view_cat_${i}` }]);
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

bot.action(/view_cat_(\d+)/, async (ctx) => {
  const categoryIndex = parseInt(ctx.match[1]);
  const category = CATEGORIES[categoryIndex];
  const userId = ctx.from.id;
  const products = getProductsByCategory(userId, category);
  if (products.length === 0) {
    await ctx.answerCbQuery(`📭 ${category} da mahsulot yo‘q`);
    await ctx.editMessageText(
      `📂 <b>${category}</b>\n\n📭 Bu kategoriyada hozircha mahsulot yo‘q.`,
      { parse_mode: "HTML" }
    );
    return;
  }
  let message = `📂 <b>${category}</b>\n\n`;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. <b>${p.name}</b> - ${p.price} so'm\n   Qolgan: ${
      p.quantity
    } ${p.unit === "kg" ? "kg" : "dona"}\n\n`;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText(message, { parse_mode: "HTML" });
});

// ================ TUGOYOTGAN MAHSULOTLAR ================
bot.command("lowstock", async (ctx) => {
  const userId = ctx.from.id;
  const lowStock = getLowStockProducts(userId);
  if (lowStock.length === 0) {
    await ctx.replyWithHTML("✅ <b>Barcha mahsulotlar yetarli miqdorda!</b>");
    return;
  }
  let message = "⚠️ <b>Tugayotgan mahsulotlar</b>\n\n";
  for (let i = 0; i < lowStock.length; i++) {
    const p = lowStock[i];
    message += `${i + 1}. <b>${p.name}</b>\n`;
    message += `   Qolgan: ${p.quantity} ${p.unit === "kg" ? "kg" : "dona"}\n`;
    message += `   Kategoriya: ${p.category}\n`;
    message += `   /editproduct - miqdor qo'shish\n\n`;
  }
  await ctx.replyWithHTML(message);
});

// ================ MAHSULOT TAHRIRLASH ================
bot.command("editproduct", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);
  if (products.length === 0) {
    await ctx.replyWithHTML("📭 Tahrirlash uchun mahsulot yo‘q!");
    return;
  }
  let message = "✏️ <b>Qaysi mahsulotni tahrirlamoqchisiz?</b>\n\n";
  const keyboard = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. ${p.name} - ${p.price} so'm (Qolgan: ${p.quantity} ${
      p.unit === "kg" ? "kg" : "dona"
    })\n`;
    keyboard.push([
      { text: `${i + 1}. ${p.name}`, callback_data: `edit_select_${i}` },
    ]);
  }
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ================ MAHSULOT O'CHIRISH ================
bot.command("deleteproduct", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);
  if (products.length === 0) {
    await ctx.replyWithHTML("📭 O‘chirish uchun mahsulot yo‘q!");
    return;
  }
  let message = "🗑 <b>Qaysi mahsulotni o‘chirmoqchisiz?</b>\n\n";
  const keyboard = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. ${p.name} - ${p.price} so'm\n`;
    keyboard.push([
      { text: `${i + 1}. ${p.name}`, callback_data: `delete_${i}` },
    ]);
  }
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ================ DO'KONLAR RO'YXATI ================
bot.command("stores", async (ctx) => {
  const allStores = getAllStores();
  const storeList = Object.entries(allStores);
  if (storeList.length === 0) {
    await ctx.replyWithHTML("🏬 Hozircha hech qanday do‘kon mavjud emas!");
    return;
  }
  let message = "🏬 <b>Barcha do‘konlar</b>\n\n";
  const keyboard = [];
  for (const [userId, store] of storeList) {
    message += `📛 <b>${store.name}</b>\n📍 ${store.address}\n📞 ${store.phone}\n───────────\n`;
    keyboard.push([
      { text: `🏪 ${store.name}`, callback_data: `view_store_${userId}` },
    ]);
  }
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ================ DO'KON MAHSULOTLARINI KO'RISH (STOK BILAN) ================
bot.action(/view_store_(.+)/, async (ctx) => {
  const storeId = ctx.match[1];
  const store = loadStore(storeId);
  const products = loadProducts(storeId);
  if (!store) {
    await ctx.answerCbQuery("Do'kon topilmadi!");
    return;
  }
  let message = `🏪 <b>${store.name}</b>\n\n📍 ${store.address}\n📞 ${store.phone}\n\n<b>📦 Mahsulotlar:</b>\n`;
  const keyboard = [];
  if (products.length === 0) message += "Hozircha mahsulot yo‘q.";
  else {
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const stockText =
        p.quantity < 10 ? (p.quantity < 5 ? " ⚠️⚠️" : " ⚠️") : "";
      message += `${i + 1}. ${p.name} - ${p.price.toLocaleString()} so'm (${
        p.quantity
      } ${p.unit === "kg" ? "kg" : "dona"} qoldi${stockText})\n`;
      if (p.quantity > 0)
        keyboard.push([
          {
            text: `➕ ${p.name} savatga`,
            callback_data: `add_to_cart_${storeId}_${i}`,
          },
        ]);
      else
        keyboard.push([
          { text: `❌ ${p.name} tugagan`, callback_data: `out_of_stock` },
        ]);
    }
  }
  await ctx.answerCbQuery();
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ================ MAHSULOTNI SAVATGA QO'SHISH ================
bot.action(/add_to_cart_(.+)_(\d+)/, async (ctx) => {
  const storeId = ctx.match[1];
  const productIndex = parseInt(ctx.match[2]);
  const store = loadStore(storeId);
  const products = loadProducts(storeId);
  const product = products[productIndex];
  if (!store || !product) {
    await ctx.answerCbQuery("Xatolik! Mahsulot topilmadi.");
    return;
  }
  if (product.quantity <= 0) {
    await ctx.answerCbQuery("❌ Mahsulot tugagan!", { show_alert: true });
    return;
  }
  const userId = ctx.from.id;
  addToCart(
    userId,
    {
      id: `${storeId}_${productIndex}`,
      name: product.name,
      price: product.price,
    },
    storeId,
    store.name
  );
  await ctx.answerCbQuery(`✅ ${product.name} savatga qo'shildi!`);
  await ctx.replyWithHTML(
    `✅ <b>${product.name}</b> savatga qo'shildi!\n\n🛒 Savatni ko'rish: /cart\n📦 Buyurtma berish: /order`
  );
});

bot.action("out_of_stock", async (ctx) => {
  await ctx.answerCbQuery("❌ Mahsulot tugagan!", { show_alert: true });
});

// ================ BUYURTMA FUNKSIYALARI ================
bot.command("cart", async (ctx) => {
  const userId = ctx.from.id;
  const cart = loadCart(userId);
  if (cart.length === 0) {
    await ctx.replyWithHTML(
      "🛒 Savatingiz bo'sh!\n\nMahsulot qo'shish: /stores"
    );
    return;
  }
  let message = "🛒 <b>Savat</b>\n\n";
  let total = 0;
  const keyboard = [];
  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const subtotal = item.price * item.quantity;
    total += subtotal;
    message += `${i + 1}. ${item.name} x ${
      item.quantity
    } = ${subtotal.toLocaleString()} so'm\n   🏪 ${item.storeName}\n`;
    keyboard.push([
      { text: `❌ ${item.name} o'chirish`, callback_data: `cart_remove_${i}` },
    ]);
  }
  message += `\n💰 <b>Jami: ${total.toLocaleString()} so'm</b>\n\n📦 Buyurtma berish: /order`;
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

bot.action(/cart_remove_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  const userId = ctx.from.id;
  removeFromCart(userId, index);
  await ctx.answerCbQuery("✅ Mahsulot savatdan o'chirildi!");
  await ctx.replyWithHTML("🛒 Savat yangilandi. /cart bilan ko'ring");
});

bot.command("order", async (ctx) => {
  const userId = ctx.from.id;
  const cart = loadCart(userId);
  if (cart.length === 0) {
    await ctx.replyWithHTML("❌ Savatingiz bo'sh! /stores");
    return;
  }
  if (!ctx.session) ctx.session = {};
  ctx.session.step = orderAddressStep;
  await ctx.replyWithHTML(
    "📦 <b>Buyurtma berish</b>\n\n1-qadam: <b>Yetkazib berish manzilingizni</b> kiriting:\n\nMasalan: <i>Toshkent sh., Chilonzor t., 12-uy</i>\n\nBekor qilish uchun /cancel"
  );
});

bot.command("myorders", async (ctx) => {
  const userId = ctx.from.id;
  const orders = loadOrders(userId, "customer");
  if (Object.keys(orders).length === 0) {
    await ctx.replyWithHTML(
      "📭 Sizning buyurtmalaringiz yo'q!\n\nBuyurtma berish: /stores"
    );
    return;
  }
  let message = "📋 <b>Sizning buyurtmalaringiz</b>\n\n";
  for (const [id, order] of Object.entries(orders).reverse().slice(0, 10)) {
    message += `🆔 <code>${id}</code>\n📦 ${
      order.items.length
    } ta mahsulot\n💰 Jami: ${order.total.toLocaleString()} so'm\n📊 Holat: ${
      order.status
    }\n📅 Sana: ${new Date(
      order.createdAt
    ).toLocaleDateString()}\n───────────\n`;
  }
  await ctx.replyWithHTML(message);
});

bot.command("storeorders", async (ctx) => {
  const userId = ctx.from.id;
  const store = loadStore(userId);
  if (!store) {
    await ctx.replyWithHTML("❌ Siz do'kon ochmagansiz! /setupstore");
    return;
  }
  const orders = loadOrders(userId, "seller");
  if (Object.keys(orders).length === 0) {
    await ctx.replyWithHTML("📭 Do'koningizga kelgan buyurtmalar yo'q!");
    return;
  }
  let message = "📋 <b>Do'koningizga kelgan buyurtmalar</b>\n\n";
  const keyboard = [];
  for (const [id, order] of Object.entries(orders).reverse().slice(0, 10)) {
    message += `🆔 <code>${id}</code>\n📦 ${
      order.items.length
    } ta mahsulot\n💰 Jami: ${order.total.toLocaleString()} so'm\n📊 Holat: ${
      order.status
    }\n👤 Mijoz: ${order.customerName}\n📍 Manzil: ${
      order.address
    }\n───────────\n`;
    keyboard.push([
      {
        text: `✏️ ${id.slice(-6)} holatini o'zgartirish`,
        callback_data: `order_status_${id}`,
      },
    ]);
  }
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

bot.command("orderstatus", async (ctx) => {
  const orderId = ctx.message.text.replace("/orderstatus", "").trim();
  if (!orderId) {
    await ctx.replyWithHTML(
      "🔍 <b>Buyurtma holatini ko'rish</b>\n\nFoydalanish: <code>/orderstatus BUYURTMA_ID</code>\n\nBuyurtma ID ni /myorders dan oling."
    );
    return;
  }
  const order = getOrder(orderId);
  if (!order) {
    await ctx.replyWithHTML("❌ Buyurtma topilmadi!");
    return;
  }
  if (order.customerId !== ctx.from.id && !isAdmin(ctx.from.id)) {
    await ctx.replyWithHTML("❌ Bu buyurtma sizga tegishli emas!");
    return;
  }
  let message = "🔍 <b>Buyurtma ma'lumotlari</b>\n\n";
  message += `🆔 ID: <code>${order.id}</code>\n📊 Holat: ${
    order.status
  }\n💰 Jami: ${order.total.toLocaleString()} so'm\n👤 Mijoz: ${
    order.customerName
  }\n📞 Telefon: ${order.customerPhone}\n📍 Manzil: ${
    order.address
  }\n📅 Sana: ${new Date(
    order.createdAt
  ).toLocaleString()}\n\n<b>📦 Mahsulotlar:</b>\n`;
  for (const item of order.items)
    message += `  • ${item.name} x ${item.quantity} = ${(
      item.price * item.quantity
    ).toLocaleString()} so'm\n`;
  await ctx.replyWithHTML(message);
});

// Buyurtma holatini o'zgartirish
bot.action(/order_status_(.+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const statusKeyboard = [
    [{ text: "🆕 Yangi", callback_data: `order_set_${orderId}_NEW` }],
    [
      {
        text: "⏳ Jarayonda",
        callback_data: `order_set_${orderId}_PROCESSING`,
      },
    ],
    [{ text: "🚚 Yuborilgan", callback_data: `order_set_${orderId}_SHIPPED` }],
    [
      {
        text: "✅ Yetkazilgan",
        callback_data: `order_set_${orderId}_DELIVERED`,
      },
    ],
    [
      {
        text: "❌ Bekor qilish",
        callback_data: `order_set_${orderId}_CANCELLED`,
      },
    ],
  ];
  await ctx.answerCbQuery();
  await ctx.editMessageText(`✏️ Buyurtma holatini tanlang:`, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: statusKeyboard },
  });
});

bot.action(/order_set_(.+)_(.+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const statusKey = ctx.match[2];
  const newStatus = ORDER_STATUS[statusKey];
  updateOrderStatus(orderId, newStatus);
  const order = getOrder(orderId);
  if (order && order.customerId) {
    try {
      await bot.telegram.sendMessage(
        order.customerId,
        `📦 <b>Buyurtma holati yangilandi!</b>\n\n🆔 Buyurtma ID: <code>${orderId}</code>\n📊 Yangi holat: ${newStatus}\n\nBatafsil: /orderstatus ${orderId}`,
        { parse_mode: "HTML" }
      );
    } catch (e) {}
  }
  await ctx.answerCbQuery(`✅ Holat "${newStatus}" ga o'zgartirildi!`);
  await ctx.editMessageText(
    `✅ Buyurtma holati yangilandi!\n\n🆔 ${orderId}\n📊 Yangi holat: ${newStatus}`
  );
});

// ================ DO'KON TAHRIRLASH TUGMALARI ================
bot.action("edit_store_name", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = editStoreNameStep;
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "✏️ <b>Yangi do'kon nomini kiriting:</b>\n\nBekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});
bot.action("edit_store_address", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = editStoreAddressStep;
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "📍 <b>Yangi manzilni kiriting:</b>\n\nBekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});
bot.action("edit_store_phone", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = editStorePhoneStep;
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "📞 <b>Yangi telefon raqamini kiriting:</b>\n\nBekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});

// ================ KATEGORIYA TANLASH ================
bot.action(/cat_(\d+)/, async (ctx) => {
  const categoryIndex = parseInt(ctx.match[1]);
  const category = CATEGORIES[categoryIndex];
  if (ctx.session && ctx.session.step === addCategoryStep) {
    if (!ctx.session.tempProduct) ctx.session.tempProduct = {};
    ctx.session.tempProduct.category = category;
    ctx.session.step = addNameStep;
    await ctx.answerCbQuery(`✅ ${category} tanlandi`);
    await ctx.editMessageText(
      `🆕 <b>Yangi mahsulot qo'shish</b>\n\n📂 Kategoriya: <b>${category}</b>\n\n1-qadam: <b>Mahsulot nomi</b> nima?`,
      { parse_mode: "HTML" }
    );
  } else if (ctx.session && ctx.session.step === editNewCategory) {
    const newCategory = CATEGORIES[categoryIndex];
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "category", newCategory);
    await ctx.answerCbQuery(`✅ ${newCategory} ga o'zgartirildi`);
    await ctx.editMessageText(
      "✅ <b>Mahsulot kategoriyasi yangilandi!</b>\n\n📂 Yangi kategoriya: " +
        newCategory
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  }
});

// ================ MAHSULOT TAHRIRLASH TUGMALARI ================
bot.action(/edit_select_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  const products = loadProducts(ctx.from.id);
  if (index >= 0 && index < products.length) {
    const product = products[index];
    if (!ctx.session) ctx.session = {};
    ctx.session.editData = { index: index, name: product.name };
    const keyboard = [
      [
        {
          text: "✏️ Nomini o'zgartirish",
          callback_data: `edit_field_name_${index}`,
        },
      ],
      [
        {
          text: "💰 Narxini o'zgartirish",
          callback_data: `edit_field_price_${index}`,
        },
      ],
      [
        {
          text: "📂 Kategoriyasini o'zgartirish",
          callback_data: `edit_field_category_${index}`,
        },
      ],
      [
        {
          text: "📦 Miqdorini o'zgartirish",
          callback_data: `edit_field_quantity_${index}`,
        },
      ],
      [
        {
          text: "⚖️ Birligini o'zgartirish",
          callback_data: `edit_field_unit_${index}`,
        },
      ],
    ];
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✏️ <b>${product.name}</b> tahrirlanmoqda\n\n📦 Nom: ${
        product.name
      }\n💰 Narx: ${product.price} so'm\n📦 Qolgan: ${product.quantity} ${
        product.unit === "kg" ? "kg" : "dona"
      }\n📂 Kategoriya: ${
        product.category
      }\n\nQaysi maydonni o'zgartirmoqchisiz?`,
      { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
    );
  }
});

bot.action(/edit_field_name_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewName;
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "✏️ <b>Yangi nomni kiriting:</b>\n\nBekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});
bot.action(/edit_field_price_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewPrice;
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "💰 <b>Yangi narxni kiriting:</b>\n\nBekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});
bot.action(/edit_field_category_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewCategory;
  const keyboard = getCategoryKeyboard();
  await ctx.answerCbQuery();
  await ctx.editMessageText("📂 <b>Yangi kategoriyani tanlang:</b>", {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: keyboard },
  });
});
bot.action(/edit_field_quantity_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewQuantity;
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "📦 <b>Yangi miqdorni kiriting:</b>\n\nMasalan: 50\n\nBekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});
bot.action(/edit_field_unit_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewUnit;
  await ctx.answerCbQuery();
  await ctx.editMessageText("⚖️ <b>Birlikni tanlang:</b>", {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⚖️ Kilogramm (kg)", callback_data: `set_unit_kg` },
          { text: "🔢 Dona", callback_data: `set_unit_piece` },
        ],
      ],
    },
  });
});

bot.action("set_unit_kg", async (ctx) => {
  if (ctx.session && ctx.session.step === editNewUnit) {
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "unit", "kg");
    await ctx.answerCbQuery("✅ Birlik: kg");
    await ctx.editMessageText(
      "✅ <b>Mahsulot birligi yangilandi!</b>\n\n⚖️ Yangi birlik: kg"
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  }
});
bot.action("set_unit_piece", async (ctx) => {
  if (ctx.session && ctx.session.step === editNewUnit) {
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "unit", "dona");
    await ctx.answerCbQuery("✅ Birlik: dona");
    await ctx.editMessageText(
      "✅ <b>Mahsulot birligi yangilandi!</b>\n\n🔢 Yangi birlik: dona"
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  }
});

// ================ MAHSULOT O'CHIRISH ================
bot.action(/delete_(\d+)/, async (ctx) => {
  const userId = ctx.from.id;
  const index = parseInt(ctx.match[1]);
  const products = loadProducts(userId);
  if (index >= 0 && index < products.length) {
    const deletedProduct = products[index];
    deleteProduct(userId, index);
    await ctx.answerCbQuery(`✅ ${deletedProduct.name} o'chirildi!`);
    await ctx.editMessageText(
      `✅ <b>Mahsulot o'chirildi!</b>\n\n🗑 <b>${deletedProduct.name}</b>`,
      { parse_mode: "HTML" }
    );
  } else {
    await ctx.answerCbQuery("Xatolik yuz berdi!", { show_alert: true });
  }
});

// ================ LINK ================
bot.command("link", async (ctx) => {
  const userId = ctx.from.id;
  await ctx.replyWithHTML(
    "🔗 <b>Sizning vitrina linkingiz:</b>\n<code>https://online-vitrina-bot.up.railway.app/${userId}</code>\n\nBu linkni mijozlaringizga yuboring!"
  );
});

// ================ YORDAM ================
bot.command("help", async (ctx) => {
  await ctx.replyWithHTML(
    "❓ <b>Yordam</b>\n\n" +
      "<b>🛒 BUYURTMA TIZIMI:</b>\n/stores - Do'konlar ro'yxati\n/cart - Savatni ko'rish\n/order - Buyurtma berish\n/myorders - Mening buyurtmalarim\n/storeorders - Do'konga kelgan buyurtmalar\n/orderstatus - Buyurtma holatini ko'rish\n\n" +
      "<b>🏪 DO'KON BOSHQARISH:</b>\n/setupstore - Do'kon ochish\n/mystore - Do'kon ma'lumotlari\n/editstore - Do'konni tahrirlash\n\n" +
      "<b>📦 MAHSULOT BOSHQARISH:</b>\n/addproduct - Mahsulot qo'shish (miqdor va birlik bilan)\n/myproducts - Mahsulotlarim\n/categories - Kategoriyalar\n/editproduct - Mahsulot tahrirlash\n/deleteproduct - Mahsulot o'chirish\n/lowstock - Tugayotgan mahsulotlar\n\n" +
      "<b>🔗 UMUMIY:</b>\n/dashboard - Asosiy menyu\n/profile - Mening profilim\n/link - Vitrina linkingiz\n/cancel - Amalni bekor qilish"
  );
});

// ================ CANCEL ================
bot.command("cancel", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = null;
  ctx.session.tempProduct = null;
  ctx.session.tempStore = null;
  ctx.session.editData = null;
  ctx.session.tempOrder = null;
  await ctx.replyWithHTML("❌ <b>Bekor qilindi!</b>");
});

// ================ SKIP BUYRUQI ================
bot.command("skip", async (ctx) => {
  if (ctx.session && ctx.session.step === addPhotoStep) {
    const userId = ctx.from.id;
    addOrUpdateProduct(userId, ctx.session.tempProduct);
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot rasm holda qo'shildi!</b>\n\n/addproduct"
    );
    ctx.session.step = null;
    ctx.session.tempProduct = null;
  }
});

// ================ ADMIN BUYRUQLARI ================
bot.command("admin", async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.replyWithHTML("❌ Bu funksiya faqat admin uchun!");
    return;
  }
  await ctx.replyWithHTML(
    "👑 <b>Admin panel</b>\n\n/adminusers - Foydalanuvchilar\n/adminstores - Do'konlar\n/adminstats - Statistika\n/adminbroadcast - Xabar\n/admindeleteuser - O'chirish"
  );
});
bot.command("adminstats", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  let usersCount = 0,
    storesCount = 0,
    productsCount = 0,
    ordersCount = 0;
  try {
    if (fs.existsSync(USERS_FILE))
      usersCount = Object.keys(
        JSON.parse(fs.readFileSync(USERS_FILE, "utf8"))
      ).length;
  } catch (e) {}
  try {
    if (fs.existsSync(STORES_FILE))
      storesCount = Object.keys(
        JSON.parse(fs.readFileSync(STORES_FILE, "utf8"))
      ).length;
  } catch (e) {}
  try {
    if (fs.existsSync(DATA_FILE)) {
      const p = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      for (const id in p) productsCount += p[id].length;
    }
  } catch (e) {}
  try {
    if (fs.existsSync(ORDERS_FILE))
      ordersCount = Object.keys(
        JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"))
      ).length;
  } catch (e) {}
  await ctx.replyWithHTML(
    "📊 <b>Umumiy statistika</b>\n\n👥 Foydalanuvchilar: " +
      usersCount +
      " ta\n🏪 Do'konlar: " +
      storesCount +
      " ta\n📦 Mahsulotlar: " +
      productsCount +
      " ta\n🛒 Buyurtmalar: " +
      ordersCount +
      " ta"
  );
});
bot.command("adminusers", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  try {
    if (!fs.existsSync(USERS_FILE)) {
      await ctx.replyWithHTML("📭 Hech qanday foydalanuvchi topilmadi!");
      return;
    }
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const userList = Object.entries(users);
    if (userList.length === 0) {
      await ctx.replyWithHTML("📭 Hech qanday foydalanuvchi topilmadi!");
      return;
    }
    let message = "👥 <b>Foydalanuvchilar ro‘yxati</b>\n\n";
    for (const [userId, user] of userList.slice(0, 20)) {
      message += `🆔 <code>${userId}</code>\n📛 ${user.firstName} ${
        user.lastName
      }\n📞 ${user.phone}\n🔹 @${user.username || "yo‘q"}\n───────────\n`;
    }
    if (userList.length > 20)
      message += `\n📊 Jami: ${userList.length} ta foydalanuvchi`;
    await ctx.replyWithHTML(message);
  } catch (error) {
    await ctx.replyWithHTML("❌ Xatolik yuz berdi!");
  }
});
bot.command("adminstores", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  try {
    if (!fs.existsSync(STORES_FILE)) {
      await ctx.replyWithHTML("📭 Hech qanday do‘kon topilmadi!");
      return;
    }
    const stores = JSON.parse(fs.readFileSync(STORES_FILE, "utf8"));
    const storeList = Object.entries(stores);
    if (storeList.length === 0) {
      await ctx.replyWithHTML("📭 Hech qanday do‘kon topilmadi!");
      return;
    }
    let message = "🏪 <b>Do‘konlar ro‘yxati</b>\n\n";
    for (const [ownerId, store] of storeList.slice(0, 20)) {
      message += `📛 <b>${store.name}</b>\n📍 ${store.address}\n📞 ${store.phone}\n👤 ID: <code>${ownerId}</code>\n───────────\n`;
    }
    if (storeList.length > 20)
      message += `\n📊 Jami: ${storeList.length} ta do‘kon`;
    await ctx.replyWithHTML(message);
  } catch (error) {
    await ctx.replyWithHTML("❌ Xatolik yuz berdi!");
  }
});
bot.command("adminbroadcast", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const messageText = ctx.message.text.replace("/adminbroadcast", "").trim();
  if (!messageText) {
    await ctx.replyWithHTML(
      "📢 <b>Xabar yuborish</b>\n\nFoydalanish: <code>/adminbroadcast Xabar matni</code>"
    );
    return;
  }
  try {
    if (!fs.existsSync(USERS_FILE)) {
      await ctx.replyWithHTML("❌ Hech qanday foydalanuvchi topilmadi!");
      return;
    }
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    let sent = 0,
      failed = 0;
    await ctx.replyWithHTML("📤 <b>Xabar yuborilmoqda...</b>");
    for (const userId in users) {
      try {
        await bot.telegram.sendMessage(
          userId,
          "📢 <b>Admin xabari</b>\n\n" + messageText,
          { parse_mode: "HTML" }
        );
        sent++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
      }
    }
    await ctx.replyWithHTML(
      "✅ <b>Xabar yuborish tugadi!</b>\n\n✅ Yuborildi: " +
        sent +
        " ta\n❌ Yuborilmadi: " +
        failed +
        " ta"
    );
  } catch (error) {
    await ctx.replyWithHTML("❌ Xatolik yuz berdi!");
  }
});
bot.command("admindeleteuser", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const userId = ctx.message.text.replace("/admindeleteuser", "").trim();
  if (!userId) {
    await ctx.replyWithHTML(
      "🗑 <b>Foydalanuvchi o‘chirish</b>\n\nFoydalanish: <code>/admindeleteuser USER_ID</code>"
    );
    return;
  }
  try {
    if (!fs.existsSync(USERS_FILE)) {
      await ctx.replyWithHTML("❌ Hech qanday foydalanuvchi topilmadi!");
      return;
    }
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    if (!users[userId]) {
      await ctx.replyWithHTML("❌ Foydalanuvchi topilmadi!");
      return;
    }
    delete users[userId];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    if (fs.existsSync(STORES_FILE)) {
      const stores = JSON.parse(fs.readFileSync(STORES_FILE, "utf8"));
      if (stores[userId]) delete stores[userId];
      fs.writeFileSync(STORES_FILE, JSON.stringify(stores, null, 2));
    }
    if (fs.existsSync(DATA_FILE)) {
      const products = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      if (products[userId]) delete products[userId];
      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
    }
    await ctx.replyWithHTML(
      `✅ <b>Foydalanuvchi o‘chirildi!</b>\n\n🆔 ID: <code>${userId}</code>`
    );
  } catch (error) {
    await ctx.replyWithHTML("❌ Xatolik yuz berdi!");
  }
});

// ================ TEXT HANDLER ================
bot.on("text", async (ctx, next) => {
  if (!ctx.session) ctx.session = {};

  // Ro'yxatdan o'tkazish
  if (ctx.session.step === regFirstNameStep) {
    const firstName = ctx.message.text.trim();
    if (firstName === "/cancel") return next();
    ctx.session.tempUser = { firstName };
    ctx.session.step = regLastNameStep;
    await ctx.replyWithHTML(
      "✅ Ism: " + firstName + "\n\n2-qadam: Familiyangiz?"
    );
    return;
  }
  if (ctx.session.step === regLastNameStep) {
    const lastName = ctx.message.text.trim();
    if (lastName === "/cancel") return next();
    ctx.session.tempUser.lastName = lastName;
    ctx.session.step = regPhoneStep;
    await ctx.replyWithHTML(
      "✅ Familiya: " + lastName + "\n\n3-qadam: Telefon raqamingiz?"
    );
    return;
  }
  if (ctx.session.step === regPhoneStep) {
    const phone = ctx.message.text.trim();
    if (phone === "/cancel") return next();
    ctx.session.tempUser.phone = phone;
    ctx.session.step = regUsernameStep;
    await ctx.replyWithHTML(
      "✅ Telefon: " +
        phone +
        "\n\n4-qadam: Telegram username? (yo'q bo'lsa /skip)"
    );
    return;
  }
  if (ctx.session.step === regUsernameStep) {
    let username = ctx.message.text.trim();
    if (username === "/skip") username = null;
    if (username === "/cancel") return next();
    ctx.session.tempUser.username = username;
    ctx.session.tempUser.registeredAt = new Date().toISOString();
    saveUser(ctx.from.id, ctx.session.tempUser);
    await ctx.replyWithHTML(
      "✅ Ro'yxatdan o'tish muvaffaqiyatli!\n\n/dashboard"
    );
    ctx.session.step = null;
    ctx.session.tempUser = null;
    return;
  }

  // Do'kon ro'yxatdan o'tkazish
  if (ctx.session.step === storeNameStep) {
    const name = ctx.message.text.trim();
    if (name === "/cancel") return next();
    ctx.session.tempStore = { name };
    ctx.session.step = storeAddressStep;
    await ctx.replyWithHTML(
      "✅ Do'kon nomi: " + name + "\n\n2-qadam: Do'kon manzili?"
    );
    return;
  }
  if (ctx.session.step === storeAddressStep) {
    const address = ctx.message.text.trim();
    if (address === "/cancel") return next();
    ctx.session.tempStore.address = address;
    ctx.session.step = storePhoneStep;
    await ctx.replyWithHTML(
      "✅ Manzil: " + address + "\n\n3-qadam: Telefon raqami?"
    );
    return;
  }
  if (ctx.session.step === storePhoneStep) {
    const phone = ctx.message.text.trim();
    if (phone === "/cancel") return next();
    ctx.session.tempStore.phone = phone;
    ctx.session.tempStore.registeredAt = new Date().toISOString();
    saveStore(ctx.from.id, ctx.session.tempStore);
    await ctx.replyWithHTML(
      "✅ Do'kon muvaffaqiyatli ro'yxatdan o'tdi!\n\n/mystore"
    );
    ctx.session.step = null;
    ctx.session.tempStore = null;
    return;
  }

  // Mahsulot qo'shish (nom, narx, miqdor, birlik)
  if (ctx.session.step === addNameStep) {
    const name = ctx.message.text.trim();
    if (name === "/cancel") return next();
    ctx.session.tempProduct.name = name;
    ctx.session.step = addPriceStep;
    await ctx.replyWithHTML(
      "✅ Nomi: " + name + "\n\n2-qadam: Narxi necha so'm?"
    );
    return;
  }
  if (ctx.session.step === addPriceStep) {
    const price = parseInt(ctx.message.text);
    if (isNaN(price)) {
      await ctx.replyWithHTML("❌ Faqat son kiriting!");
      return;
    }
    ctx.session.tempProduct.price = price;
    ctx.session.step = addQuantityStep;
    await ctx.replyWithHTML(
      "✅ Narxi: " + price + " so'm\n\n3-qadam: Qancha miqdorda? (masalan: 50)"
    );
    return;
  }
  if (ctx.session.step === addQuantityStep) {
    const quantity = parseFloat(ctx.message.text);
    if (isNaN(quantity) || quantity <= 0) {
      await ctx.replyWithHTML("❌ To'g'ri miqdor kiriting!");
      return;
    }
    ctx.session.tempProduct.quantity = quantity;
    ctx.session.step = addUnitStep;
    await ctx.replyWithHTML(
      "✅ Miqdor: " +
        quantity +
        "\n\n4-qadam: Birlikni tanlang:\n\n🔢 dona yoki ⚖️ kg?",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚖️ Kilogramm (kg)", callback_data: "unit_kg" },
              { text: "🔢 Dona", callback_data: "unit_piece" },
            ],
          ],
        },
      }
    );
    return;
  }

  // Mahsulot tahrirlash
  if (ctx.session.step === editNewName) {
    const newName = ctx.message.text.trim();
    if (newName === "/cancel") return next();
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "name", newName);
    await ctx.replyWithHTML("✅ Mahsulot nomi yangilandi!\n\n" + newName);
    ctx.session.step = null;
    ctx.session.editData = null;
    return;
  }
  if (ctx.session.step === editNewPrice) {
    const newPrice = parseInt(ctx.message.text);
    if (isNaN(newPrice)) {
      await ctx.replyWithHTML("❌ Faqat son kiriting!");
      return;
    }
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "price", newPrice);
    await ctx.replyWithHTML(
      "✅ Mahsulot narxi yangilandi!\n\n" + newPrice + " so'm"
    );
    ctx.session.step = null;
    ctx.session.editData = null;
    return;
  }
  if (ctx.session.step === editNewQuantity) {
    const newQuantity = parseFloat(ctx.message.text);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      await ctx.replyWithHTML("❌ To'g'ri miqdor kiriting!");
      return;
    }
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "quantity", newQuantity);
    await ctx.replyWithHTML(
      "✅ Mahsulot miqdori yangilandi!\n\n📦 Yangi miqdor: " + newQuantity
    );
    ctx.session.step = null;
    ctx.session.editData = null;
    return;
  }

  // Do'kon tahrirlash
  if (ctx.session.step === editStoreNameStep) {
    const newName = ctx.message.text.trim();
    if (newName === "/cancel") return next();
    const store = loadStore(ctx.from.id);
    if (store) {
      store.name = newName;
      saveStore(ctx.from.id, store);
    }
    await ctx.replyWithHTML("✅ Do'kon nomi yangilandi!\n\n" + newName);
    ctx.session.step = null;
    return;
  }
  if (ctx.session.step === editStoreAddressStep) {
    const newAddress = ctx.message.text.trim();
    if (newAddress === "/cancel") return next();
    const store = loadStore(ctx.from.id);
    if (store) {
      store.address = newAddress;
      saveStore(ctx.from.id, store);
    }
    await ctx.replyWithHTML("✅ Do'kon manzili yangilandi!\n\n" + newAddress);
    ctx.session.step = null;
    return;
  }
  if (ctx.session.step === editStorePhoneStep) {
    const newPhone = ctx.message.text.trim();
    if (newPhone === "/cancel") return next();
    const store = loadStore(ctx.from.id);
    if (store) {
      store.phone = newPhone;
      saveStore(ctx.from.id, store);
    }
    await ctx.replyWithHTML(
      "✅ Do'kon telefon raqami yangilandi!\n\n" + newPhone
    );
    ctx.session.step = null;
    return;
  }

  // Buyurtma manzil va telefon
  if (ctx.session.step === orderAddressStep) {
    const address = ctx.message.text.trim();
    if (address === "/cancel") return next();
    ctx.session.tempOrder = { address };
    ctx.session.step = orderPhoneStep;
    await ctx.replyWithHTML(
      "✅ Manzil: " + address + "\n\n2-qadam: Telefon raqamingiz?"
    );
    return;
  }
  if (ctx.session.step === orderPhoneStep) {
    const phone = ctx.message.text.trim();
    if (phone === "/cancel") return next();
    ctx.session.tempOrder.phone = phone;

    const userId = ctx.from.id;
    const user = loadUser(userId);
    const cart = loadCart(userId);
    if (cart.length === 0) {
      await ctx.replyWithHTML("❌ Savatingiz bo'sh!");
      ctx.session.step = null;
      return;
    }

    let total = 0;
    const orderItems = [];
    for (const item of cart) {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      orderItems.push({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        storeId: item.storeId,
      });
    }

    const orderData = {
      customerId: userId,
      customerName: `${user.firstName} ${user.lastName}`,
      customerPhone: phone,
      address: ctx.session.tempOrder.address,
      items: orderItems,
      total: total,
      storeId: cart[0]?.storeId,
    };
    const orderId = saveOrder(orderData);

    // Mahsulot miqdorlarini kamaytirish
    for (const item of cart) {
      const storeProducts = loadProducts(item.storeId);
      const productIndex = storeProducts.findIndex((p) => p.name === item.name);
      if (productIndex >= 0) {
        decreaseProductQuantity(
          item.storeId,
          item.name,
          storeProducts[productIndex].category,
          item.quantity
        );
      }
    }

    // Sotuvchiga xabar
    const storeId = cart[0]?.storeId;
    if (storeId) {
      try {
        await bot.telegram.sendMessage(
          storeId,
          "🆕 <b>Yangi buyurtma!</b>\n\n" +
            `🆔 Buyurtma ID: <code>${orderId}</code>\n` +
            `👤 Mijoz: ${user.firstName} ${user.lastName}\n` +
            `📞 Telefon: ${phone}\n` +
            `📍 Manzil: ${ctx.session.tempOrder.address}\n` +
            `💰 Jami: ${total.toLocaleString()} so'm\n\n` +
            `/storeorders - Barcha buyurtmalarni ko'rish`,
          { parse_mode: "HTML" }
        );
      } catch (e) {}
    }

    clearCart(userId);
    await ctx.replyWithHTML(
      "✅ <b>Buyurtma muvaffaqiyatli qabul qilindi!</b>\n\n🆔 Buyurtma ID: <code>" +
        orderId +
        "</code>\n💰 Jami: " +
        total.toLocaleString() +
        " so'm\n📍 Manzil: " +
        ctx.session.tempOrder.address +
        "\n\n📋 Buyurtma holatini kuzatish: /myorders"
    );
    ctx.session.step = null;
    ctx.session.tempOrder = null;
    return;
  }

  await next();
});

// ================ BIRLIK TANLASH ================
bot.action("unit_kg", async (ctx) => {
  if (ctx.session && ctx.session.step === addUnitStep) {
    ctx.session.tempProduct.unit = "kg";
    ctx.session.step = addPhotoStep;
    await ctx.answerCbQuery("✅ Birlik: kg");
    await ctx.editMessageText(
      "📦 Miqdor: " +
        ctx.session.tempProduct.quantity +
        " kg\n\n5-qadam: Mahsulot rasmini yuboring (rasm yoki /skip)",
      { parse_mode: "HTML" }
    );
  }
});
bot.action("unit_piece", async (ctx) => {
  if (ctx.session && ctx.session.step === addUnitStep) {
    ctx.session.tempProduct.unit = "dona";
    ctx.session.step = addPhotoStep;
    await ctx.answerCbQuery("✅ Birlik: dona");
    await ctx.editMessageText(
      "📦 Miqdor: " +
        ctx.session.tempProduct.quantity +
        " dona\n\n5-qadam: Mahsulot rasmini yuboring (rasm yoki /skip)",
      { parse_mode: "HTML" }
    );
  }
});

// ================ RASM QABUL QILISH ================
bot.on("photo", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  if (ctx.session.step === addPhotoStep) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;
    ctx.session.tempProduct.photo = fileId;
    const userId = ctx.from.id;
    const result = addOrUpdateProduct(userId, ctx.session.tempProduct);
    const actionText =
      result.action === "updated" ? "mavjud mahsulotga qo'shildi" : "qo'shildi";
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot muvaffaqiyatli " +
        actionText +
        "!</b>\n\n📂 " +
        ctx.session.tempProduct.category +
        "\n📦 " +
        ctx.session.tempProduct.name +
        "\n💰 " +
        ctx.session.tempProduct.price +
        " so'm\n📦 Miqdor: " +
        ctx.session.tempProduct.quantity +
        " " +
        (ctx.session.tempProduct.unit === "kg" ? "kg" : "dona") +
        "\n\n/addproduct - Yana qo'shish\n/myproducts - Mahsulotlarim"
    );
    ctx.session.step = null;
    ctx.session.tempProduct = null;
  }
});

// ================ BOTNI ISHGA TUSHIRISH ================
bot
  .launch()
  .then(() => console.log("✅ Bot ishga tushdi!"))
  .catch((err) => console.error("Xatolik:", err));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
