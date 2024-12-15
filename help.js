const help = {
  sendHelpList: (bot, chatId) => {
    bot.sendMessage(chatId, `
ℹ️ مركز المساعدة:

1️⃣ خدمة العملاء:
   • الاتصال المباشر: 920000000
   • واتساب: +966 50 000 0000
   • البريد: support@hajj-bot.com

2️⃣ الأسئلة الشائعة:
   • /faq - قائمة الأسئلة المتكررة
   • /contact - تواصل معنا
   • /report - الإبلاغ عن مشكلة

3️⃣ روابط مهمة:
   • وزارة الحج: /ministry
   • الدفاع المدني: /emergency
   • الصحة: /health

/back - العودة للقائمة الرئيسية
    `);
  }
};

module.exports = help; 