// العناوين والإعدادات - API 2 (Koyeb) هو الخيار الأول
const apiBase = "https://zoro-api-zoro-bot-5b28aebf.koyeb.app/api/islam-ai2"; 
const fallbackApiBase = "https://zoro-foryou.vercel.app/api/web-islamai";
const maxRetries = 3;  

const generateUserId = () => 'user-' + Math.random().toString(36).substr(2, 9);
const userId = generateUserId();

const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

/** * 1. الجزء الخاص بالتحكم في حجم الحقل تلقائياً (تعديل احترافي)
 */
messageInput.addEventListener("input", function() {
    this.style.height = "auto"; // إعادة التعيين لحساب الارتفاع الصحيح
    this.style.height = (this.scrollHeight) + "px"; // التوسع بناءً على المحتوى
});

// تهيئة الجلسة وحذف محادثات السيرفر
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

    appendMessage("أنت", message, "user");
    
    // إعادة ضبط الحقل بعد الإرسال
    messageInput.value = "";
    messageInput.style.height = "auto"; 
    
    const loadingMessage = appendLoadingMessage();

    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
        attempt++;
        try {
            console.log(`محاولة جلب الرد... محاولة رقم ${attempt}`);
            
            let response = await fetch(`${apiBase}?userId=${userId}&q=${encodeURIComponent(message)}`);
            let data = await response.json();

            if (!response.ok || !data.status || !data.result) {
                console.log("السيرفر الأساسي لم يستجب، ننتقل للبديل...");
                response = await fetch(`${fallbackApiBase}?userId=${userId}&q=${encodeURIComponent(message)}`);
                data = await response.json();
            }

            if (data.status && data.result) {
                success = true;
                removeLoadingMessage(loadingMessage);

                if (data.think) {
                    appendThinkMessage("Muslim AI Thinking...", data.think);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                appendMessage("Muslim AI", data.result, "ai");
            }
        } catch (error) { 
            console.error("Connection error:", error); 
        }

        if (!success && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    if (!success) {
        removeLoadingMessage(loadingMessage);
        appendMessage("Muslim AI", "عذراً، الخادم لا يستجيب حالياً. يرجى المحاولة مرة أخرى.", "ai");
    }
    saveConversation();
};

// دالة عرض "التفكير" بتنسيق مميز
const appendThinkMessage = (sender, content) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai think-container";
    
    const cleanedThink = content.replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-header" style="color: #1a73e8; font-size: 0.85em;">
            <i class="fas fa-microchip"></i> ${sender}
        </div>
        <div class="think-content">
            ${cleanedThink}
        </div>
    `;
    chatWindow.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
};

// إضافة الرسائل العادية (User & AI)
const appendMessage = (sender, content, role) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    
    const cleanedContent = content
        .replace(/###/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-header"><b>${sender}</b></div>
        <div class="message-text">${cleanedContent}</div>
    `;
    chatWindow.appendChild(messageDiv);
    scrollToBottom();
    saveConversation();
};

// رسالة التحميل (Loading)
const appendLoadingMessage = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message ai loading-pulse";
    loadingDiv.innerHTML = `
        <div class="message-header">Muslim AI</div>
        <div class="dots">جاري البحث في المصادر الإسلامية...</div>
    `;
    chatWindow.appendChild(loadingDiv);
    scrollToBottom();
    return loadingDiv;
};

const removeLoadingMessage = (loadingMessage) => { if (loadingMessage) loadingMessage.remove(); };
const scrollToBottom = () => chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
const saveConversation = () => localStorage.setItem(`conversation-${userId}`, chatWindow.innerHTML);

// عند تحميل الصفحة
window.onload = async () => { 
    await deleteConversation(); 
    chatWindow.innerHTML = `
        <div class="message ai">

    <div class="message-header">Muslim AI</div>

    

    <details class="think-container">

        <summary class="think-header">مرحلة التفكير</summary>

        <div class="think-content">

            هنا الكلام الكثير الذي تريد إخفاءه...

        </div>

    </details>



    السلام عليكم ورحمة الله وبركاته، كيف يمكنني مساعدتك اليوم؟

</div>`; 
};

// أحداث الضغط
sendButton.addEventListener("click", sendMessage);

/** * 2. تعديل حدث Enter ليدعم الأسطر الجديدة (Shift + Enter)
 */
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // منع السطر الجديد عند الضغط على Enter فقط
        sendMessage();
    }
});
