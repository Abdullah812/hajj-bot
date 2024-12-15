const guide = {
  sendGuideList: (bot, chatId) => {
    bot.sendMessage(chatId, `
📋 الدليل الإرشادي:

1️⃣ قبل الحج:
   • الاستعداد النفسي
   • الأوراق المطلوبة
   • التطعيمات
   • ما يحمله الحاج

2️⃣ أثناء الحج:
   • الأدعية المأثورة
   • الأخطاء الشائعة
   • النصائح الطبية
   • أرقام الطوارئ

3️⃣ بعد الحج:
   • زيارة المدينة
   • العودة للوطن

📱 للتفاصيل اضغط:
/before - قبل الحج
/during - أثناء الحج
/after - بعد الحج
/back - العودة للقائمة الرئيسية
    `);
  }
};

module.exports = guide; 