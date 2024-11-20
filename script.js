const apiBase = "https://zoro-foryou.vercel.app/api/web-islamai";

// إنشاء معرف عشوائي فريد لكل مستخدم
const generateUserId = () => {
    return 'user-' + Math.random().toString(36).substr(2, 9);
};

// الحصول على معرف المستخدم الحالي أو إنشاء جديد
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = generateUserId();
    localStorage.setItem("userId", userId);
}

// العناصر في الصفحة
const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

// دالة حذف المحادثة باستخدام API
const deleteConversation = async () => {
    try {
        const deleteUrl = `${apiBase}/conversation/${userId}`;
        const response = await fetch(deleteUrl, { method: "DELETE" });

        if (response.ok) {
            console.log("تم حذف المحادثة بنجاح من الخادم.");
        } else {
            console.error("فشل حذف المحادثة:", response.status);
        }
    } catch (error) {
        console.error("خطأ أثناء محاولة حذف المحادثة:", error);
    }
};

// تحميل المحادثة الخاصة بالمستخدم الحالي
const loadConversation = () => {
    chatWindow.innerHTML = `
        <div class="message ai">
            <div class="message-header">Muslim AI</div>
            السلام عليكم كيف يمكنني مساعدتك اليوم في الاسئله الاسلاميه ؟
        </div>`;
    scrollToBottom();
};

// حفظ المحادثة في LocalStorage
const saveConversation = () => {
    const conversationKey = `conversation-${userId}`;
    localStorage.setItem(conversationKey, chatWindow.innerHTML);
};

// إرسال رسالة جديدة
const sendMessage = async () => {
    const message = messageInput.value.trim();
    if (!message) return;

    // إضافة رسالة المستخدم إلى واجهة الدردشة
    appendMessage("YOU", message, "user");

    // مسح حقل الإدخال بعد الإرسال
    messageInput.value = "";

    // عرض رسالة انتظار
    const loadingMessage = appendLoadingMessage();

    try {
        const response = await fetch(`${apiBase}?userId=${userId}&q=${encodeURIComponent(message)}`);
        const data = await response.json();

        removeLoadingMessage(loadingMessage);

        if (data.status && data.result) {
            appendMessage("Muslim AI", data.result, "ai");
        } else {
            appendMessage("Muslim AI", "لم يتم تلقي رد من المساعد. حاول مرة أخرى.", "ai");
        }
    } catch (error) {
        console.error("Error sending message:", error);
        removeLoadingMessage(loadingMessage);
        appendMessage("Muslim AI", "حدث خطأ أثناء معالجة الطلب. حاول مرة أخرى.", "ai");
    }

    scrollToBottom();
    saveConversation();
};

// إضافة رسالة جديدة إلى واجهة الدردشة
const appendMessage = (sender, content, role) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `
        <div class="message-header">${sender}</div>
        <div>${content}</div>
    `;
    chatWindow.appendChild(messageDiv);
    saveConversation();
};

// رسالة انتظار مؤقتة
const appendLoadingMessage = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message ai";
    loadingDiv.innerHTML = `
        <div class="message-header">Muslim AI</div>
        Wait...
    `;
    chatWindow.appendChild(loadingDiv);
    scrollToBottom();
    return loadingDiv;
};

// إزالة رسالة الانتظار
const removeLoadingMessage = (loadingMessage) => {
    if (loadingMessage) loadingMessage.remove();
};

// التمرير إلى آخر الرسائل
const scrollToBottom = () => {
    chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: "smooth"
    });
};

// تحميل المحادثة عند فتح الصفحة مع حذف المحادثة السابقة من الخادم
window.onload = async () => {
    await deleteConversation(); // حذف المحادثة السابقة من الخادم
    loadConversation(); // تحميل محادثة جديدة
};

// إضافة أحداث الأزرار
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});
