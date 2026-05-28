// Telegraf kutubxonasini ulash
const { Telegraf, session } = require("telegraf");
const fs = require("fs");

// O‘Z TOKENINGIZNI YOZING!
const BOT_TOKEN = "YOUR_TOKEN_HERE";

// Botni yaratish va session qo‘shish
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// ================ MA'LUMOTLARNI SAQLASH ================
const DATA_FILE = "products.json";

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

// ================ MAHSULOT QO‘SHISH ================
const productNameStep = "waiting_for_product_name";
const productPriceStep = "waiting_for_product_price";
const productPhotoStep = "waiting_for_product_photo";

// ================ TAHRIRLASH HOLATLARI ================
const editSelectProduct = "edit_select_product";
const editSelectField = "edit_select_field";
const editNewName = "edit_new_name";
const editNewPrice = "edit_new_price";

bot.command("addproduct", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = productNameStep;
  await ctx.replyWithHTML(
    "🆕 <b>Yangi mahsulot qo‘shish</b>\n\n" +
      "1-qadam: <b>Mahsulot nomi</b> nima?\n\n" +
      "Masalan: <i>Olma, Banan, Non, Sut</i>\n\n" +
      "Bekor qilish uchun /cancel"
  );
});

bot.command("cancel", async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.step = null;
  ctx.session.tempProduct = null;
  ctx.session.editData = null;
  await ctx.replyWithHTML("❌ <b>Bekor qilindi!</b>");
});

bot.on("text", async (ctx, next) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === productNameStep) {
    const name = ctx.message.text.trim();
    if (name === "/cancel") {
      await next();
      return;
    }
    ctx.session.tempProduct = { name };
    ctx.session.step = productPriceStep;
    await ctx.replyWithHTML(
      "✅ <b>Nomi:</b> " +
        name +
        "\n\n" +
        "2-qadam: <b>Narxi</b> necha so‘m?\n\n" +
        "Masalan: <i>12000</i>\n\n" +
        "Bekor qilish uchun /cancel"
    );
  } else {
    await next();
  }
});

bot.hears(/^\d+$/, async (ctx, next) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === productPriceStep) {
    const price = parseInt(ctx.message.text);
    ctx.session.tempProduct.price = price;
    ctx.session.step = productPhotoStep;
    await ctx.replyWithHTML(
      "✅ <b>Narxi:</b> " +
        price +
        " so‘m\n\n" +
        "3-qadam: <b>Mahsulot rasmini</b> yuboring (rasm yoki /skip)\n\n" +
        "Bekor qilish uchun /cancel"
    );
  } else if (ctx.session.step === editNewPrice) {
    const newPrice = parseInt(ctx.message.text);
    const editData = ctx.session.editData;
    updateProduct(ctx.from.id, editData.index, "price", newPrice);
    await ctx.replyWithHTML(
      "✅ <b>Mahsulot narxi yangilandi!</b>\n\n" +
        "📦 " +
        editData.name +
        " - yangi narx: " +
        newPrice +
        " so‘m"
    );
    ctx.session.step = null;
    ctx.session.editData = null;
  } else {
    await next();
  }
});

bot.on("photo", async (ctx) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === productPhotoStep) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;
    ctx.session.tempProduct.photo = fileId;

    const userId = ctx.from.id;
    addProduct(userId, ctx.session.tempProduct);

    await ctx.replyWithHTML(
      "✅ <b>Mahsulot muvaffaqiyatli qo‘shildi!</b>\n\n" +
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

bot.command("skip", async (ctx) => {
  if (!ctx.session) ctx.session = {};

  if (ctx.session.step === productPhotoStep) {
    const userId = ctx.from.id;
    addProduct(userId, ctx.session.tempProduct);

    await ctx.replyWithHTML(
      "✅ <b>Mahsulot rasm holda qo‘shildi!</b>\n\n" +
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

// ================ MAHSULOT TAHRIRLASH ================
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
    message += `${i + 1}. ${p.name} - ${p.price} so‘m\n`;
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
    ];

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✏️ <b>${product.name}</b> tahrirlanmoqda\n\n` +
        `📦 Hozirgi nom: ${product.name}\n` +
        `💰 Hozirgi narx: ${product.price} so‘m\n\n` +
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

// Yangi nomni qabul qilish (text handler)
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
    message += `${i + 1}. ${p.name} - ${p.price} so‘m\n`;
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
        " so‘m\n\n" +
        "Mahsulotlar ro‘yxatini ko‘rish: /myproducts",
      { parse_mode: "HTML" }
    );
  } else {
    await ctx.answerCbQuery("Xatolik yuz berdi!", { show_alert: true });
  }
});

// ================ MAVJUD MAHSULOTLARNI KO‘RSATISH ================
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

  let message = "📦 <b>Sizning mahsulotlaringiz:</b>\n\n";
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const number = i + 1;
    message += `${number}. <b>${p.name}</b> - ${p.price} so‘m\n`;

    if (p.photo) {
      await ctx.replyWithPhoto(p.photo, {
        caption: `${number}. ${p.name} - ${p.price} so‘m`,
      });
    }
  }

  await ctx.replyWithHTML(message);
});

// ================ OLDINGI BUYRUQLAR ================
bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    "🏪 <b>Online Vitrina Botiga xush kelibsiz!</b>\n\n" +
      "Sizning online vitrinangizni yaratishga yordam beraman.\n\n" +
      "<b>Quyidagi buyruqlardan foydalaning:</b>\n" +
      "/addproduct - Yangi mahsulot qo‘shish\n" +
      "/myproducts - Mahsulotlarimni ko‘rish\n" +
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
      "1. /addproduct - Mahsulot qo‘shish\n" +
      "2. So‘ralgan ma'lumotlarni kiriting\n" +
      "3. /myproducts - Barcha mahsulotlaringizni ko‘ring\n" +
      "4. /editproduct - Mahsulot nomi yoki narxini o‘zgartirish\n" +
      "5. /deleteproduct - Mahsulot o‘chirish\n\n" +
      "<b>Barcha buyruqlar:</b>\n" +
      "/start - Botni boshlash\n" +
      "/addproduct - Yangi mahsulot qo‘shish\n" +
      "/myproducts - Mahsulotlar ro‘yxati\n" +
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
  .then(() =>
    console.log(
      "✅ Bot ishga tushdi! (Qo‘shish + Ko‘rish + O‘chirish + Tahrirlash)"
    )
  )
  .catch((err) => console.error("Xatolik:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
