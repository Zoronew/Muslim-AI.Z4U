// العناوين والإعدادات
const apiBase = "https://zoro-api-zoro-bot-5b28aebf.koyeb.app/api/islam-ai2"; 
const fallbackApiBase = "https://zoro-foryou.vercel.app/api/web-islamai";
const maxRetries = 3;  

const generateUserId = () => 'user-' + Math.random().toString(36).substr(2, 9);
const userId = generateUserId();

const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

// تهيئة الجلسة
const deleteConversation = async () => {
    try {
        const urls = [`${apiBase}/conversation/${userId}`, `${fallbackApiBase}/conversation/${userId}`];
        for (const url of urls) fetch(url, { method: "DELETE" }).catch(() => {}); 
    } catch (error) { console.error("Error resetting session:", error); }
};

// إرسال الرسالة ومعالجة الـ Think و الـ Result
const sendMessage = async () => {
    const message = messageInput.value.trim();
    if (!message) return;

    appendMessage("YOU", message, "user");
    messageInput.value = "";
    const loadingMessage = appendLoadingMessage();

    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
        attempt++;
        try {
            let response = await fetch(`${apiBase}?userId=${userId}&q=${encodeURIComponent(message)}`);
            let data = await response.json();

            if (!response.ok || !data.status || !data.result) {
                response = await fetch(`${fallbackApiBase}?userId=${userId}&q=${encodeURIComponent(message)}`);
                data = await response.json();
            }

            if (data.status && data.result) {
                success = true;
                removeLoadingMessage(loadingMessage); // حذف كلمة Wait..

                // 1. عرض مربع التفكير إذا كان موجوداً
                if (data.think) {
                    appendThinkMessage("Muslim AI (Thinking...)", data.think);
                    // تأخير بسيط لإعطاء إيحاء بالتفكير قبل ظهور الإجابة النهائية
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // 2. عرض الإجابة النهائية
                appendMessage("Muslim AI", data.result, "ai");
            }
        } catch (error) { console.error("Connection error:", error); }

        if (!success && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    if (!success) {
        removeLoadingMessage(loadingMessage);
        appendMessage("Muslim AI", "عذراً، لم أستطع جلب الإجابة. حاول مجدداً.", "ai");
    }
    saveConversation();
};

// دالة مخصصة لعرض "التفكير" بشكل جمالي
const appendThinkMessage = (sender, content) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai think-container"; // كلاس جديد للتنسيق
    
    // تنسيق نص التفكير (إزالة العلامات الغريبة)
    const cleanedThink = content.replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-header" style="color: #888; font-style: italic;">${sender}</div>
        <div class="think-content" style="color: #666; border-left: 2px solid #ddd; padding-left: 10px; font-size: 0.9em; font-style: italic;">
            ${cleanedThink}
        </div>
    `;
    chatWindow.appendChild(messageDiv);
    scrollToBottom();
};

// إضافة الرسائل العادية
const appendMessage = (sender, content, role) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    const cleanedContent = content.replace(/###/g, '').replace(/\*\*/g, '').replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-header">${sender}</div>
        <div>${cleanedContent}</div>
    `;
    chatWindow.appendChild(messageDiv);
    scrollToBottom();
};

// دالة الانتظار
const appendLoadingMessage = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message ai loading-pulse";
    loadingDiv.innerHTML = `<div class="message-header">Muslim AI</div><div class="dots">جارٍ التفكير...</div>`;
    chatWindow.appendChild(loadingDiv);
    scrollToBottom();
    return loadingDiv;
};

const removeLoadingMessage = (loadingMessage) => { if (loadingMessage) loadingMessage.remove(); };
const scrollToBottom = () => chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
const saveConversation = () => localStorage.setItem(`conversation-${userId}`, chatWindow.innerHTML);

window.onload = async () => { await deleteConversation(); chatWindow.innerHTML = `<div class="message ai"><div class="message-header">Muslim AI</div>السلام عليكم، كيف أساعدك اليوم؟</div>`; };

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
