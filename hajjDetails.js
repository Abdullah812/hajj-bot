const hajjDetails = {
  sendHajjDetails: (bot, chatId) => {
    bot.sendMessage(chatId, `
🕋 تفاصيل مناسك الحج:

1️⃣ اليوم الثامن (التروية):
   • الإحرام من مكة
   • التوجه إلى منى
   • المبيت بمنى

2️⃣ اليوم التاسع (عرفة):
   • الوقوف بعرفة
   • الدعاء والذكر
   • التوجه إلى مزدلفة
   • المبيت بمزدلفة

3️⃣ اليوم العاشر (النحر):
   • رمي جمرة العقبة
   • النحر أو الذبح
   • الحلق أو التقصير
   • طواف الإفاضة
   • السعي

4️⃣ أيام التشريق:
   • المبيت بمنى
   • رمي الجمرات الثلاث
   • طواف الوداع

📱 للتفاصيل اضغط:
/day8 - اليوم الثامن
/day9 - يوم عرفة
/day10 - يوم النحر
/days11_13 - أيام التشريق
/back_rituals - العودة لقائمة المناسك
    `);
  }
};

module.exports = hajjDetails; 