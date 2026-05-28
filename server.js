const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// BOT TOKENINGIZNI YOZING (bot.js dagi bilan bir xil)
const BOT_TOKEN = "8660848497:AAE6oVEe-36oknS3axnr7FqJ956BZ_FDLtY"; // <-- SHU YERGA O‘Z TOKENINGIZNI QO‘YING

// JSON fayldan ma'lumotlarni o‘qish
function loadProducts(userId) {
  try {
    const dataFile = path.join(__dirname, "products.json");
    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
      return data[userId] || [];
    }
  } catch (error) {
    console.error("Faylni o‘qishda xatolik:", error);
  }
  return [];
}

// Telegram rasmini URL ga aylantirish
async function getPhotoUrl(fileId) {
  try {
    // 1. file_path ni olish
    const fileResponse = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
      {
        params: { file_id: fileId },
      }
    );

    if (fileResponse.data.ok && fileResponse.data.result.file_path) {
      const filePath = fileResponse.data.result.file_path;
      // 2. To‘liq URL yaratish
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    }
    return null;
  } catch (error) {
    console.error("Rasm URL olishda xatolik:", error.message);
    return null;
  }
}

// EJS ni view engine qilib sozlash
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Statik fayllar uchun
app.use(express.static("public"));

// Asosiy sahifa: /:userId
app.get("/:userId", async (req, res) => {
  const userId = req.params.userId;
  const products = loadProducts(userId);

  // Har bir mahsulot uchun rasm URL sini olish
  const productsWithImages = await Promise.all(
    products.map(async (product) => {
      if (product.photo) {
        const photoUrl = await getPhotoUrl(product.photo);
        return { ...product, photoUrl };
      }
      return { ...product, photoUrl: null };
    })
  );

  // Agar foydalanuvchi topilmasa
  if (!productsWithImages || productsWithImages.length === 0) {
    return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Online Vitrina</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial; text-align: center; padding: 50px; }
                    .empty { color: #666; }
                </style>
            </head>
            <body>
                <h1>🏪 Online Vitrina</h1>
                <p class="empty">Bu foydalanuvchi hali mahsulot qo‘shmagan.</p>
            </body>
            </html>
        `);
  }

  // Sahifani render qilish
  res.render("vitrina", {
    userId: userId,
    products: productsWithImages,
    shopName: `Do‘kon #${userId.slice(-6)}`,
  });
});

// Bosh sahifa (userId kiritilmagan)
app.get("/", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Online Vitrina</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                input { padding: 10px; width: 250px; margin: 10px; border: 1px solid #ddd; border-radius: 8px; }
                button { padding: 10px 20px; background: #0088cc; color: white; border: none; border-radius: 8px; cursor: pointer; }
                button:hover { background: #006699; }
            </style>
        </head>
        <body>
            <h1>🏪 Online Vitrina</h1>
            <p>Vitrinani ko‘rish uchun user ID ni kiriting:</p>
            <input type="text" id="userId" placeholder="Masalan: 7093573259">
            <br>
            <button onclick="window.location.href='/'+document.getElementById('userId').value">Ko‘rish</button>
            <br><br>
            <small>Yoki botdagi /link dan olingan ID ni ishlating</small>
        </body>
        </html>
    `);
});

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`✅ Veb-server ishga tushdi!`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📱 Botdan /link buyrug‘i bilan olingan ID ni ishlating`);
  console.log(`💡 Masalan: http://localhost:3000/7093573259`);
});
