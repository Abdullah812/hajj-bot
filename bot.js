const TelegramBot = require('node-telegram-bot-api');
const token = '7904338251:AAEtUrz2HKbxhnVEsIHG6e2hJJhAzenFuco';
const bot = new TelegramBot(token, { polling: true });

// القائمة الرئيسية
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
🕋 مرحباً بك في بوت الحج والعمرة

اختر من القائمة التالية:
1️⃣ /manasik - دليل المناسك
2️⃣ /places - دليل المشاعر المقدسة
3️⃣ /guide - الدليل الإرشادي
4️⃣ /help - المساعدة والدعم
  `);
});
