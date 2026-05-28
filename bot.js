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

// Buyurtma holatlari
const ORDER_STATUS = {
  NEW: "🆕 Yangi",
  PROCESSING: "⏳ Jarayonda",
  SHIPPED: "🚚 Yuborilgan",
  DELIVERED: "✅ Yetkazilgan",
  CANCELLED: "❌ Bekor qilingan",
};

// Buyurtmani saqlash
function saveOrder(orderData) {
  try {
    let allOrders = {};
    if (fs.existsSync(ORDERS_FILE)) {
      allOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
    }
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

// Buyurtmalarni o'qish
function loadOrders(userId, role = "customer") {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const allOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
      const filtered = {};
      for (const [id, order] of Object.entries(allOrders)) {
        if (role === "customer" && order.customerId === userId) {
          filtered[id] = order;
        } else if (role === "seller" && order.storeId === userId) {
          filtered[id] = order;
        }
      }
      return filtered;
    }
  } catch (error) {
    console.error("Buyurtmalarni o'qishda xatolik:", error);
  }
  return {};
}

// Buyurtma holatini yangilash
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

// Bitta buyurtmani olish
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
    if (fs.existsSync(CART_FILE)) {
      allCarts = JSON.parse(fs.readFileSync(CART_FILE, "utf8"));
    }
    allCarts[userId] = cart;
    fs.writeFileSync(CART_FILE, JSON.stringify(allCarts, null, 2));
  } catch (error) {
    console.error("Savatchani saqlashda xatolik:", error);
  }
}

function addToCart(userId, product, storeId, storeName, quantity = 1) {
  const cart = loadCart(userId);
  const existingIndex = cart.findIndex((item) => item.productId === product.id);

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      storeId: storeId,
      storeName: storeName,
    });
  }
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

// ================ BUYURTMA BERISH HOLATLARI ================
const orderAddressStep = "order_address";
const orderPhoneStep = "order_phone";

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

// O'lchov birliklari
const UNITS = [
  { text: "⚖️ kg", value: "kg" },
  { text: "🔢 dona", value: "dona" },
  { text: "📦 paket", value: "paket" },
  { text: "🥤 litr", value: "litr" },
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
    if (fs.existsSync(USERS_FILE)) {
      allUsers = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    }
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
    if (fs.existsSync(STORES_FILE)) {
      allStores = JSON.parse(fs.readFileSync(STORES_FILE, "utf8"));
    }
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
    if (fs.existsSync(STORES_FILE)) {
      return JSON.parse(fs.readFileSync(STORES_FILE, "utf8"));
    }
  } catch (error) {
    console.error("Barcha do‘konlarni o‘qishda xatolik:", error);
  }
  return {};
}

// ================ MAHSULOT MA'LUMOTLARI (YANGILANGAN) ================
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
    if (fs.existsSync(DATA_FILE)) {
      allData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
    allData[userId] = products;
    fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));
  } catch (error) {
    console.error("Mahsulotlarni saqlashda xatolik:", error);
  }
}

// Yangi mahsulot qo'shish (agar mavjud bo'lsa miqdorini oshiradi)
function addOrUpdateProduct(userId, newProduct) {
  const products = loadProducts(userId);
  const existingIndex = products.findIndex(
    (p) =>
      p.name.toLowerCase() === newProduct.name.toLowerCase() &&
      p.category === newProduct.category &&
      p.unit === newProduct.unit
  );

  if (existingIndex >= 0) {
    // Mavjud mahsulotga qo'shish
    products[existingIndex].quantity += newProduct.quantity;
    if (newProduct.price) products[existingIndex].price = newProduct.price;
    if (newProduct.photo) products[existingIndex].photo = newProduct.photo;
    saveProducts(userId, products);
    return {
      isNew: false,
      product: products[existingIndex],
      index: existingIndex,
    };
  } else {
    // Yangi mahsulot
    products.push(newProduct);
    saveProducts(userId, products);
    return { isNew: true, product: newProduct, index: products.length - 1 };
  }
}

// Mahsulot miqdorini kamaytirish (buyurtma berilganda)
function decreaseProductQuantity(userId, productIndex, quantity) {
  const products = loadProducts(userId);
  if (productIndex >= 0 && productIndex < products.length) {
    const product = products[productIndex];
    const newQuantity = product.quantity - quantity;

    if (newQuantity <= 0) {
      // Mahsulot tugagan - o'chirish
      products.splice(productIndex, 1);
      saveProducts(userId, products);
      return { deleted: true, productName: product.name };
    } else {
      product.quantity = newQuantity;
      saveProducts(userId, products);
      return { deleted: false, product: product, newQuantity: newQuantity };
    }
  }
  return { deleted: false, error: true };
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

// Tugayotgan mahsulotlarni aniqlash (10% dan kam qolganda)
function getLowStockProducts(userId) {
  const products = loadProducts(userId);
  return products.filter((p) => p.quantity < p.initialQuantity * 0.1);
}

// Mahsulot statistikasi
function getProductStats(userId) {
  const products = loadProducts(userId);
  let totalProducts = products.length;
  let totalQuantity = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    totalQuantity += p.quantity;
    totalValue += p.price * p.quantity;
    if (p.quantity === 0) outOfStockCount++;
    else if (p.quantity < p.initialQuantity * 0.1) lowStockCount++;
  }

  return {
    totalProducts,
    totalQuantity,
    totalValue,
    lowStockCount,
    outOfStockCount,
  };
}

// ================ RO'YXATDAN O'TKAZISH HOLATLARI ================
const regFirstNameStep = "reg_firstname";
const regLastNameStep = "reg_lastname";
const regPhoneStep = "reg_phone";
const regUsernameStep = "reg_username";

// ================ MAHSULOT QO'SHISH HOLATLARI ================
const addCategoryStep = "add_category";
const addNameStep = "add_name";
const addPriceStep = "add_price";
const addQuantityStep = "add_quantity";
const addUnitStep = "add_unit";
const addPhotoStep = "add_photo";

// ================ MAHSULOT TAHRIRLASH HOLATLARI ================
const editNewName = "edit_new_name";
const editNewPrice = "edit_new_price";
const editNewCategory = "edit_new_category";
const editNewQuantity = "edit_new_quantity";

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

// O'lchov birligi tugmalari
function getUnitKeyboard() {
  const keyboard = [];
  for (let i = 0; i < UNITS.length; i += 2) {
    const row = [];
    if (UNITS[i])
      row.push({
        text: UNITS[i].text,
        callback_data: `unit_${UNITS[i].value}`,
      });
    if (UNITS[i + 1])
      row.push({
        text: UNITS[i + 1].text,
        callback_data: `unit_${UNITS[i + 1].value}`,
      });
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
  const lowStock = store ? getLowStockProducts(userId) : [];

  let message = "🏪 <b>Boshqaruv paneli (Dashboard)</b>\n\n";
  message += `👋 Salom, <b>${user.firstName} ${user.lastName}</b>!\n\n`;

  // Tugayotgan mahsulotlar haqida ogohlantirish
  if (lowStock.length > 0) {
    message += "⚠️ <b>Diqqat! Quyidagi mahsulotlar tugayapti:</b>\n";
    for (const p of lowStock.slice(0, 5)) {
      message += `   • ${p.name} - ${p.quantity} ${p.unit} qolgan\n`;
    }
    message += "\n";
  }

  let keyboard = [];

  // Umumiy tugmalar
  keyboard.push([
    { text: "📋 Mening profilim", callback_data: "menu_profile" },
  ]);
  keyboard.push([{ text: "🛒 Savatim", callback_data: "menu_cart" }]);
  keyboard.push([
    { text: "📋 Mening buyurtmalarim", callback_data: "menu_myorders" },
  ]);

  // Agar do'koni bo'lsa (sotuvchi)
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
      { text: "📊 Mahsulot statistikasi", callback_data: "menu_productstats" },
    ]);
  } else {
    keyboard.push([
      { text: "🏪 Do'kon ochish", callback_data: "menu_createstore" },
    ]);
  }

  // Do'konlar ro'yxati
  keyboard.push([
    { text: "🏬 Do'konlar ro'yxati", callback_data: "menu_stores" },
  ]);

  // Admin tugmasi
  if (isAdminUser) {
    keyboard.push([{ text: "👑 Admin panel", callback_data: "menu_admin" }]);
  }

  keyboard.push([{ text: "❓ Yordam", callback_data: "menu_help" }]);

  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

// ================ MAHSULOT STATISTIKASI ================
bot.action("menu_productstats", async (ctx) => {
  const userId = ctx.from.id;
  const stats = getProductStats(userId);
  const lowStock = getLowStockProducts(userId);

  let message = "📊 <b>Mahsulot statistikasi</b>\n\n";
  message += `📦 Jami mahsulot turlari: ${stats.totalProducts}\n`;
  message += `📦 Jami miqdor: ${stats.totalQuantity}\n`;
  message += `💰 Jami qiymat: ${stats.totalValue.toLocaleString()} so'm\n`;
  message += `⚠️ Tugayotganlar: ${stats.lowStockCount}\n`;
  message += `❌ Tugaganlar: ${stats.outOfStockCount}\n\n`;

  if (lowStock.length > 0) {
    message += "<b>⚠️ Tugayotgan mahsulotlar:</b>\n";
    for (const p of lowStock) {
      message += `   • ${p.name} - ${p.quantity} ${p.unit} qolgan\n`;
    }
  }

  await ctx.answerCbQuery();
  await ctx.replyWithHTML(message);
});

// ================ START BUYRUQI ================
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const existingUser = loadUser(userId);

  if (existingUser) {
    await showDashboard(ctx);
  } else {
    if (!ctx.session) ctx.session = {};
    ctx.session.step = regFirstNameStep;
    await ctx.replyWithHTML(
      "🏪 <b>Online Vitrina Botiga xush kelibsiz!</b>\n\n" +
        "Iltimos, ro'yxatdan o'ting.\n\n" +
        "1-qadam: <b>Ismingiz</b> nima?\n\n" +
        "Masalan: <i>Azimjon</i>\n\n" +
        "Bekor qilish uchun /cancel"
    );
  }
});

// ================ DASHBOARD BUYRUQI ================
bot.command("dashboard", async (ctx) => {
  const user = loadUser(ctx.from.id);
  if (!user) {
    await ctx.replyWithHTML("❌ Iltimos, avval ro'yxatdan o'ting: /start");
    return;
  }
  await showDashboard(ctx);
});

// ================ PROFIL BUYRUQI ================
bot.command("profile", async (ctx) => {
  const userId = ctx.from.id;
  const user = loadUser(userId);

  if (!user) {
    await ctx.replyWithHTML("❌ Iltimos, avval ro'yxatdan o'ting: /start");
    return;
  }

  let message = "👤 <b>Mening profilim</b>\n\n";
  message += `📛 Ism: ${user.firstName}\n`;
  message += `📛 Familiya: ${user.lastName}\n`;
  message += `📞 Telefon: ${user.phone}\n`;
  message += `🔹 Telegram: ${user.username ? "@" + user.username : "Yo‘q"}\n`;
  message += `📅 Ro'yxatdan o'tgan: ${new Date(
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

bot.action("menu_admin", async (ctx) => {
  await ctx.answerCbQuery();
  if (isAdmin(ctx.from.id)) {
    await ctx.replyWithHTML(
      "👑 <b>Admin panel</b>\n\n" +
        "/adminusers - Foydalanuvchilar ro'yxati\n" +
        "/adminstores - Do'konlar ro'yxati\n" +
        "/adminstats - Umumiy statistika\n" +
        "/adminbroadcast - Xabar yuborish\n" +
        "/admindeleteuser - Foydalanuvchi o‘chirish"
    );
  } else {
    await ctx.replyWithHTML("❌ Bu funksiya faqat admin uchun!");
  }
});

bot.action("menu_help", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML("❓ Yordam uchun /help");
});

// ================ BUYURTMA FUNKSIYALARI ================
bot.command("cart", async (ctx) => {
  const userId = ctx.from.id;
  const cart = loadCart(userId);

  if (cart.length === 0) {
    await ctx.replyWithHTML(
      "🛒 <b>Savat</b>\n\n📭 Savatingiz bo'sh!\n\nMahsulot qo'shish uchun do'konlarni ko'ring: /stores"
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
    } = ${subtotal.toLocaleString()} so'm\n`;
    message += `   🏪 ${item.storeName}\n`;
    keyboard.push([
      { text: `❌ ${item.name} o'chirish`, callback_data: `cart_remove_${i}` },
    ]);
  }

  message += `\n💰 <b>Jami: ${total.toLocaleString()} so'm</b>\n\n`;
  message += "📦 Buyurtma berish uchun /order";

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
    await ctx.replyWithHTML(
      "❌ Savatingiz bo'sh! Avval mahsulot qo'shing: /stores"
    );
    return;
  }

  if (!ctx.session) ctx.session = {};
  ctx.session.step = orderAddressStep;

  await ctx.replyWithHTML(
    "📦 <b>Buyurtma berish</b>\n\n" +
      "1-qadam: <b>Yetkazib berish manzilingizni</b> kiriting:\n\n" +
      "Masalan: <i>Toshkent sh., Chilonzor t., 12-uy</i>\n\n" +
      "Bekor qilish uchun /cancel"
  );
});

bot.command("myorders", async (ctx) => {
  const userId = ctx.from.id;
  const orders = loadOrders(userId, "customer");

  if (Object.keys(orders).length === 0) {
    await ctx.replyWithHTML(
      "📭 <b>Sizning buyurtmalaringiz</b>\n\nHozircha hech qanday buyurtma yo'q!\n\nBuyurtma berish: /stores"
    );
    return;
  }

  let message = "📋 <b>Sizning buyurtmalaringiz</b>\n\n";
  for (const [id, order] of Object.entries(orders).reverse().slice(0, 10)) {
    message += `🆔 <code>${id}</code>\n`;
    message += `📦 ${order.items.length} ta mahsulot\n`;
    message += `💰 Jami: ${order.total.toLocaleString()} so'm\n`;
    message += `📊 Holat: ${order.status}\n`;
    message += `📅 Sana: ${new Date(order.createdAt).toLocaleDateString()}\n`;
    message += `───────────\n`;
  }

  await ctx.replyWithHTML(message);
});

bot.command("storeorders", async (ctx) => {
  const userId = ctx.from.id;
  const store = loadStore(userId);

  if (!store) {
    await ctx.replyWithHTML(
      "❌ Siz do'kon ochmagansiz! Do'kon ochish: /setupstore"
    );
    return;
  }

  const orders = loadOrders(userId, "seller");

  if (Object.keys(orders).length === 0) {
    await ctx.replyWithHTML(
      "📭 <b>Do'koningizga kelgan buyurtmalar</b>\n\nHozircha hech qanday buyurtma yo'q!"
    );
    return;
  }

  let message = "📋 <b>Do'koningizga kelgan buyurtmalar</b>\n\n";
  const keyboard = [];

  for (const [id, order] of Object.entries(orders).reverse().slice(0, 10)) {
    message += `🆔 <code>${id}</code>\n`;
    message += `📦 ${order.items.length} ta mahsulot\n`;
    message += `💰 Jami: ${order.total.toLocaleString()} so'm\n`;
    message += `📊 Holat: ${order.status}\n`;
    message += `👤 Mijoz: ${order.customerName}\n`;
    message += `📍 Manzil: ${order.address}\n`;
    message += `───────────\n`;
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
  const userId = ctx.from.id;
  const orderId = ctx.message.text.replace("/orderstatus", "").trim();

  if (!orderId) {
    await ctx.replyWithHTML(
      "🔍 <b>Buyurtma holatini ko'rish</b>\n\n" +
        "Foydalanish: <code>/orderstatus BUYURTMA_ID</code>\n\n" +
        "Misol: <code>/orderstatus 1748451234567</code>\n\n" +
        "Buyurtma ID ni /myorders dan olishingiz mumkin."
    );
    return;
  }

  const order = getOrder(orderId);

  if (!order) {
    await ctx.replyWithHTML(
      "❌ <b>Buyurtma topilmadi!</b>\n\nBuyurtma ID ni tekshiring."
    );
    return;
  }

  if (order.customerId !== userId && !isAdmin(userId)) {
    await ctx.replyWithHTML("❌ Bu buyurtma sizga tegishli emas!");
    return;
  }

  let message = "🔍 <b>Buyurtma ma'lumotlari</b>\n\n";
  message += `🆔 ID: <code>${order.id}</code>\n`;
  message += `📊 Holat: ${order.status}\n`;
  message += `💰 Jami: ${order.total.toLocaleString()} so'm\n`;
  message += `👤 Mijoz: ${order.customerName}\n`;
  message += `📞 Telefon: ${order.customerPhone}\n`;
  message += `📍 Manzil: ${order.address}\n`;
  message += `📅 Sana: ${new Date(order.createdAt).toLocaleString()}\n\n`;
  message += `<b>📦 Mahsulotlar:</b>\n`;

  for (const item of order.items) {
    message += `  • ${item.name} x ${item.quantity} = ${(
      item.price * item.quantity
    ).toLocaleString()} so'm\n`;
  }

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
        `📦 <b>Buyurtma holati yangilandi!</b>\n\n` +
          `🆔 Buyurtma ID: <code>${orderId}</code>\n` +
          `📊 Yangi holat: ${newStatus}\n\n` +
          `Batafsil: /orderstatus ${orderId}`,
        { parse_mode: "HTML" }
      );
    } catch (e) {}
  }

  await ctx.answerCbQuery(`✅ Holat "${newStatus}" ga o'zgartirildi!`);
  await ctx.editMessageText(
    `✅ Buyurtma holati yangilandi!\n\n🆔 ${orderId}\n📊 Yangi holat: ${newStatus}`
  );
});

// ================ MAHSULOTNI SAVATGA QO'SHISH (MIQDOR BILAN) ================
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

  // Miqdorni so'rash
  if (!ctx.session) ctx.session = {};
  ctx.session.tempCart = {
    storeId: storeId,
    productId: `${storeId}_${productIndex}`,
    productName: product.name,
    productPrice: product.price,
    storeName: store.name,
  };
  ctx.session.step = "cart_quantity";

  await ctx.answerCbQuery();
  await ctx.replyWithHTML(
    `📦 <b>${product.name}</b> - ${product.price.toLocaleString()} so'm/${
      product.unit
    }\n\n` +
      `Qancha miqdorda sotib olmoqchisiz?\n` +
      `Mavjud: ${product.quantity} ${product.unit}\n\n` +
      `Miqdorni kiriting (masalan: 2):`
  );
});

// Savatga miqdor qo'shish (text handler da)

// ================ DO'KON MAHSULOTLARINI KO'RISH (MIQDOR BILAN) ================
bot.action(/view_store_(.+)/, async (ctx) => {
  const storeId = ctx.match[1];
  const store = loadStore(storeId);
  const products = loadProducts(storeId);

  if (!store) {
    await ctx.answerCbQuery("Do'kon topilmadi!");
    return;
  }

  let message = `🏪 <b>${store.name}</b>\n\n`;
  message += `📍 ${store.address}\n`;
  message += `📞 ${store.phone}\n\n`;
  message += `<b>📦 Mahsulotlar:</b>\n`;

  const keyboard = [];

  if (products.length === 0) {
    message += "Hozircha mahsulot yo‘q.";
  } else {
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const stockIcon =
        p.quantity <= 0
          ? "❌"
          : p.quantity < p.initialQuantity * 0.1
          ? "⚠️"
          : "✅";
      message += `${i + 1}. ${stockIcon} ${
        p.name
      } - ${p.price.toLocaleString()} so'm/${p.unit} (${p.quantity} ${
        p.unit
      } qolgan)\n`;
      if (p.quantity > 0) {
        keyboard.push([
          {
            text: `➕ ${p.name} savatga`,
            callback_data: `add_to_cart_${storeId}_${i}`,
          },
        ]);
      }
    }
  }

  await ctx.answerCbQuery();
  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ================ DO'KON RO'YXATDAN O'TKAZISH ================
bot.command("setupstore", async (ctx) => {
  const userId = ctx.from.id;
  const existingStore = loadStore(userId);

  if (existingStore) {
    await ctx.replyWithHTML(
      "🏪 <b>Siz allaqachon do‘kon ro‘yxatdan o‘tkazgansiz!</b>\n\n" +
        `📛 Do‘kon nomi: ${existingStore.name}\n` +
        `📍 Manzil: ${existingStore.address}\n` +
        `📞 Telefon: ${existingStore.phone}\n\n` +
        "Ma'lumotlarni o‘zgartirish uchun /editstore"
    );
    return;
  }

  if (!ctx.session) ctx.session = {};
  ctx.session.step = storeNameStep;

  await ctx.replyWithHTML(
    "🏪 <b>Do‘kon ro‘yxatdan o‘tkazish</b>\n\n" +
      "1-qadam: <b>Do‘kon nomi</b> nima?\n\n" +
      "Masalan: <i>Salimning mevalari</i>\n\n" +
      "Bekor qilish uchun /cancel"
  );
});

// ================ DO'KON MA'LUMOTLARINI KO'RISH ================
bot.command("mystore", async (ctx) => {
  const userId = ctx.from.id;
  const store = loadStore(userId);

  if (!store) {
    await ctx.replyWithHTML(
      "🏪 <b>Siz hali do‘kon ro‘yxatdan o‘tkazmagansiz!</b>\n\nDo‘kon ro‘yxatdan o‘tkazish uchun: /setupstore"
    );
    return;
  }

  let message = "🏪 <b>Sizning do‘koningiz</b>\n\n";
  message += `📛 <b>Nomi:</b> ${store.name}\n`;
  message += `📍 <b>Manzil:</b> ${store.address}\n`;
  message += `📞 <b>Telefon:</b> ${store.phone}\n`;
  message += `📅 <b>Ro‘yxatdan o‘tgan:</b> ${new Date(
    store.registeredAt
  ).toLocaleDateString()}\n\n`;
  message += "Ma'lumotlarni o‘zgartirish: /editstore";

  await ctx.replyWithHTML(message);
});

// ================ DO'KON MA'LUMOTLARINI TAHRIRLASH ================
bot.command("editstore", async (ctx) => {
  const userId = ctx.from.id;
  const store = loadStore(userId);

  if (!store) {
    await ctx.replyWithHTML(
      "🏪 <b>Siz hali do‘kon ro‘yxatdan o‘tkazmagansiz!</b>\n\nDo‘kon ro‘yxatdan o‘tkazish uchun: /setupstore"
    );
    return;
  }

  const keyboard = [
    [{ text: "📛 Nomini o'zgartirish", callback_data: "edit_store_name" }],
    [{ text: "📍 Manzilni o'zgartirish", callback_data: "edit_store_address" }],
    [{ text: "📞 Telefonni o'zgartirish", callback_data: "edit_store_phone" }],
  ];

  await ctx.replyWithHTML(
    `✏️ <b>${store.name}</b> do‘kon ma'lumotlarini tahrirlash\n\n` +
      `📛 Hozirgi nom: ${store.name}\n` +
      `📍 Hozirgi manzil: ${store.address}\n` +
      `📞 Hozirgi telefon: ${store.phone}\n\n` +
      `Qaysi ma'lumotni o'zgartirmoqchisiz?`,
    { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
  );
});

// ================ MAHSULOT QO'SHISH (YANGI - MIQDOR VA O'LCHOV BIRLIGI BILAN) ================
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
    {
      reply_markup: { inline_keyboard: keyboard },
    }
  );
});

// ================ MAHSULOTLARNI KO'RISH (MIQDOR BILAN) ================
bot.command("myproducts", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);

  if (products.length === 0) {
    await ctx.replyWithHTML(
      "📭 <b>Siz hali hech qanday mahsulot qo‘shmagansiz!</b>\n\nMahsulot qo‘shish uchun: /addproduct"
    );
    return;
  }

  const grouped = {};
  for (const p of products) {
    const cat = p.category || "📦 Boshqa";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  let message = "📦 <b>Sizning mahsulotlaringiz</b>\n\n";
  for (const [cat, items] of Object.entries(grouped)) {
    message += `📂 ${cat}:\n`;
    for (let i = 0; i < items.length; i++) {
      const stockIcon =
        items[i].quantity <= 0
          ? "❌"
          : items[i].quantity < items[i].initialQuantity * 0.1
          ? "⚠️"
          : "✅";
      message += `  ${i + 1}. ${stockIcon} <b>${items[i].name}</b> - ${items[
        i
      ].price.toLocaleString()} so'm/${items[i].unit} (${items[i].quantity} ${
        items[i].unit
      } qolgan)\n`;
    }
    message += `\n`;
  }

  await ctx.replyWithHTML(message);
});

// ================ KATEGORIYALARNI KO'RISH ================
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
  for (let i = 0; i < CATEGORIES.length; i++) {
    keyboard.push([{ text: CATEGORIES[i], callback_data: `view_cat_${i}` }]);
  }

  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ================ KATEGORIYA BO'YICHA KO'RISH ================
bot.action(/view_cat_(\d+)/, async (ctx) => {
  const categoryIndex = parseInt(ctx.match[1]);
  const category = CATEGORIES[categoryIndex];
  const userId = ctx.from.id;
  const products = getProductsByCategory(userId, category);

  if (products.length === 0) {
    await ctx.answerCbQuery(`📭 ${category} da mahsulot yo‘q`);
    await ctx.editMessageText(
      `📂 <b>${category}</b>\n\n📭 Bu kategoriyada hozircha mahsulot yo‘q.\n\nMahsulot qo‘shish uchun /addproduct`,
      { parse_mode: "HTML" }
    );
    return;
  }

  let message = `📂 <b>${category}</b>\n\n`;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const stockIcon =
      p.quantity <= 0
        ? "❌"
        : p.quantity < p.initialQuantity * 0.1
        ? "⚠️"
        : "✅";
    message += `${i + 1}. ${stockIcon} <b>${
      p.name
    }</b> - ${p.price.toLocaleString()} so'm/${p.unit} (${p.quantity} ${
      p.unit
    } qolgan)\n`;
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, { parse_mode: "HTML" });
});

// ================ MAHSULOT TAHRIRLASH (YANGI - MIQDOR BILAN) ================
bot.command("editproduct", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);

  if (products.length === 0) {
    await ctx.replyWithHTML(
      "📭 <b>Tahrirlash uchun hech qanday mahsulot yo‘q!</b>\n\nMahsulot qo‘shish uchun: /addproduct"
    );
    return;
  }

  let message = "✏️ <b>Qaysi mahsulotni tahrirlamoqchisiz?</b>\n\n";
  const keyboard = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. ${p.name} - ${p.price.toLocaleString()} so'm/${
      p.unit
    } (${p.quantity} ${p.unit} qolgan) [${p.category || "📦 Boshqa"}]\n`;
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
    await ctx.replyWithHTML(
      "📭 <b>Sizda o‘chirish uchun hech qanday mahsulot yo‘q!</b>\n\nMahsulot qo‘shish uchun: /addproduct"
    );
    return;
  }

  let message = "🗑 <b>Qaysi mahsulotni o‘chirmoqchisiz?</b>\n\n";
  const keyboard = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. ${p.name} - ${p.price.toLocaleString()} so'm/${
      p.unit
    } (${p.quantity} ${p.unit} qolgan)\n`;
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
    await ctx.replyWithHTML(
      "🏬 <b>Hozircha hech qanday do‘kon mavjud emas!</b>"
    );
    return;
  }

  let message = "🏬 <b>Barcha do‘konlar</b>\n\n";
  const keyboard = [];

  for (const [userId, store] of storeList) {
    message += `📛 <b>${store.name}</b>\n`;
    message += `📍 ${store.address}\n`;
    message += `📞 ${store.phone}\n`;
    message += `───────────\n`;
    keyboard.push([
      { text: `🏪 ${store.name}`, callback_data: `view_store_${userId}` },
    ]);
  }

  await ctx.replyWithHTML(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ================ LINK ================
bot.command("link", async (ctx) => {
  const userId = ctx.from.id;
  await ctx.replyWithHTML(
    "🔗 <b>Sizning vitrina linkingiz:</b>\n" +
      `<code>https://online-vitrina-bot-production.up.railway.app/${userId}</code>\n\n` +
      "Bu linkni mijozlaringizga yuboring!"
  );
});

// ================ YORDAM ================
bot.command("help", async (ctx) => {
  await ctx.replyWithHTML(
    "❓ <b>Yordam</b>\n\n" +
      "<b>🛒 BUYURTMA TIZIMI:</b>\n" +
      "/stores - Do'konlar ro'yxati\n" +
      "/cart - Savatni ko'rish\n" +
      "/order - Buyurtma berish\n" +
      "/myorders - Mening buyurtmalarim\n" +
      "/storeorders - Do'konga kelgan buyurtmalar (sotuvchi)\n" +
      "/orderstatus - Buyurtma holatini ko'rish\n\n" +
      "<b>🏪 DO'KON BOSHQARISH:</b>\n" +
      "/setupstore - Do'kon ochish\n" +
      "/mystore - Do'kon ma'lumotlari\n" +
      "/editstore - Do'konni tahrirlash\n\n" +
      "<b>📦 MAHSULOT BOSHQARISH:</b>\n" +
      "/addproduct - Mahsulot qo'shish (kategoriya, nom, narx, miqdor, o'lchov birligi, rasm)\n" +
      "/myproducts - Mahsulotlarimni ko'rish (miqdor bilan)\n" +
      "/categories - Kategoriyalar\n" +
      "/editproduct - Mahsulot tahrirlash\n" +
      "/deleteproduct - Mahsulot o'chirish\n" +
      "/productstats - Mahsulot statistikasi (tugayotganlar, tugaganlar)\n\n" +
      "<b>🔗 UMUMIY:</b>\n" +
      "/dashboard - Asosiy menyu\n" +
      "/profile - Mening profilim\n" +
      "/link - Vitrina linkingiz\n" +
      "/cancel - Amalni bekor qilish"
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
  ctx.session.tempCart = null;
  await ctx.replyWithHTML("❌ <b>Bekor qilindi!</b>");
});

// ================ ADMIN BUYRUQLARI ================
bot.command("admin", async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.replyWithHTML("❌ Bu funksiya faqat admin uchun!");
    return;
  }

  await ctx.replyWithHTML(
    "👑 <b>Admin panel</b>\n\n" +
      "/adminusers - Foydalanuvchilar ro'yxati\n" +
      "/adminstores - Do'konlar ro'yxati\n" +
      "/adminstats - Umumiy statistika\n" +
      "/adminbroadcast - Xabar yuborish\n" +
      "/admindeleteuser - Foydalanuvchi o‘chirish"
  );
});

bot.command("adminstats", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;

  let usersCount = 0,
    storesCount = 0,
    productsCount = 0,
    ordersCount = 0,
    totalQuantity = 0;

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
      for (const id in p) {
        productsCount += p[id].length;
        for (const prod of p[id]) {
          totalQuantity += prod.quantity;
        }
      }
    }
  } catch (e) {}
  try {
    if (fs.existsSync(ORDERS_FILE))
      ordersCount = Object.keys(
        JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"))
      ).length;
  } catch (e) {}

  await ctx.replyWithHTML(
    "📊 <b>Umumiy statistika</b>\n\n" +
      `👥 Foydalanuvchilar: <b>${usersCount}</b> ta\n` +
      `🏪 Do'konlar: <b>${storesCount}</b> ta\n` +
      `📦 Mahsulot turlari: <b>${productsCount}</b> ta\n` +
      `📦 Jami mahsulot miqdori: <b>${totalQuantity}</b>\n` +
      `🛒 Buyurtmalar: <b>${ordersCount}</b> ta`
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
      "🗑 <b>Foydalanuvchi o‘chirish</b>\n\nFoydalanish: <code>/admindeleteuser USER_ID</code>\n\nUSER_ID ni /adminusers dan olishingiz mumkin."
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

// ================ TEXT HANDLER (YANGILANGAN) ================
bot.on("text", async (ctx, next) => {
  if (!ctx.session) ctx.session = {};

  // Savatga miqdor qo'shish
  if (ctx.session.step === "cart_quantity") {
    const quantity = parseFloat(ctx.message.text.trim());
    if (isNaN(quantity) || quantity <= 0) {
      await ctx.replyWithHTML(
        "❌ <b>Noto'g'ri miqdor!</b>\n\nIltimos, faqat musbat son kiriting."
      );
      return;
    }

    const store = loadStore(ctx.session.tempCart.storeId);
    const products = loadProducts(ctx.session.tempCart.storeId);
    const productIndex = parseInt(ctx.session.tempCart.productId.split("_")[1]);
    const product = products[productIndex];

    if (!product) {
      await ctx.replyWithHTML("❌ Mahsulot topilmadi!");
      ctx.session.step = null;
      return;
    }

    if (product.quantity < quantity) {
      await ctx.replyWithHTML(
        `❌ <b>Yetarli mahsulot yo'q!</b>\n\nMavjud: ${product.quantity} ${product.unit}\nSiz: ${quantity} ${product.unit} so'rayapsiz.`
      );
      ctx.session.step = null;
      return;
    }

    addToCart(
      ctx.from.id,
      {
        id: ctx.session.tempCart.productId,
        name: ctx.session.tempCart.productName,
        price: ctx.session.tempCart.productPrice,
      },
      ctx.session.tempCart.storeId,
      ctx.session.tempCart.storeName,
      quantity
    );

    await ctx.replyWithHTML(
      `✅ <b>${ctx.session.tempCart.productName}</b> savatga qo'shildi!\n\n` +
        `📦 Miqdor: ${quantity} ${product.unit}\n` +
        `💰 Narx: ${(
          ctx.session.tempCart.productPrice * quantity
        ).toLocaleString()} so'm\n\n` +
        `🛒 Savatni ko'rish: /cart\n` +
        `📦 Buyurtma berish: /order`
    );

    ctx.session.step = null;
    ctx.session.tempCart = null;
    return;
  }

  // RO'YXATDAN O'TKAZISH
  if (ctx.session.step === regFirstNameStep) {
    const firstName = ctx.message.text.trim();
    if (firstName === "/cancel") return next();
    ctx.session.tempUser = { firstName };
    ctx.session.step = regLastNameStep;
    await ctx.replyWithHTML(
      "✅ <b>Ism:</b> " + firstName + "\n\n2-qadam: <b>Familiyangiz</b> nima?"
    );
    return;
  }
  if (ctx.session.step === regLastNameStep) {
    const lastName = ctx.message.text.trim();
    if (lastName === "/cancel") return next();
    ctx.session.tempUser.lastName = lastName;
    ctx.session.step = regPhoneStep;
    await ctx.replyWithHTML(
      "✅ <b>Familiya:</b> " +
        lastName +
        "\n\n3-qadam: <b>Telefon raqamingiz</b>"
    );
    return;
  }
  if (ctx.session.step === regPhoneStep) {
    const phone = ctx.message.text.trim();
    if (phone === "/cancel") return next();
    ctx.session.tempUser.phone = phone;
    ctx.session.step = regUsernameStep;
    await ctx.replyWithHTML(
      "✅ <b>Telefon:</b> " +
        phone +
        "\n\n4-qadam: <b>Telegram username</b> (agar yo'q bo'lsa /skip)"
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
      "✅ <b>Ro'yxatdan o'tish muvaffaqiyatli!</b>\n\n/dashboard"
    );
    ctx.session.step = null;
    ctx.session.tempUser = null;
    return;
  }

  // DO'KON RO'YXATDAN O'TKAZISH
  if (ctx.session.step === storeNameStep) {
    const name = ctx.message.text.trim();
    if (name === "/cancel") return next();
    ctx.session.tempStore = { name };
    ctx.session.step = storeAddressStep;
    await ctx.replyWithHTML(
      "✅ <b>Do'kon nomi:</b> " + name + "\n\n2-qadam: <b>Do'kon manzili</b>"
    );
    return;
  }
  if (ctx.session.step === storeAddressStep) {
    const address = ctx.message.text.trim();
    if (address === "/cancel") return next();
    ctx.session.tempStore.address = address;
    ctx.session.step = storePhoneStep;
    await ctx.replyWithHTML(
      "✅ <b>Manzil:</b> " + address + "\n\n3-qadam: <b>Telefon raqami</b>"
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
      "✅ <b>Do'kon muvaffaqiyatli ro'yxatdan o'tdi!</b>\n\n/mystore"
    );
    ctx.session.step = null;
    ctx.session.tempStore = null;
    return;
  }

  // MAHSULOT QO'SHISH (YANGI)
  if (ctx.session.step === addNameStep) {
    const name = ctx.message.text.trim();
    if (name === "/cancel") return next();
    ctx.session.tempProduct.name = name;
    ctx.session.step = addPriceStep;
    await ctx.replyWithHTML(
      "✅ <b>Nomi:</b> " + name + "\n\n2-qadam: <b>Narxi</b> necha so'm?"
    );
    return;
  }
  if (ctx.session.step === addPriceStep) {
    const price = parseInt(ctx.message.text);
    if (isNaN(price)) {
      await ctx.replyWithHTML("❌ <b>Iltimos, faqat son kiriting!</b>");
      return;
    }
    ctx.session.tempProduct.price = price;
    ctx.session.step = addQuantityStep;
    await ctx.replyWithHTML(
      "✅ <b>Narxi:</b> " +
        price +
        " so'm\n\n3-qadam: <b>Mahsulot miqdori</b> (masalan: 50)"
    );
    return;
  }
  if (ctx.session.step === addQuantityStep) {
    const quantity = parseFloat(ctx.message.text);
    if (isNaN(quantity) || quantity <= 0) {
      await ctx.replyWithHTML(
        "❌ <b>Noto'g'ri miqdor!</b>\n\nIltimos, musbat son kiriting."
      );
      return;
    }
    ctx.session.tempProduct.quantity = quantity;
    ctx.session.tempProduct.initialQuantity = quantity;
    ctx.session.step = addUnitStep;

    const unitKeyboard = getUnitKeyboard();
    await ctx.replyWithHTML(
      "✅ <b>Miqdor:</b> " +
        quantity +
        "\n\n4-qadam: <b>O'lchov birligini tanlang:</b>",
      {
        reply_markup: { inline_keyboard: unitKeyboard },
      }
    );
    return;
  }
  if (ctx.session.step === addPhotoStep && ctx.message.text === "/skip") {
    const userId = ctx.from.id;
    addOrUpdateProduct(userId, ctx.session.tempProduct);
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot rasm holda qo'shildi!</b>\n\n" +
        `📦 ${
          ctx.session.tempProduct.name
        } - ${ctx.session.tempProduct.price.toLocaleString()} so'm/${
          ctx.session.tempProduct.unit
        }\n` +
        `📦 Miqdor: ${ctx.session.tempProduct.quantity} ${ctx.session.tempProduct.unit}\n\n/addproduct`
    );
    ctx.session.step = null;
    ctx.session.tempProduct = null;
    return;
  }

  // MAHSULOT TAHRIRLASH
  if (ctx.session.step === editNewName) {
    const newName = ctx.message.text.trim();
    if (newName === "/cancel") return next();
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "name", newName);
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot nomi yangilandi!</b>\n\n" + newName
    );
    ctx.session.step = null;
    ctx.session.editData = null;
    return;
  }
  if (ctx.session.step === editNewPrice) {
    const newPrice = parseInt(ctx.message.text);
    if (isNaN(newPrice)) {
      await ctx.replyWithHTML("❌ <b>Iltimos, faqat son kiriting!</b>");
      return;
    }
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "price", newPrice);
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot narxi yangilandi!</b>\n\n" + newPrice + " so'm"
    );
    ctx.session.step = null;
    ctx.session.editData = null;
    return;
  }
  if (ctx.session.step === editNewQuantity) {
    const newQuantity = parseFloat(ctx.message.text);
    if (isNaN(newQuantity) || newQuantity < 0) {
      await ctx.replyWithHTML("❌ <b>Noto'g'ri miqdor!</b>");
      return;
    }
    const editData = ctx.session.editData;
    const product = loadProducts(ctx.from.id)[editData.index];
    updateProduct(ctx.from.id, editData.index, "quantity", newQuantity);
    updateProduct(
      ctx.from.id,
      editData.index,
      "initialQuantity",
      product.initialQuantity
    );
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot miqdori yangilandi!</b>\n\n" +
        newQuantity +
        " " +
        product.unit
    );
    ctx.session.step = null;
    ctx.session.editData = null;
    return;
  }

  // DO'KON TAHRIRLASH
  if (ctx.session.step === editStoreNameStep) {
    const newName = ctx.message.text.trim();
    if (newName === "/cancel") return next();
    const store = loadStore(ctx.from.id);
    if (store) {
      store.name = newName;
      saveStore(ctx.from.id, store);
    }
    await ctx.replyWithHTML("✅ <b>Do'kon nomi yangilandi!</b>\n\n" + newName);
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
    await ctx.replyWithHTML(
      "✅ <b>Do'kon manzili yangilandi!</b>\n\n" + newAddress
    );
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
      "✅ <b>Do'kon telefon raqami yangilandi!</b>\n\n" + newPhone
    );
    ctx.session.step = null;
    return;
  }

  // BUYURTMA MANZIL
  if (ctx.session.step === orderAddressStep) {
    const address = ctx.message.text.trim();
    if (address === "/cancel") return next();
    ctx.session.tempOrder = { address };
    ctx.session.step = orderPhoneStep;
    await ctx.replyWithHTML(
      "✅ <b>Manzil:</b> " + address + "\n\n2-qadam: <b>Telefon raqamingiz</b>"
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

    let total = 0;
    const orderItems = [];
    const storeItems = {};

    for (const item of cart) {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      orderItems.push({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        storeId: item.storeId,
      });

      if (!storeItems[item.storeId]) {
        storeItems[item.storeId] = [];
      }
      storeItems[item.storeId].push(item);
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
    for (const storeId in storeItems) {
      const products = loadProducts(storeId);
      for (const item of storeItems[storeId]) {
        const productIndex = products.findIndex((p) => p.name === item.name);
        if (productIndex >= 0) {
          const result = decreaseProductQuantity(
            storeId,
            productIndex,
            item.quantity
          );
          if (result.deleted) {
            await bot.telegram.sendMessage(
              storeId,
              `⚠️ <b>Mahsulot tugadi!</b>\n\n${result.productName} ${item.quantity} ${item.unit} sotib olindi va ombordan o'chirildi.`,
              { parse_mode: "HTML" }
            );
          } else if (
            result.newQuantity <
            result.product.initialQuantity * 0.1
          ) {
            await bot.telegram.sendMessage(
              storeId,
              `⚠️ <b>Ogohlantirish!</b>\n\n${item.name} mahsulotidan ${result.newQuantity} ${result.product.unit} qoldi. Tez orada yangi mahsulot qo'shing!`,
              { parse_mode: "HTML" }
            );
          }
        }
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
      "✅ <b>Buyurtma muvaffaqiyatli qabul qilindi!</b>\n\n" +
        `🆔 Buyurtma ID: <code>${orderId}</code>\n` +
        `💰 Jami: ${total.toLocaleString()} so'm\n` +
        `📍 Manzil: ${ctx.session.tempOrder.address}\n\n` +
        "📋 Buyurtma holatini kuzatish: /myorders"
    );

    ctx.session.step = null;
    ctx.session.tempOrder = null;
    return;
  }

  await next();
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

    let message =
      "✅ <b>Mahsulot muvaffaqiyatli qo'shildi!</b>\n\n" +
      "📂 <b>" +
      ctx.session.tempProduct.category +
      "</b>\n" +
      "📦 <b>" +
      ctx.session.tempProduct.name +
      "</b>\n" +
      `💰 ${ctx.session.tempProduct.price.toLocaleString()} so'm/${
        ctx.session.tempProduct.unit
      }\n` +
      `📦 Miqdor: ${ctx.session.tempProduct.quantity} ${ctx.session.tempProduct.unit}\n\n`;

    if (!result.isNew) {
      message += "ℹ️ Bu mahsulot avval mavjud edi. Miqdori oshirildi.\n\n";
    }

    message += "/addproduct - Yana qo'shish\n/myproducts - Mahsulotlarim";

    await ctx.replyWithHTML(message);

    ctx.session.step = null;
    ctx.session.tempProduct = null;
  }
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
      `🆕 <b>Yangi mahsulot qo'shish</b>\n\n` +
        `📂 Kategoriya: <b>${category}</b>\n\n` +
        `1-qadam: <b>Mahsulot nomi</b> nima?`,
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

// O'lchov birligi tanlash
bot.action(/unit_(.+)/, async (ctx) => {
  const unit = ctx.match[1];

  if (ctx.session && ctx.session.step === addUnitStep) {
    ctx.session.tempProduct.unit = unit;
    ctx.session.step = addPhotoStep;

    await ctx.answerCbQuery(`✅ ${unit} tanlandi`);
    await ctx.editMessageText(
      `🆕 <b>Yangi mahsulot qo'shish</b>\n\n` +
        `📂 Kategoriya: ${ctx.session.tempProduct.category}\n` +
        `📦 Nomi: ${ctx.session.tempProduct.name}\n` +
        `💰 Narxi: ${ctx.session.tempProduct.price.toLocaleString()} so'm\n` +
        `📏 Miqdor: ${ctx.session.tempProduct.quantity} ${unit}\n\n` +
        `5-qadam: <b>Mahsulot rasmini</b> yuboring (rasm yoki /skip)`,
      { parse_mode: "HTML" }
    );
  } else if (ctx.session && ctx.session.step === editNewUnit) {
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "unit", unit);
    await ctx.answerCbQuery(`✅ ${unit} ga o'zgartirildi`);
    await ctx.editMessageText(
      `✅ Mahsulot o'lchov birligi yangilandi!\n\n📏 Yangi birlik: ${unit}`
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  }
});

// ================ MAHSULOT TAHRIRLASH (TANLASH) ================
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
          text: "📦 Miqdorini o'zgartirish",
          callback_data: `edit_field_quantity_${index}`,
        },
      ],
      [
        {
          text: "📂 Kategoriyasini o'zgartirish",
          callback_data: `edit_field_category_${index}`,
        },
      ],
    ];

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✏️ <b>${product.name}</b> tahrirlanmoqda\n\n` +
        `📦 Hozirgi nom: ${product.name}\n` +
        `💰 Hozirgi narx: ${product.price.toLocaleString()} so'm\n` +
        `📏 Hozirgi miqdor: ${product.quantity} ${product.unit}\n` +
        `📂 Hozirgi kategoriya: ${product.category || "📦 Boshqa"}\n\n` +
        `Qaysi maydonni o'zgartirmoqchisiz?`,
      { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
    );
  }
});

// ================ TAHRIRLASH MAYDONLARI ================
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

bot.action(/edit_field_quantity_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewQuantity;

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "📦 <b>Yangi miqdorni kiriting:</b>\n\nBekor qilish uchun /cancel",
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
      "✅ <b>Mahsulot o'chirildi!</b>\n\n" +
        "🗑 <b>" +
        deletedProduct.name +
        "</b>\n" +
        `💰 ${deletedProduct.price.toLocaleString()} so'm/${
          deletedProduct.unit
        }\n` +
        "📂 " +
        (deletedProduct.category || "📦 Boshqa"),
      { parse_mode: "HTML" }
    );
  } else {
    await ctx.answerCbQuery("Xatolik yuz berdi!", { show_alert: true });
  }
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

// ================ SKIP BUYRUQI ================
bot.command("skip", async (ctx) => {
  if (ctx.session && ctx.session.step === addPhotoStep) {
    const userId = ctx.from.id;
    const result = addOrUpdateProduct(userId, ctx.session.tempProduct);

    let message =
      "✅ <b>Mahsulot rasm holda qo'shildi!</b>\n\n" +
      `📦 ${
        ctx.session.tempProduct.name
      } - ${ctx.session.tempProduct.price.toLocaleString()} so'm/${
        ctx.session.tempProduct.unit
      }\n` +
      `📦 Miqdor: ${ctx.session.tempProduct.quantity} ${ctx.session.tempProduct.unit}\n\n`;

    if (!result.isNew) {
      message += "ℹ️ Bu mahsulot avval mavjud edi. Miqdori oshirildi.\n\n";
    }

    await ctx.replyWithHTML(message);
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
