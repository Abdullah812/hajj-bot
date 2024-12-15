require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot('7904338251:AAEtUrz2HKbxhnVEsIHG6e2hJJhAzenFuco', { polling: true });

// تعريف قائمة الأدمن في بداية الملف
const ADMIN_IDS = [
    7946584761, // رقم تعريف الأدمن الأول
    987654321  // رقم تعريف الأدمن الثاني
    // أضف المزيد من الأدمن هنا
];

// دالة التحقق من الأدمن
function isAdmin(userId) {
    return ADMIN_IDS.includes(Number(userId));
}

// دالة جلب قائمة الأدمن
function getAdmins() {
    return ADMIN_IDS;
}

// دالة إرسال إشعار للأدمن
async function notifyAdmins(bot, message, options = {}) {
    try {
        for (const adminId of ADMIN_IDS) {
            await bot.sendMessage(adminId, message, {
                parse_mode: 'Markdown',
                ...options
            });
        }
    } catch (error) {
        console.error('خطأ في إرسال الإشعار للأدمن:', error);
    }
}

// ملفات تخزين البيانات
const DB_FILES = {
    USERS: 'database/users.json',
    REPORTS: 'database/reports.json',
    LOGS: 'database/logs.json'
};

// التأكد من وجود مجلد قاعدة البيانات
if (!fs.existsSync('database')) {
    fs.mkdirSync('database');
}

// تهيئة ملفات البيانات
for (const file of Object.values(DB_FILES)) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({}));
    }
}

// قراءة البيانات
let users = JSON.parse(fs.readFileSync(DB_FILES.USERS) || '{}');
let reports = JSON.parse(fs.readFileSync(DB_FILES.REPORTS) || '{}');
let logs = JSON.parse(fs.readFileSync(DB_FILES.LOGS) || '{}');

// دالة حفظ البيانات
function saveData(type, data) {
    fs.writeFileSync(DB_FILES[type], JSON.stringify(data, null, 2));
}

// تعديل الأزرار الرئيسية
const keyboards = {
    main: {
        reply_markup: {
            keyboard: [
                ['طلب مساعدة 🆘', 'دليل المشاعر 🕋'],
                ['إرشادات ونصائح 📝', 'أرقام الطوارئ ☎️'],
                ['خدمات إضافية ℹ️', 'اختيار اللغة 🌐'],
                ['بلاغاتي وطلباتي 📋']
            ],
            resize_keyboard: true
        }
    },
    admin: {
        reply_markup: {
            keyboard: [
                ['عرض البلاغات 📋', 'إحصائيات 📊'],
                ['إدارة المستخدمين 👥', 'السجلات 📝'],
                ['رجوع للرئيسية 🏠']
            ],
            resize_keyboard: true
        }
    }
};

// تعريف متغير حالات المستخدمين
const userStates = {};

// إضافة دالة لحفظ حالة المستخدم
function setUserState(userId, state) {
    userStates[userId] = state;
}

// إضافة دالة للحصول على حالة المستخدم
function getUserState(userId) {
    return userStates[userId] || null;
}

// إضافة دالة لمح حالة المستخدم
function clearUserState(userId) {
    delete userStates[userId];
}

// دالة إنشاء بلاغ جديد
function createReport(userId, type, details) {
    const reportId = Date.now().toString();
    reports[reportId] = {
        id: reportId,
        userId: userId,
        type: type,
        details: details,
        status: 'pending',
        timestamp: new Date().toISOString(),
        updates: [],
        location: null
    };
    return reportId;
}

// دالة تحديث حالة البلاغ
function updateReportStatus(reportId, newStatus, comment) {
    if (reports[reportId]) {
        reports[reportId].status = newStatus;
        reports[reportId].updates.push({
            timestamp: new Date().toISOString(),
            status: newStatus,
            comment: comment
        });
        return true;
    }
    return false;
}

// دالة جلب بلاغ معين
function getReport(reportId) {
    return reports[reportId] || null;
}

// دالة جلب بلاغات مستخدم معين
function getUserReports(userId) {
    return Object.values(reports).filter(report => report.userId === userId);
}

// دالة حذف بلاغ
function deleteReport(reportId) {
    if (reports[reportId]) {
        delete reports[reportId];
        return true;
    }
    return false;
}

// دالة تحويل حالة البلاغ للعربية
function getStatusInArabic(status) {
    const statusMap = {
        'pending': 'قيد الانتظار ⏳',
        'processing': 'قيد المعالجة 🔄',
        'completed': 'مكتمل ✅',
        'closed': 'مغلق ❌',
        'cancelled': 'ملغي 🚫'
    };
    return statusMap[status] || status;
}

// تحديث معالج الرسائل
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    try {
        // تسجيل ��ستخدم جديد
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                name: msg.from.first_name,
                username: msg.from.username,
                joinDate: new Date().toISOString(),
                reportsCount: 0
            };
            saveData('USERS', users);
        }

        // معالجة زر الرجوع للرئيسية
        if (text === 'رجوع للرئيسية 🏠') {
            if (isAdmin(userId)) {
                await bot.sendMessage(
                    chatId,
                    'تم الرجوع للقائمة الرئيسية العامة 🏠',
                    keyboards.main
                );
            } else {
                await bot.sendMessage(
                    chatId,
                    'القائمة الرئيسية:',
                    keyboards.main
                );
            }
            return;
        }

        // التحقق من الأدمن
        if (isAdmin(userId)) {
            switch(text) {
                case '/start':
                case '/admin':
                    await bot.sendMessage(
                        chatId,
                        'مرحباً بك في لوحة التحكم 👋\nاختر من القائمة:',
                        keyboards.admin
                    );
                    return;

                case 'عرض البلاغات 📋':
                    if (isAdmin(userId)) {
                        const allReports = Object.values(reports);
                        
                        if (allReports.length === 0) {
                            await bot.sendMessage(
                                chatId,
                                'لا توجد بلاغات مسجلة 📝',
                                {
                                    reply_markup: {
                                        keyboard: [
                                            ['رجوع للرئيسية 🏠']
                                        ],
                                        resize_keyboard: true
                                    }
                                }
                            );
                        } else {
                            // تنيف البلاغات حسب الحالة
                            const pendingReports = allReports.filter(r => r.status === 'pending').length;
                            const processingReports = allReports.filter(r => r.status === 'processing').length;
                            const completedReports = allReports.filter(r => r.status === 'completed').length;
                            
                            // عرض آخر 5 بلاغات
                            const recentReports = allReports
                                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                .slice(0, 5)
                                .map(report => 
                                    `🆔 رقم البلاغ: #${report.id}\n` +
                                    `👤 المستخدم: ${users[report.userId]?.name || 'غير معروف'}\n` +
                                    `📝 النوع: ${report.type}\n` +
                                    `📊 الحالة: ${getStatusInArabic(report.status)}\n` +
                                    `⏰ التاريخ: ${new Date(report.timestamp).toLocaleString('ar-SA')}\n` +
                                    `ـــــــــــــــــــــــــــــ`
                                ).join('\n');

                            await bot.sendMessage(
                                chatId,
                                '*📊 إحصائيات البلاغات:*\n\n' +
                                `📝 إجمالي البلاغات: ${allReports.length}\n` +
                                `⏳ قيد الانتظار: ${pendingReports}\n` +
                                `🔄 قيد المعالجة: ${processingReports}\n` +
                                `✅ مكتملة: ${completedReports}\n\n` +
                                '*📋 آخر البلاغات:*\n\n' +
                                recentReports,
                                {
                                    parse_mode: 'Markdown',
                                    reply_markup: {
                                        keyboard: [
                                            ['البلاغات المعلقة ⏳', 'البلاغات قيد المعالجة 🔄'],
                                            ['البلاغات المكتملة ✅', 'جميع البلاغات 📋'],
                                            ['تصدير البلاغات 📊', 'بحث عن بلاغ 🔍'],
                                            ['رجوع للرئيسية 🏠']
                                        ],
                                        resize_keyboard: true
                                    }
                                }
                            );
                        }
                    }
                    break;

                case 'إحصائيات 📊':
                    const stats = {
                        users: Object.keys(users).length,
                        reports: Object.keys(reports).length
                    };
                    
                    await bot.sendMessage(
                        chatId,
                        `📊 إحصائيات:\n👥 المستخدمين: ${stats.users}\n📝 البلاغات: ${stats.reports}`
                    );
                    break;

                case 'إدارة المستخدمين 👥':
                    const recentUsers = Object.entries(users)
                        .slice(-10)
                        .map(([id, user]) => 
                            `👤 ${user.name}\n` +
                            `🆔 ${id}\n` +
                            `📱 @${user.username || 'لا يوجد'}\n` +
                            `📅 ${new Date(user.joinDate).toLocaleString('ar-SA')}\n` +
                            `📝 البلاغات: ${user.reportsCount || 0}\n` +
                            `ـــــــــــــــــــــــــــــ`
                        ).join('\n');
                    
                    await bot.sendMessage(
                        chatId,
                        `👥 آخر 10 مستخدمين:\n\n${recentUsers || 'لا يوجد مستخدمين'}`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: 'بحث عن مستخدم 🔍', callback_data: 'search_user' },
                                        { text: 'تصدير CSV 📊', callback_data: 'export_users' }
                                    ]
                                ]
                            }
                        }
                    );
                    break;

                case 'السجلات 📝':
                    const recentLogs = Object.entries(logs)
                        .slice(-10)
                        .map(([_, log]) => 
                            `⏰ ${new Date(log.timestamp).toLocaleString('ar-SA')}\n` +
                            `👤 ${users[log.userId]?.name || log.userId}\n` +
                            `📝 ${log.action}\n` +
                            `📄 ${log.details}\n` +
                            `ـــــــــــــــــــــــــــــ`
                        ).join('\n');
                    
                    await bot.sendMessage(
                        chatId,
                        `📝 آخر 10 سجلات:\n\n${recentLogs || 'لا توجد سجلات'}`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: 'تصفية السجلات 🔍', callback_data: 'filter_logs' },
                                        { text: 'تصدير السجلات 📊', callback_data: 'export_logs' }
                                    ]
                                ]
                            }
                        }
                    );
                    break;
            }
        }

        // معالجة الرسائل العادية
        switch(text) {
            case '/start':
                const mainKeyboard = {
                    reply_markup: {
                        keyboard: [
                            ['طلب مساعدة 🆘', 'دليل المشاعر 🕋'],
                            ['إرشادات ونصائح 📝', 'أرقام الطوارئ ☎️'],
                            ['خدمات إضافية ℹ️', 'اختيار اللغة 🌐'],
                            ['بلاغاتي وطلباتي 📋']
                        ],
                        resize_keyboard: true
                    }
                };

                await bot.sendMessage(
                    chatId,
                    'مرحباً بك في بوت المساعدة! 🌟\nكيف يمكنني مساعدتك؟',
                    mainKeyboard
                );
                break;

            case 'طلب مساعدة 🆘':
                await bot.sendMessage(
                    chatId,
                    '*خدمة طلب المساعدة:*\n\n' +
                    '🚨 اختر نوع المساعدة المطلوبة:',
                    {
                        reply_markup: {
                            keyboard: [
                                ['مساعدة طبية طارئة 🚑', 'تائه وأحتاج مساعدة 🗺'],
                                ['مساعدة أمنية 👮‍♂️', 'مشكل�� في السكن 🏠'],
                                ['مساعدة في المواصلات 🚌', 'فقدان شخص 🔍'],
                                ['مساعدة مالية طارئة 💰', 'حالة طارئة أخرى ⚠️'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'مساعدة طبية طارئة 🚑':
                await bot.sendMessage(
                    chatId,
                    '*طلب مساعدة طبية طارئة:*\n\n' +
                    '*⚕️ اختر نوع الحالة:*',
                    {
                        reply_markup: {
                            keyboard: [
                                ['إسعاف طارئ 🚨', 'إجهاد حراري 🌡'],
                                ['إصابة أو جرح 🤕', 'مشكلة تنفس 😮‍💨'],
                                ['ألم في الصدر 💔', 'مرض مزمن 💊'],
                                ['رجوع لقائمة المساعدة ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'إسعاف طارئ 🚨':
                await bot.sendMessage(
                    chatId,
                    '*جاري طلب إسعاف طارئ*\n\n' +
                    '⏳ *الخطوات التالية:*\n' +
                    '1. سيتم الاتصال بك خلال دقيقة\n' +
                    '2. يرجى إرسال موقعك الحالي\n' +
                    '3. ابق في مكانك\n\n' +
                    '📍 *أرسل موقعك الآن*\n\n' +
                    '☎️ *للطوارئ المباشرة:*\n' +
                    '- اتصل: 997'
                );
                // تفعيل انتظار الموقع
                userStates[chatId] = 'waiting_location_emergency';
                break;

            case 'فقدان شخص 🔍':
                await bot.sendMessage(
                    chatId,
                    '*الإبلاغ عن شخص مفقود:*\n\n' +
                    '*📝 يرجى تقديم المعلومات التالية:*\n' +
                    '1. اسم المفقود\n' +
                    '2. العمر\n' +
                    '3. الجنسية\n' +
                    '4. الملابس\n' +
                    '5. آخر موقع ��وهد فيه\n' +
                    '6. رقم الحملة\n\n' +
                    '*🚨 سيتم التواصل معك فوراً*\n\n' +
                    '*📞 للحالات العاجلة:*\n' +
                    '- مركز البلاغات: 911\n' +
                    '- أمن الحرم: 989',
                    {
                        reply_markup: {
                            keyboard: [
                                ['تسجيل بلاغ مفقود 📝'],
                                ['البحث في قائمة المفقودين 🔍'],
                                ['رجوع لقائمة المساع��ة ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'مساعدة أمنية 👮‍♂️':
                await bot.sendMessage(
                    chatId,
                    '*إلب مساعدة أمنية:*\n\n' +
                    '*🚨 اختر نوع المساعدة:*',
                    {
                        reply_markup: {
                            keyboard: [
                                ['حالة طارئة 🆘', 'سرقة أو نشل 🚨'],
                                ['مضايقات ��', 'مشاجرة 👥'],
                                ['تصرف مشبوه 🕵️‍♂️', 'طلب دورية أمنية 🚓'],
                                ['رجوع لقائمة المساعدة ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'حالة طارئة أخرى ⚠️':
                await bot.sendMessage(
                    chatId,
                    '*تسجيل حالة طارئة:*\n\n' +
                    '*⚠️ اختر نوع الحالة:*',
                    {
                        reply_markup: {
                            keyboard: [
                                ['حريق 🔥', 'انهيار أو سقوط ⚡️'],
                                ['ازدحام شديد 👥', 'حادث 💥'],
                                ['كارثة طبيعية 🌪', 'تعطل مرافق 🏗'],
                                ['رجوع لقائمة المساعدة ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'رجوع لقائمة المساعدة ⬅️':
                // الرجوع لقائمة المساعدة الرئيسية
                await bot.sendMessage(
                    chatId,
                    '*خدمة طلب المساعدة:*\n\n' +
                    '🚨 اختر نوع المساعدة المطلوبة:',
                    {
                        reply_markup: {
                            keyboard: [
                                ['مساعدة طبية طارئة 🚑', 'تائه وأحتاج مساعدة 🗺'],
                                ['مساعدة أمنية 👮‍♂️', 'مشكلة في السكن 🏠'],
                                ['مساعدة في المواصلات 🚌', 'فقدان شخص 🔍'],
                                ['مساعدة مالية طارئة 💰', 'حالة طارئة أخرى ⚠️'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'دليل المشاعر 🕋':
                await bot.sendMessage(
                    chatId,
                    'اختر المكان الذي تريد معرفة معلومات عنه:',
                    {
                        reply_markup: {
                            keyboard: [
                                ['المسجد الحرام 🕋', 'منى 🏕'],
                                ['عرفات 🏔', 'مزدلفة 🌙'],
                                ['الجمرات 🗿', 'معلومات عامة ℹ️'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'إرشادات ونصائح 📝':
                await bot.sendMessage(
                    chatId,
                    '*إرشاد��ت ونصائح مهمة:*\n' +
                    'اختر نوع الإرشادات المطلوبة:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['إرشادات صحية 🏥', 'إرشادات أمنية 👮‍♂️'],
                                ['إرشادات السلامة ⚠️', 'إرشادات المشاعر 🕋'],
                                ['نصائح عامة 📋', 'أخطاء شائعة ❌'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'إرشادات صحية 🏥':
                await bot.sendMessage(
                    chatId,
                    '*الإرشادات الصحية:*\n\n' +
                    '*🌡 الوقاية من الإجهاد الحراري:*\n' +
                    '• شرب الماء بكثرة\n' +
                    '• استخدام المظلة الشمسية\n' +
                    '• تجنب الخروج وقت الظهيرة\n' +
                    '• ارتداء ملابس قطنية فضف��ضة\n\n' +
                    '*💊 الأدوية والإسعافات:*\n' +
                    '• احمل أدويتك الخاصة\n' +
                    '• احتفظ ببطاقة حالتك الصحية\n' +
                    '• تعرف على أقرب مركز صحي\n' +
                    '• احمل أرقام الطوارئ\n\n' +
                    '*🦠 الوقاية من الأمراض:*\n' +
                    '• غسل اليدين باستمرار\n' +
                    '• تجنب الازدحام\n' +
                    '• استخدام المعقمات\n' +
                    '• تناول الطعام من مصادر موثوقة',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['مراكز صحية قريبة 🏥', 'أرقام طوارئ ☎️'],
                                ['رجوع للإرشادات ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'إرشادات أمنية 👮‍♂️':
                await bot.sendMessage(
                    chatId,
                    '*الإرشادات الأمنية:*\n\n' +
                    '*🔒 حماية الممتلكات:*\n' +
                    '• احفظ متعلقاتك في مكان آمن\n' +
                    '• لا تحمل مبالغ كبيرة\n' +
                    '• استخدم حزام النقود\n' +
                    '• وثّق أرقام وثائقك المهمة\n\n' +
                    '*👥 السلامة الشخصية:*\n' +
                    '• التزم بمجموعتك\n' +
                    '• احفظ رقم حملتك\n' +
                    '• تجنب الأماكن المزدحمة\n' +
                    '• كن ذراً من المحتالين\n\n' +
                    '*🚔 في حالات الطوارئ:*\n' +
                    '• اتصل بالشرطة: 911\n' +
                    '• أبلغ مرشد حملتك\n' +
                    '• توجه لأقرب نقطة أمنية\n' +
                    '• احتفظ بصور وثائقك',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['نقاط أمنية قريبة 👮‍♂️', 'أرقام طوارئ ☎️'],
                                ['رجوع للإرشادات ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'إرشادات المشاعر 🕋':
                await bot.sendMessage(
                    chatId,
                    '*إرشادات المشاعر المقدسة:*\n\n' +
                    '*🕋 المسجد الحرام:*\n' +
                    '• احترم قسية المكان\n' +
                    '• اتبع إرشادات المنظمين\n' +
                    '• ح��فظ على النظافة\n' +
                    '• تجنب الازدحام\n\n' +
                    '*⛺️ منى:*\n' +
                    '• التزم بمخيم حملتك\n' +
                    '• احفظ موقع مخيمك\n' +
                    '• اتبع مسارات المشاة\n' +
                    '• احترم خصوصية الآخرين\n\n' +
                    '*🏔 عرفات:*\n' +
                    '• البقاء حتى غروب الشمس\n' +
                    '• تجنب النوم في العراء\n' +
                    '• الالتزام بمكان حملتك\n' +
                    '• الحذر من أشعة الشمس\n\n' +
                    '*🌙 مزدلفة:*\n' +
                    '• جمع الحصى المناسب\n' +
                    '• عدم أخذ حصى كبير\n' +
                    '• النوم في المكان الخصص\n' +
                    '• الحفاظ على الهدوء',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['خريطة المشاعر 🗺', 'مواقيت الصلاة 🕌'],
                                ['رجوع للإرشادات ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'نصائح عامة 📋':
                await bot.sendMessage(
                    chatId,
                    '*نصائح عامة مهمة:*\n\n' +
                    '*🎒 قبل المغادرة:*\n' +
                    '• تأكد من وثائقك\n' +
                    '• احمل الأدوية الضرورية\n' +
                    '• خذ ملابس مناسبة\n' +
                    '• اشحن هاتفك\n\n' +
                    '*📱 وسائل الاتصال:*\n' +
                    '• احفظ أرقام الطوارئ\n' +
                    '• سجل رقم حملتك\n' +
                    '• حمل شاحن احتياطي\n' +
                    '• تأكد من خدمة التجوال\n\n' +
                    '*💡 نصائح متفرقة:*\n' +
                    '• احترم الآخرين\n' +
                    '• التزم بالهدوء\n' +
                    '• ساعد المتاجين\n' +
                    '• حافظ على النظافة',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['أرقام مهمة ☎️', 'خدمات عامة 🔧'],
                                ['رجوع للإرشادات ⬅️']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'رجوع للإرشادات ⬅️':
                await bot.sendMessage(
                    chatId,
                    '*إرشادات ونصائح مهمة:*\n' +
                    'اختر نوع الإرشادات المطلوبة:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['إرشادات صحية 🏥', 'إرشادات أمنية 👮‍♂️'],
                                ['إرشادات السلامة ⚠️', 'إرشادات المشاعر 🕋'],
                                ['نصائح عامة 📋', 'أخطاء شائعة ❌'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'أرقام الطوارئ ☎️':
                await bot.sendMessage(
                    chatId,
                    'أرقام الطوارئ المهمة:\n\n' +
                    '🚑 الإسعاف: 997\n' +
                    '🚒 الدفاع المدني: 998\n' +
                    '🆘 الطوارئ الموحد: 911\n' +
                    '🏥 الهلال الأحمر: 937'
                );
                break;

            case 'خدمات إضافية ℹ️':
                await bot.sendMessage(
                    chatId,
                    'اختر الخدمة المطلوبة:',
                    {
                        reply_markup: {
                            keyboard: [
                                ['خريطة المشاعر 🗺', 'مواقي الصلاة 🕌'],
                                ['حالة الطقس 🌡', 'المراكز الصحية القريبة 🏥'],
                                ['خدمات النقل 🚌', 'معلومات الحملات 🏢'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'اختيار ا��لغة 🌐':
                await bot.sendMessage(
                    chatId,
                    'اختر لغتك المفضلة:',
                    {
                        reply_markup: {
                            keyboard: [
                                ['العربية 🇸🇦', 'English 🇬🇧'],
                                ['اردو 🇵🇰', 'فارسی 🇮🇷'],
                                ['Türkçe 🇹🇷', 'Indonesia 🇮🇩'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'بلاغاتي وطلباتي 📋':
                await bot.sendMessage(
                    chatId,
                    '*قائمة البلاغات والطلبات:*\n' +
                    'اختر الخدمة المطلوبة:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['تقديم بلاغ جديد ✍️', 'عرض بلاغاتي 📝'],
                                ['متابعة بلاغ 🔍', 'تحديث بلاغ 🔄'],
                                ['طلباتي السابقة 📜', 'حالة الطلب 📊'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                break;

            case 'عرض بلاغاتي 📝':
                const userReports = Object.values(reports)
                    .filter(report => report.userId === userId);
                
                if (userReports.length === 0) {
                    await bot.sendMessage(
                        chatId,
                        '*📋 بلاغاتي:*\n\n' +
                        'لا توجد لديك بلاغات مسجلة.',
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                keyboard: [
                                    ['تقديم بلاغ جديد ✍️'],
                                    ['رجوع للرئيسية 🏠']
                                ],
                                resize_keyboard: true
                            }
                        }
                    );
                } else {
                    const reportsList = userReports
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map(report => 
                            `🆔 رقم البلاغ: #${report.id}\n` +
                            `📝 النوع: ${report.type}\n` +
                            `📊 الحالة: ${getStatusInArabic(report.status)}\n` +
                            `⏰ التاريخ: ${new Date(report.timestamp).toLocaleString('ar-SA')}\n` +
                            `ـــــــــــــــــــــــــــــ`
                        ).join('\n');

                    await bot.sendMessage(
                        chatId,
                        '*📋 بلاغاتي:*\n\n' + reportsList,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                keyboard: [
                                    ['تقديم بلاغ جديد ✍️', 'متابعة بلاغ 🔍'],
                                    ['تحديث بلاغ 🔄', 'إلغاء بلاغ ❌'],
                                    ['رجوع للرئيسية 🏠']
                                ],
                                resize_keyboard: true
                            }
                        }
                    );
                }
                break;

            case 'تقديم بلاغ جديد ✍️':
                await bot.sendMessage(
                    chatId,
                    '*تقديم بلاغ جديد:*\n\n' +
                    'اختر نوع البلاغ:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['مشكلة طبية 🏥', 'مشكلة أمنية 👮‍♂️'],
                                ['مشكلة في السكن 🏠', 'مشكلة في النقل 🚌'],
                                ['مشكلة في الخدمات ⚡️', 'مفقودات 💼'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                userStates[userId] = 'waiting_report_type';
                break;

            case 'متابعة بلاغ 🔍':
                await bot.sendMessage(
                    chatId,
                    'الرجاء إدخال رقم البلاغ:\n' +
                    'مثال: #123456',
                    {
                        reply_markup: {
                            keyboard: [
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                userStates[userId] = 'waiting_report_number';
                break;

            case 'البلاغات المعلقة ⏳':
                if (isAdmin(userId)) {
                    const pendingReports = Object.values(reports)
                        .filter(r => r.status === 'pending')
                        .map(report => 
                            `🆔 #${report.id}\n` +
                            `👤 ${users[report.userId]?.name || 'غير معروف'}\n` +
                            `📝 ${report.type}\n` +
                            `⏰ ${new Date(report.timestamp).toLocaleString('ar-SA')}\n` +
                            `📄 ${report.details}\n` +
                            `ـــــــــــــــــــــــــــــ`
                        ).join('\n');

                    await bot.sendMessage(
                        chatId,
                        '*📋 البلاغات المعلقة:*\n\n' +
                        (pendingReports || 'لا توجد بلاغات معلقة'),
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                keyboard: [
                                    ['معالجة بلاغ ✍️', 'تحديث حالة بلاغ 🔄'],
                                    ['رجوع للرئيسية 🏠']
                                ],
                                resize_keyboard: true
                            }
                        }
                    );
                }
                break;

            case 'معالجة بلاغ ✍️':
                if (isAdmin(userId)) {
                    await bot.sendMessage(
                        chatId,
                        'الرجاء إدخال رقم البلاغ:\n' +
                        'مثال: #123456',
                        {
                            reply_markup: {
                                keyboard: [
                                    ['رجوع للرئيسية 🏠']
                                ],
                                resize_keyboard: true
                            }
                        }
                    );
                    userStates[userId] = 'admin_process_report';
                }
                break;

            case 'تحديث حالة بلاغ 🔄':
                if (isAdmin(userId)) {
                    await bot.sendMessage(
                        chatId,
                        'الرجاء إدخال رقم البلاغ:\n' +
                        'مثال: #123456',
                        {
                            reply_markup: {
                                keyboard: [
                                    ['رجوع للرئيسية 🏠']
                                ],
                                resize_keyboard: true
                            }
                        }
                    );
                    userStates[userId] = 'admin_update_report';
                }
                break;

            case 'مشكلة طبية 🏥':
                await bot.sendMessage(
                    chatId,
                    '*تسجيل بلاغ طبي:*\n\n' +
                    'اختر نوع الحالة الطبية:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['حالة طارئة ⚠️', 'إصابة 🤕'],
                                ['مرض مزمن 💊', 'إجهاد حراري 🌡'],
                                ['استشارة طبية 👨‍⚕️', 'طلب دواء 💉'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                userStates[userId] = 'medical_report_type';
                break;

            case 'مشكلة في السكن 🏠':
                await bot.sendMessage(
                    chatId,
                    '*تسجيل مشكلة في السكن:*\n\n' +
                    'اختر نوع المشكلة:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['مشكلة في التكييف 🌡', 'مشكلة في المياه 💧'],
                                ['مشكلة في الكهرباء ⚡️', 'مشكلة في النظافة 🧹'],
                                ['مشكلة في الأثاث 🛏', 'مشكلة أخرى 📝'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                userStates[userId] = 'housing_report_type';
                break;

            case 'مشكلة في النقل 🚌':
                await bot.sendMessage(
                    chatId,
                    '*تسجيل مشكلة في النقل:*\n\n' +
                    'اختر نوع المشكلة:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['تأخير في النقل ⏰', 'حافلة معطلة 🚍'],
                                ['مشكلة في التكييف 🌡', 'ازدحام شديد 👥'],
                                ['سائق غير ملتزم 🚫', 'مشكلة أخرى 📝'],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                userStates[userId] = 'transport_report_type';
                break;

            case 'مفقودات 💼':
                await bot.sendMessage(
                    chatId,
                    '*تسجيل بلاغ مفقودات:*\n\n' +
                    'اختر نوع المفقودات:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['وثائق رسمية 📄', 'أمتعة شخصية 🎒'],
                                ['هاتف/جهاز 📱', 'محفظة/نقود 💰'],
                                ['مستندات مهمة 📑', 'أخرى '],
                                ['رجوع للرئيسية 🏠']
                            ],
                            resize_keyboard: true
                        }
                    }
                );
                userStates[userId] = 'lost_items_type';
                break;

            // معالجة إدخال تفاصيل البلاغ
            default:
                const state = userStates[userId];
                if (state && typeof state === 'string' && state.endsWith('_type')) {
                    // حفظ نوع البلاغ وطلب التفاصيل
                    userStates[userId] = {
                        type: text,
                        stage: 'waiting_details'
                    };

                    await bot.sendMessage(
                        chatId,
                        '*📝 يرجى كتابة تفاصيل المشكلة:*\n\n' +
                        '- اذكر الموقع بالتفصيل\n' +
                        '- وقت حدوث المشكلة\n' +
                        '- أي معلومات إضافية مهمة\n\n' +
                        '_اكتب التفاصيل في رسالة واحدة_',
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                keyboard: [
                                    ['إلغاء البلاغ ❌']
                                ],
                                resize_keyboard: true
                            }
                        }
                    );
                } else if (state && typeof state === 'object' && state.stage === 'waiting_details') {
                    if (text === 'إلغاء البلاغ ❌') {
                        delete userStates[userId];
                        await bot.sendMessage(
                            chatId,
                            '❌ تم إلغاء تسجيل البلاغ',
                            {
                                reply_markup: {
                                    keyboard: [
                                        ['رجوع للرئيسية 🏠']
                                    ],
                                    resize_keyboard: true
                                }
                            }
                        );
                    } else {
                        // إنشاء البلاغ
                        const reportId = createReport(userId, state.type, text);
                        delete userStates[userId];

                        await bot.sendMessage(
                            chatId,
                            `✅ *تم تسجيل بلاغك بنجاح*\n\n` +
                            `🆔 رقم البلاغ: #${reportId}\n` +
                            `📝 النوع: ${state.type}\n` +
                            `⏰ التاريخ: ${new Date().toLocaleString('ar-SA')}\n\n` +
                            `_سيتم التواصل معك قريباً_`,
                            {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    keyboard: [
                                        ['متابعة البلاغ 🔍', 'بلاغ جديد ✍️'],
                                        ['رجوع للرئيسية 🏠']
                                    ],
                                    resize_keyboard: true
                                }
                            }
                        );

                        // إشعار الأدمن
                        const adminMessage = 
                            `🚨 *بلاغ جديد*\n\n` +
                            `🆔 رقم البلاغ: #${reportId}\n` +
                            `👤 المستخدم: ${userId}\n` +
                            `📝 النوع: ${state.type}\n` +
                            `📄 التفاصيل: ${text}\n\n` +
                            `*الإجراءات المتاحة:*\n` +
                            `• استلام البلاغ\n` +
                            `• تحويل البلاغ\n` +
                            `• طلب علومات إضافية`;

                        await notifyAdmins(bot, adminMessage);
                    }
                }
        }

    } catch (error) {
        console.error('خطأ:', error);
        await bot.sendMessage(
            chatId,
            'عذراً، حدث خطأ. حاول مرة أخرى.'
        );
    }
});

// دالة تحويل حالة البلاغ للعربية
function getStatusInArabic(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد المعالجة',
        'completed': 'مكتمل',
        'closed': 'مغلق'
    };
    return statusMap[status] || status;
}

// معالجة إدخال رقم البلاغ
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const state = getUserState(userId);

    if (state === 'waiting_report_number') {
        if (text.startsWith('#')) {
            const reportId = text.substring(1);
            const report = reports[reportId];
            
            if (report) {
                await bot.sendMessage(
                    chatId,
                    `*تفاصيل البلاغ #${reportId}:*\n\n` +
                    `📝 النوع: ${report.type}\n` +
                    `📊 الحالة: ${getStatusInArabic(report.status)}\n` +
                    `⏰ تاريخ اتسجيل: ${new Date(report.timestamp).toLocaleString('ar-SA')}\n` +
                    `📄 التفاصيل: ${report.details}\n\n` +
                    `*آخر التحديثات:*\n` +
                    (report.updates.length > 0 ? 
                        report.updates.map(update => 
                            `${new Date(update.timestamp).toLocaleString('ar-SA')}: ${update.text}`
                        ).join('\n')
                        : 'لا توجد تحديثات'),
                    {
                        parse_mode: 'Markdown'
                    }
                );
            } else {
                await bot.sendMessage(
                    chatId,
                    '❌ عذراً، لم يتم العثور على البلاغ'
                );
            }
            clearUserState(userId);
        }
    }
});

// إضافة أوامر جديدة
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
مرحباً بك في بوت الحج! 🕋
الأوامر المتاحة:
/start - بدء استخدام البوت
/help - عرض ا��مساعدة
/info - معلومات عن الحج
/contact -  واصل معنا
  `);
});

bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
معلومات عن الحج:
- الحج هو الركن الخامس من أركان الإسلام
- يجب على المسلم البالغ القادر مرة في العمر
- يتم في شهر ذي الحجة من كل عام
  `);
});

bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
للتواصل معنا:
- البريد الإلكتروني: https://manasek.sa/ar
-  رقم الهاتف:+9668002450088
- تويتر:https://x.com/ManasekIPMC
  `);
});

bot.onText(/\/places/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
🕋 دليل المشاعر المقدسة:

1️⃣ المسجد الحرام:
   - موقع الكعبة المشرفة
   - مقام إبراهيم
   - الحجر الأسود
   - زمزم

2️⃣ منى:
   - الجمرات الثلاث
   - مسجد الخيف
   - مخيمات الحجاج

3️⃣ مزدلفة:
   - المشعر الحرام
   - وادي محسر

4️⃣ عرفات:
   - جبل الرحمة
   - مسجد نمرة
   - وادي عرنة

📍 للحصول على موقع أي مشعر، اكتب:
/location + ��سم المكان
مثال: /location منى
`);
});

bot.onText(/\/location (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const place = match[1];
  
  const locations = {
    'منى': { lat: 21.413333, lon: 39.893333 },
    'مزدلفة': { lat: 21.373333, lon: 39.916667 },
    'عرفات': { lat: 21.355833, lon: 39.984167 },
    'المسجد الحرام': { lat: 21.422487, lon: 39.826206 }
  };

  if (locations[place]) {
    bot.sendLocation(chatId, locations[place].lat, locations[place].lon);
    bot.sendMessage(chatId, `📍 موقع ${place}`);
  } else {
    bot.sendMessage(chatId, 'عذراً، لم يتم العثور على هذا المكان');
  }
});

console.log('تم تشغيل البوت! ✅');
