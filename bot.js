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

bot.on('text', async (ctx, next) => {
  if (!ctx.session) ctx.session = {};
  
  // Do'kon ro'yxatdan o'tkazish
  if (ctx.session.step === storeNameStep) {
      const name = ctx.message.text.trim();
      if (name === '/cancel') {
          await next();
          return;
      }
      ctx.session.tempStore = { name };
      ctx.session.step = storeAddressStep;
      await ctx.replyWithHTML(
          "✅ <b>Do‘kon nomi:</b> " + name + "\n\n" +
          "2-qadam: <b>Do‘kon manzili</b>\n\n" +
          "Masalan: <i>Chilonzor bozori, 12-dokon</i>\n\n" +
          "Bekor qilish uchun /cancel"
      );
  } 
  else if (ctx.session.step === storeAddressStep) {
      const address = ctx.message.text.trim();
      if (address === '/cancel') {
          await next();
          return;
      }
      ctx.session.tempStore.address = address;
      ctx.session.step = storePhoneStep;
      await ctx.replyWithHTML(
          "✅ <b>Manzil:</b> " + address + "\n\n" +
          "3-qadam: <b>Telefon raqami</b>\n\n" +
          "Masalan: <i>+998901234567</i>\n\n" +
          "Bekor qilish uchun /cancel"
      );
  }
  else if (ctx.session.step === storePhoneStep) {
      const phone = ctx.message.text.trim();
      if (phone === '/cancel') {
          await next();
          return;
      }
      ctx.session.tempStore.phone = phone;
      ctx.session.tempStore.registeredAt = new Date().toISOString();
      
      const userId = ctx.from.id;
      saveStore(userId, ctx.session.tempStore);
      
      await ctx.replyWithHTML(
          "✅ <b>Do‘kon muvaffaqiyatli ro‘yxatdan o‘tdi!</b>\n\n" +
          "🏪 <b>" + ctx.session.tempStore.name + "</b>\n" +
          "📍 " + ctx.session.tempStore.address + "\n" +
          "📞 " + ctx.session.tempStore.phone + "\n\n" +
          "Mahsulot qo‘shish: /addproduct\n" +
          "Do‘kon ma'lumotlarini ko‘rish: /mystore"
      );
      
      ctx.session.step = null;
      ctx.session.tempStore = null;
  }
  // Do'kon ma'lumotlarini tahrirlash
  else if (ctx.session.step === editStoreNameStep) {
      const newName = ctx.message.text.trim();
      if (newName === '/cancel') {
          await next();
          return;
      }
      const userId = ctx.from.id;
      const store = loadStore(userId);
      if (store) {
          store.name = newName;
          saveStore(userId, store);
          await ctx.replyWithHTML("✅ <b>Do‘kon nomi yangilandi!</b>\n\n🏪 Yangi nom: " + newName);
      }
      ctx.session.step = null;
  }
  else if (ctx.session.step === editStoreAddressStep) {
      const newAddress = ctx.message.text.trim();
      if (newAddress === '/cancel') {
          await next();
          return;
      }
      const userId = ctx.from.id;
      const store = loadStore(userId);
      if (store) {
          store.address = newAddress;
          saveStore(userId, store);
          await ctx.replyWithHTML("✅ <b>Do‘kon manzili yangilandi!</b>\n\n📍 Yangi manzil: " + newAddress);
      }
      ctx.session.step = null;
  }
  else if (ctx.session.step === editStorePhoneStep) {
      const newPhone = ctx.message.text.trim();
      if (newPhone === '/cancel') {
          await next();
          return;
      }
      const userId = ctx.from.id;
      const store = loadStore(userId);
      if (store) {
          store.phone = newPhone;
          saveStore(userId, store);
          await ctx.replyWithHTML("✅ <b>Do‘kon telefon raqami yangilandi!</b>\n\n📞 Yangi telefon: " + newPhone);
      }
      ctx.session.step = null;
  }
  // Mahsulot qo'shish (eski funksiyalar)
  else if (ctx.session.step === addNameStep) {
      const name = ctx.message.text.trim();
      if (name === '/cancel') {
          await next();
          return;
      }
      ctx.session.tempProduct.name = name;
      ctx.session.step = addPriceStep;
      await ctx.replyWithHTML(
          "✅ <b>Nomi:</b> " + name + "\n\n" +
          "3-qadam: <b>Narxi</b> necha so‘m?\n\n" +
          "Masalan: <i>12000</i>\n\n" +
          "Bekor qilish uchun /cancel"
      );
  }
  else if (ctx.session.step === addPriceStep) {
      const price = parseInt(ctx.message.text);
      if (isNaN(price)) {
          await ctx.replyWithHTML("❌ <b>Iltimos, faqat son kiriting!</b>\n\nMasalan: 12000");
          return;
      }
      ctx.session.tempProduct.price = price;
      ctx.session.step = addPhotoStep;
      await ctx.replyWithHTML(
          "✅ <b>Narxi:</b> " + price + " so‘m\n\n" +
          "4-qadam: <b>Mahsulot rasmini</b> yuboring (rasm yoki /skip)\n\n" +
          "Bekor qilish uchun /cancel"
      );
  }
  else if (ctx.session.step === addPhotoStep && ctx.message.text === '/skip') {
      const userId = ctx.from.id;
      addProduct(userId, ctx.session.tempProduct);
      
      await ctx.replyWithHTML(
          "✅ <b>Mahsulot rasm holda qo‘shildi!</b>\n\n" +
          "📦 <b>" + ctx.session.tempProduct.name + "</b> - " + ctx.session.tempProduct.price + " so‘m\n\n" +
          "Yana mahsulot qo‘shish uchun /addproduct\n" +
          "Barcha mahsulotlaringizni ko‘rish uchun /myproducts"
      );
      
      ctx.session.step = null;
      ctx.session.tempProduct = null;
  }
  // Mahsulot tahrirlash (eski funksiyalar)
  else if (ctx.session.step === editNewName) {
      const newName = ctx.message.text.trim();
      if (newName === '/cancel') {
          await next();
          return;
      }
      const editData = ctx.session.editData;
      updateProduct(ctx.from.id, editData.index, 'name', newName);
      await ctx.replyWithHTML(
          "✅ <b>Mahsulot nomi yangilandi!</b>\n\n" +
          "📦 Yangi nom: " + newName
      );
      ctx.session.step = null;
      ctx.session.editData = null;
  }
  else if (ctx.session.step === editNewPrice) {
      const newPrice = parseInt(ctx.message.text);
      if (isNaN(newPrice)) {
          await ctx.replyWithHTML("❌ <b>Iltimos, faqat son kiriting!</b>");
          return;
      }
      const editData = ctx.session.editData;
      updateProduct(ctx.from.id, editData.index, 'price', newPrice);
      await ctx.replyWithHTML(
          "✅ <b>Mahsulot narxi yangilandi!</b>\n\n" +
          "💰 Yangi narx: " + newPrice + " so‘m"
      );
      ctx.session.step = null;
      ctx.session.editData = null;
  }
  else {
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
      "<b>📌 SOTUVCHI UCHUN:</b>\n" +
      "/setupstore - Do‘kon ro‘yxatdan o‘tkazish\n" +
      "/mystore - Do‘kon ma'lumotlarini ko‘rish\n" +
      "/editstore - Do‘kon ma'lumotlarini tahrirlash\n" +
      "/addproduct - Yangi mahsulot qo‘shish\n" +
      "/myproducts - Mahsulotlarimni ko‘rish\n" +
      "/categories - Kategoriyalar\n" +
      "/editproduct - Mahsulot tahrirlash\n" +
      "/deleteproduct - Mahsulot o‘chirish\n\n" +
      "<b>📌 MIJOZ UCHUN (tez kunda):</b>\n" +
      "/stores - Do‘konlar ro‘yxati\n" +
      "/store &lt;id&gt; - Do‘kon mahsulotlari\n\n" +
      "/link - Vitrina linkingiz\n" +
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

bot.command('help', async (ctx) => {
  await ctx.replyWithHTML(
      "❓ <b>Yordam</b>\n\n" +
      "<b>🏪 DO‘KON BOSHQARISH:</b>\n" +
      "/setupstore - Do‘kon ro‘yxatdan o‘tkazish\n" +
      "/mystore - Do‘kon ma'lumotlarini ko‘rish\n" +
      "/editstore - Do‘kon ma'lumotlarini tahrirlash\n\n" +
      "<b>📦 MAHSULOT BOSHQARISH:</b>\n" +
      "/addproduct - Yangi mahsulot qo‘shish\n" +
      "/myproducts - Mahsulotlarimni ko‘rish\n" +
      "/categories - Kategoriyalar\n" +
      "/editproduct - Mahsulot tahrirlash\n" +
      "/deleteproduct - Mahsulot o‘chirish\n\n" +
      "<b>🔗 UMUMIY:</b>\n" +
      "/link - Vitrina linkingiz\n" +
      "/start - Botni boshlash\n" +
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

// ================ DO'KON MA'LUMOTLARI UCHUN YANGI FUNKSIYALAR ================
const STORES_FILE = 'stores.json';

function loadStore(userId) {
    try {
        if (fs.existsSync(STORES_FILE)) {
            const data = JSON.parse(fs.readFileSync(STORES_FILE, 'utf8'));
            return data[userId] || null;
        }
    } catch (error) {
        console.error('Do‘kon malumotlarini oqishda xatolik:', error);
    }
    return null;
}

function saveStore(userId, storeData) {
    try {
        let allStores = {};
        if (fs.existsSync(STORES_FILE)) {
            allStores = JSON.parse(fs.readFileSync(STORES_FILE, 'utf8'));
        }
        allStores[userId] = storeData;
        fs.writeFileSync(STORES_FILE, JSON.stringify(allStores, null, 2));
        return true;
    } catch (error) {
        console.error('Do‘kon malumotlarini saqlashda xatolik:', error);
        return false;
    }
}

function getAllStores() {
    try {
        if (fs.existsSync(STORES_FILE)) {
            return JSON.parse(fs.readFileSync(STORES_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Barcha do‘konlarni o‘qishda xatolik:', error);
    }
    return {};
}

// ================ DO'KON RO'YXATDAN O'TKAZISH ================
const storeNameStep = 'store_name';
const storeAddressStep = 'store_address';
const storePhoneStep = 'store_phone';

bot.command('setupstore', async (ctx) => {
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
        "Masalan: <i>Salimning mevalari, Oqibat texnika...</i>\n\n" +
        "Bekor qilish uchun /cancel"
    );
});

// Do'kon nomini qabul qilish
bot.on('text', async (ctx, next) => {
    if (!ctx.session) ctx.session = {};
    
    if (ctx.session.step === storeNameStep) {
        const name = ctx.message.text.trim();
        if (name === '/cancel') {
            await next();
            return;
        }
        ctx.session.tempStore = { name };
        ctx.session.step = storeAddressStep;
        await ctx.replyWithHTML(
            "✅ <b>Do‘kon nomi:</b> " + name + "\n\n" +
            "2-qadam: <b>Do‘kon manzili</b> (mijozlar borishi uchun)\n\n" +
            "Masalan: <i>Chilonzor bozori, 12-dokon</i>\n\n" +
            "Bekor qilish uchun /cancel"
        );
    } else if (ctx.session.step === storeAddressStep) {
        const address = ctx.message.text.trim();
        if (address === '/cancel') {
            await next();
            return;
        }
        ctx.session.tempStore.address = address;
        ctx.session.step = storePhoneStep;
        await ctx.replyWithHTML(
            "✅ <b>Manzil:</b> " + address + "\n\n" +
            "3-qadam: <b>Telefon raqami</b> (mijozlar bog‘lanishi uchun)\n\n" +
            "Masalan: <i>+998901234567</i>\n\n" +
            "Bekor qilish uchun /cancel"
        );
    } else if (ctx.session.step === storePhoneStep) {
        const phone = ctx.message.text.trim();
        if (phone === '/cancel') {
            await next();
            return;
        }
        ctx.session.tempStore.phone = phone;
        ctx.session.tempStore.registeredAt = new Date().toISOString();
        
        const userId = ctx.from.id;
        saveStore(userId, ctx.session.tempStore);
        
        await ctx.replyWithHTML(
            "✅ <b>Do‘kon muvaffaqiyatli ro‘yxatdan o‘tdi!</b>\n\n" +
            "🏪 <b>" + ctx.session.tempStore.name + "</b>\n" +
            "📍 " + ctx.session.tempStore.address + "\n" +
            "📞 " + ctx.session.tempStore.phone + "\n\n" +
            "Endi mijozlar sizning do‘koningizni ko‘ra oladi!\n\n" +
            "Mahsulot qo‘shish: /addproduct\n" +
            "Do‘kon ma'lumotlarini ko‘rish: /mystore"
        );
        
        ctx.session.step = null;
        ctx.session.tempStore = null;
    } else {
        await next();
    }
});

// ================ DO'KON MA'LUMOTLARINI KO'RISH ================
bot.command('mystore', async (ctx) => {
    const userId = ctx.from.id;
    const store = loadStore(userId);
    
    if (!store) {
        await ctx.replyWithHTML(
            "🏪 <b>Siz hali do‘kon ro‘yxatdan o‘tkazmagansiz!</b>\n\n" +
            "Do‘kon ro‘yxatdan o‘tkazish uchun: /setupstore"
        );
        return;
    }
    
    let message = "🏪 <b>Sizning do‘koningiz</b>\n\n";
    message += `📛 <b>Nomi:</b> ${store.name}\n`;
    message += `📍 <b>Manzil:</b> ${store.address}\n`;
    message += `📞 <b>Telefon:</b> ${store.phone}\n`;
    message += `📅 <b>Ro‘yxatdan o‘tgan:</b> ${new Date(store.registeredAt).toLocaleDateString()}\n\n`;
    message += "Ma'lumotlarni o‘zgartirish: /editstore";
    
    await ctx.replyWithHTML(message);
});

// ================ DO'KON MA'LUMOTLARINI TAHRIRLASH ================
const editStoreNameStep = 'edit_store_name';
const editStoreAddressStep = 'edit_store_address';
const editStorePhoneStep = 'edit_store_phone';

bot.command('editstore', async (ctx) => {
    const userId = ctx.from.id;
    const store = loadStore(userId);
    
    if (!store) {
        await ctx.replyWithHTML(
            "🏪 <b>Siz hali do‘kon ro‘yxatdan o‘tkazmagansiz!</b>\n\n" +
            "Do‘kon ro‘yxatdan o‘tkazish uchun: /setupstore"
        );
        return;
    }
    
    const keyboard = [
        [{ text: "📛 Nomini o'zgartirish", callback_data: "edit_store_name" }],
        [{ text: "📍 Manzilni o'zgartirish", callback_data: "edit_store_address" }],
        [{ text: "📞 Telefonni o'zgartirish", callback_data: "edit_store_phone" }]
    ];
    
    await ctx.replyWithHTML(
        `✏️ <b>${store.name}</b> do‘kon ma'lumotlarini tahrirlash\n\n` +
        `📛 Hozirgi nom: ${store.name}\n` +
        `📍 Hozirgi manzil: ${store.address}\n` +
        `📞 Hozirgi telefon: ${store.phone}\n\n` +
        `Qaysi ma'lumotni o'zgartirmoqchisiz?`,
        {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
        }
    );
});

// Tahrirlash tugmalari
bot.action('edit_store_name', async (ctx) => {
    if (!ctx.session) ctx.session = {};
    ctx.session.step = editStoreNameStep;
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        "✏️ <b>Yangi do‘kon nomini kiriting:</b>\n\n" +
        "Masalan: <i>Yangi nom</i>\n\n" +
        "Bekor qilish uchun /cancel",
        { parse_mode: 'HTML' }
    );
});

bot.action('edit_store_address', async (ctx) => {
    if (!ctx.session) ctx.session = {};
    ctx.session.step = editStoreAddressStep;
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        "📍 <b>Yangi manzilni kiriting:</b>\n\n" +
        "Masalan: <i>Yangi manzil, 1-uy</i>\n\n" +
        "Bekor qilish uchun /cancel",
        { parse_mode: 'HTML' }
    );
});

bot.action('edit_store_phone', async (ctx) => {
    if (!ctx.session) ctx.session = {};
    ctx.session.step = editStorePhoneStep;
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        "📞 <b>Yangi telefon raqamini kiriting:</b>\n\n" +
        "Masalan: <i>+998901234567</i>\n\n" +
        "Bekor qilish uchun /cancel",
        { parse_mode: 'HTML' }
    );
});

// Tahrirlashni qabul qilish (text handler ga qo'shimcha)
// Eski text handler ichiga quyidagi qismlarni qo'shing (keyingi qadamda)

// ================ YANGILANGAN TEXT HANDLER (to'liq versiya) ================
// Eski text handler ni quyidagi bilan almashtiring yoki qo'shing