// Telegraf kutubxonasini ulash
const { Telegraf, session } = require("telegraf");
const fs = require("fs");

// O‘Z TOKENINGIZNI YOZING!
const BOT_TOKEN = "8660848497:AAE6oVEe-36oknS3axnr7FqJ956BZ_FDLtY";

// Botni yaratish va session qo‘shish
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// ================ MA'LUMOTLARNI SAQLASH ================
const DATA_FILE = "products.json";

// Kategoriyalar ro'yxati
const CATEGORIES = [
  "🥑 Mevalar",
  "🥬 Sabzavotlar",
  "🥛 Sut mahsulotlari",
  "🍞 Non mahsulotlari",
  "🍬 Shirinliklar",
  "🥤 Ichimliklar",
  "📦 Boshqa",
];

function loadProducts(userId) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return data[userId] || [];
    }
  } catch (error) {
    console.error("Faylni o‘qishda xatolik:", error);
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
    console.error("Faylni saqlashda xatolik:", error);
  }
}

function addProduct(userId, product) {
  const products = loadProducts(userId);
  products.push(product);
  saveProducts(userId, products);
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

// Kategoriya bo'yicha mahsulotlarni olish
function getProductsByCategory(userId, category) {
  const products = loadProducts(userId);
  return products.filter((p) => p.category === category);
}

// ================ MAHSULOT QO‘SHISH (KATEGORIYA BILAN) ================
const addCategoryStep = "add_category";
const addNameStep = "add_name";
const addPriceStep = "add_price";
const addPhotoStep = "add_photo";

// Kategoriya tanlash uchun tugmalar yaratish
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

bot.command("addproduct", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = addCategoryStep;

  const keyboard = getCategoryKeyboard();

  await ctx.replyWithHTML(
    "🆕 <b>Yangi mahsulot qo‘shish</b>\n\n" +
      "1-qadam: <b>Kategoriyani tanlang:</b>",
    {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    }
  );
});

// Kategoriya tanlash
bot.action(/cat_(\d+)/, async (ctx) => {
  const categoryIndex = parseInt(ctx.match[1]);
  const category = CATEGORIES[categoryIndex];

  if (!ctx.session) ctx.session = {};
  ctx.session.tempProduct = { category };
  ctx.session.step = addNameStep;

  await ctx.answerCbQuery(`✅ ${category} tanlandi`);
  await ctx.editMessageText(
    `🆕 <b>Yangi mahsulot qo‘shish</b>\n\n` +
      `📂 Kategoriya: <b>${category}</b>\n\n` +
      `2-qadam: <b>Mahsulot nomi</b> nima?\n\n` +
      `Masalan: <i>Olma, Banan, Non, Sut</i>\n\n` +
      `Bekor qilish uchun /cancel`,
    { parse_mode: "HTML" }
  );
});

bot.on("text", async (ctx, next) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === addNameStep) {
    const name = ctx.message.text.trim();
    if (name === "/cancel") {
      await next();
      return;
    }
    ctx.session.tempProduct.name = name;
    ctx.session.step = addPriceStep;
    await ctx.replyWithHTML(
      "✅ <b>Nomi:</b> " +
        name +
        "\n\n" +
        "3-qadam: <b>Narxi</b> necha so‘m?\n\n" +
        "Masalan: <i>12000</i>\n\n" +
        "Bekor qilish uchun /cancel"
    );
  } else if (ctx.session.step === addPriceStep) {
    const price = parseInt(ctx.message.text);
    if (isNaN(price)) {
      await ctx.replyWithHTML(
        "❌ <b>Iltimos, faqat son kiriting!</b>\n\nMasalan: 12000"
      );
      return;
    }
    ctx.session.tempProduct.price = price;
    ctx.session.step = addPhotoStep;
    await ctx.replyWithHTML(
      "✅ <b>Narxi:</b> " +
        price +
        " so‘m\n\n" +
        "4-qadam: <b>Mahsulot rasmini</b> yuboring (rasm yoki /skip)\n\n" +
        "Bekor qilish uchun /cancel"
    );
  } else if (
    ctx.session.step === addPhotoStep &&
    ctx.message.text === "/skip"
  ) {
    const userId = ctx.from.id;
    addProduct(userId, ctx.session.tempProduct);

    await ctx.replyWithHTML(
      "✅ <b>Mahsulot rasm holda qo‘shildi!</b>\n\n" +
        "📂 <b>" +
        ctx.session.tempProduct.category +
        "</b>\n" +
        "📦 <b>" +
        ctx.session.tempProduct.name +
        "</b> - " +
        ctx.session.tempProduct.price +
        " so‘m\n\n" +
        "Yana mahsulot qo‘shish uchun /addproduct\n" +
        "Barcha mahsulotlaringizni ko‘rish uchun /myproducts"
    );

    ctx.session.step = null;
    ctx.session.tempProduct = null;
  } else {
    await next();
  }
});

// Rasm qabul qilish
bot.on("photo", async (ctx) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === addPhotoStep) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;
    ctx.session.tempProduct.photo = fileId;

    const userId = ctx.from.id;
    addProduct(userId, ctx.session.tempProduct);

    await ctx.replyWithHTML(
      "✅ <b>Mahsulot muvaffaqiyatli qo‘shildi!</b>\n\n" +
        "📂 <b>" +
        ctx.session.tempProduct.category +
        "</b>\n" +
        "📦 <b>" +
        ctx.session.tempProduct.name +
        "</b> - " +
        ctx.session.tempProduct.price +
        " so‘m\n\n" +
        "Yana mahsulot qo‘shish uchun /addproduct\n" +
        "Barcha mahsulotlaringizni ko‘rish uchun /myproducts"
    );

    ctx.session.step = null;
    ctx.session.tempProduct = null;
  }
});

// /skip buyrug'i uchun
bot.command("skip", async (ctx) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === addPhotoStep) {
    const userId = ctx.from.id;
    addProduct(userId, ctx.session.tempProduct);

    await ctx.replyWithHTML(
      "✅ <b>Mahsulot rasm holda qo‘shildi!</b>\n\n" +
        "📂 <b>" +
        ctx.session.tempProduct.category +
        "</b>\n" +
        "📦 <b>" +
        ctx.session.tempProduct.name +
        "</b> - " +
        ctx.session.tempProduct.price +
        " so‘m\n\n" +
        "Yana mahsulot qo‘shish uchun /addproduct\n" +
        "Barcha mahsulotlaringizni ko‘rish uchun /myproducts"
    );

    ctx.session.step = null;
    ctx.session.tempProduct = null;
  }
});

// ================ KATEGORIYALARNI KO'RSATISH ================
bot.command("categories", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);

  // Har bir kategoriyadagi mahsulotlar sonini hisoblash
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
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

// Kategoriya bo'yicha mahsulotlarni ko'rsatish
bot.action(/view_cat_(\d+)/, async (ctx) => {
  const categoryIndex = parseInt(ctx.match[1]);
  const category = CATEGORIES[categoryIndex];
  const userId = ctx.from.id;
  const products = getProductsByCategory(userId, category);

  if (products.length === 0) {
    await ctx.answerCbQuery(`📭 ${category} da mahsulot yo‘q`);
    await ctx.editMessageText(
      `📂 <b>${category}</b>\n\n` +
        `📭 Bu kategoriyada hozircha mahsulot yo‘q.\n\n` +
        `Mahsulot qo‘shish uchun /addproduct`,
      { parse_mode: "HTML" }
    );
    return;
  }

  let message = `📂 <b>${category}</b>\n\n`;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. <b>${p.name}</b> - ${p.price} so‘m\n`;
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, { parse_mode: "HTML" });
});

// ================ MAHSULOTLARNI KO'RSATISH (YANGILANGAN) ================
bot.command("myproducts", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);

  if (products.length === 0) {
    await ctx.replyWithHTML(
      "📭 <b>Siz hali hech qanday mahsulot qo‘shmagansiz!</b>\n\n" +
        "Mahsulot qo‘shish uchun: /addproduct"
    );
    return;
  }

  // Kategoriya bo'yicha guruhlash
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
      message += `  ${i + 1}. <b>${items[i].name}</b> - ${
        items[i].price
      } so‘m\n`;
    }
    message += `\n`;
  }

  await ctx.replyWithHTML(message);
});

// ================ MAHSULOT TAHRIRLASH (KATEGORIYA BILAN) ================
const editSelectProduct = "edit_select_product";
const editSelectField = "edit_select_field";
const editNewName = "edit_new_name";
const editNewPrice = "edit_new_price";
const editNewCategory = "edit_new_category";

bot.command("editproduct", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);

  if (products.length === 0) {
    await ctx.replyWithHTML(
      "📭 <b>Tahrirlash uchun hech qanday mahsulot yo‘q!</b>\n\n" +
        "Mahsulot qo‘shish uchun: /addproduct"
    );
    return;
  }

  let message = "✏️ <b>Qaysi mahsulotni tahrirlamoqchisiz?</b>\n\n";
  const keyboard = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. ${p.name} - ${p.price} so‘m (${
      p.category || "📦 Boshqa"
    })\n`;
    keyboard.push([
      { text: `${i + 1}. ${p.name}`, callback_data: `edit_select_${i}` },
    ]);
  }

  message += "\n\n❌ Bekor qilish uchun /cancel";

  await ctx.replyWithHTML(message, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

// Mahsulot tanlash
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
    ];

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✏️ <b>${product.name}</b> tahrirlanmoqda\n\n` +
        `📦 Hozirgi nom: ${product.name}\n` +
        `💰 Hozirgi narx: ${product.price} so‘m\n` +
        `📂 Hozirgi kategoriya: ${product.category || "📦 Boshqa"}\n\n` +
        `Qaysi maydonni o'zgartirmoqchisiz?`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  }
});

// Nomni tahrirlash
bot.action(/edit_field_name_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);

  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewName;

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "✏️ <b>Yangi nomni kiriting:</b>\n\n" +
      "Masalan: <i>Yangi Olma</i>\n\n" +
      "Bekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});

// Narxni tahrirlash
bot.action(/edit_field_price_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);

  if (!ctx.session) ctx.session = {};
  if (!ctx.session.editData) ctx.session.editData = {};
  ctx.session.editData.index = index;
  ctx.session.step = editNewPrice;

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "💰 <b>Yangi narxni kiriting:</b>\n\n" +
      "Masalan: <i>15000</i>\n\n" +
      "Bekor qilish uchun /cancel",
    { parse_mode: "HTML" }
  );
});

// Kategoriyani tahrirlash
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

// Yangi nomni qabul qilish
bot.on("text", async (ctx, next) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === editNewName) {
    const newName = ctx.message.text.trim();
    if (newName === "/cancel") {
      await next();
      return;
    }
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "name", newName);
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot nomi yangilandi!</b>\n\n" + "📦 Yangi nom: " + newName
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  } else if (ctx.session.step === editNewPrice) {
    const newPrice = parseInt(ctx.message.text);
    if (isNaN(newPrice)) {
      await ctx.replyWithHTML("❌ <b>Iltimos, faqat son kiriting!</b>");
      return;
    }
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "price", newPrice);
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot narxi yangilandi!</b>\n\n" +
        "💰 Yangi narx: " +
        newPrice +
        " so‘m"
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  } else {
    await next();
  }
});

// Yangi kategoriyani qabul qilish (action handler orqali)
bot.action(/cat_(\d+)/, async (ctx, next) => {
  if (ctx.session && ctx.session.step === editNewCategory) {
    const categoryIndex = parseInt(ctx.match[1]);
    const newCategory = CATEGORIES[categoryIndex];
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "category", newCategory);

    await ctx.answerCbQuery(`✅ ${newCategory} ga o‘zgartirildi`);
    await ctx.editMessageText(
      "✅ <b>Mahsulot kategoriyasi yangilandi!</b>\n\n" +
        "📂 Yangi kategoriya: " +
        newCategory
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  } else {
    await next();
  }
});

// ================ MAHSULOT O‘CHIRISH ================
bot.command("deleteproduct", async (ctx) => {
  const userId = ctx.from.id;
  const products = loadProducts(userId);

  if (products.length === 0) {
    await ctx.replyWithHTML(
      "📭 <b>Sizda o‘chirish uchun hech qanday mahsulot yo‘q!</b>\n\n" +
        "Mahsulot qo‘shish uchun: /addproduct"
    );
    return;
  }

  let message = "🗑 <b>Qaysi mahsulotni o‘chirmoqchisiz?</b>\n\n";
  const keyboard = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    message += `${i + 1}. ${p.name} - ${p.price} so‘m (${
      p.category || "📦 Boshqa"
    })\n`;
    keyboard.push([
      { text: `${i + 1}. ${p.name}`, callback_data: `delete_${i}` },
    ]);
  }

  message += "\n\n❌ Bekor qilish uchun /cancel";

  await ctx.replyWithHTML(message, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

bot.action(/delete_(\d+)/, async (ctx) => {
  const userId = ctx.from.id;
  const index = parseInt(ctx.match[1]);
  const products = loadProducts(userId);

  if (index >= 0 && index < products.length) {
    const deletedProduct = products[index];
    deleteProduct(userId, index);

    await ctx.answerCbQuery(`✅ ${deletedProduct.name} o‘chirildi!`);

    await ctx.editMessageText(
      "✅ <b>Mahsulot o‘chirildi!</b>\n\n" +
        "🗑 <b>" +
        deletedProduct.name +
        "</b> - " +
        deletedProduct.price +
        " so‘m\n" +
        "📂 " +
        (deletedProduct.category || "📦 Boshqa") +
        "\n\n" +
        "Mahsulotlar ro‘yxatini ko‘rish: /myproducts",
      { parse_mode: "HTML" }
    );
  } else {
    await ctx.answerCbQuery("Xatolik yuz berdi!", { show_alert: true });
  }
});

// ================ OLDINGI BUYRUQLAR ================
bot.command("cancel", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = null;
  ctx.session.tempProduct = null;
  ctx.session.editData = null;
  await ctx.replyWithHTML("❌ <b>Bekor qilindi!</b>");
});

bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    "🏪 <b>Online Vitrina Botiga xush kelibsiz!</b>\n\n" +
      "Sizning online vitrinangizni yaratishga yordam beraman.\n\n" +
      "<b>Quyidagi buyruqlardan foydalaning:</b>\n" +
      "/addproduct - Yangi mahsulot qo‘shish (kategoriya bilan)\n" +
      "/myproducts - Mahsulotlarimni ko‘rish (kategoriya bo‘yicha)\n" +
      "/categories - Kategoriyalarni ko‘rish\n" +
      "/editproduct - Mahsulot tahrirlash\n" +
      "/deleteproduct - Mahsulot o‘chirish\n" +
      "/link - Vitrina linkingizni olish\n" +
      "/help - Yordam"
  );
});

bot.command("link", async (ctx) => {
  const userId = ctx.from.id;
  await ctx.replyWithHTML(
    "🔗 <b>Sizning vitrina linkingiz:</b>\n" +
      `<code>https://online-vitrina-bot.up.railway.app/${userId}</code>\n\n` +
      "Bu linkni mijozlaringizga yuboring!"
  );
});

bot.command("help", async (ctx) => {
  await ctx.replyWithHTML(
    "❓ <b>Yordam</b>\n\n" +
      "<b>Qanday foydalaniladi?</b>\n\n" +
      "1. /addproduct - Mahsulot qo‘shish (kategoriya tanlang)\n" +
      "2. So‘ralgan ma'lumotlarni kiriting\n" +
      "3. /myproducts - Barcha mahsulotlaringizni ko‘ring\n" +
      "4. /categories - Kategoriyalar va mahsulotlar soni\n" +
      "5. /editproduct - Mahsulot nomi, narxi yoki kategoriyasini o‘zgartirish\n" +
      "6. /deleteproduct - Mahsulot o‘chirish\n\n" +
      "<b>Barcha buyruqlar:</b>\n" +
      "/start - Botni boshlash\n" +
      "/addproduct - Yangi mahsulot qo‘shish\n" +
      "/myproducts - Mahsulotlar ro‘yxati\n" +
      "/categories - Kategoriyalar\n" +
      "/editproduct - Mahsulot tahrirlash\n" +
      "/deleteproduct - Mahsulot o‘chirish\n" +
      "/link - Vitrina linkingiz\n" +
      "/help - Yordam\n" +
      "/cancel - Amalni bekor qilish"
  );
});

// ================ BOTNI ISHGA TUSHIRISH ================
bot
  .launch()
  .then(() => console.log("✅ Bot ishga tushdi! (Kategoriyalar bilan)"))
  .catch((err) => console.error("Xatolik:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
