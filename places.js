const places = {
  sendPlacesList: (bot, chatId) => {
    bot.sendMessage(chatId, `
📍 دليل المشاعر المقدسة:

1️⃣ المسجد الحرام:
   • الكعبة المشرفة
   • مقام إبراهيم
   • الحجر الأسود
   • زمزم
   • الصفا والمروة

2️⃣ منى:
   • الجمرات الثلاث
   • مسجد الخيف
   • مخيمات الحجاج

3️⃣ مزدلفة:
   • المشعر الحرام
   • وادي محسر

4️⃣ عرفات:
   • جبل الرحمة
   • مسجد نمرة
   • وادي عرنة

📱 للمواقع اضغط:
/locations - خريطة المشاعر
/back - العودة للقائمة الرئيسية
    `);
  }
};

module.exports = places; 