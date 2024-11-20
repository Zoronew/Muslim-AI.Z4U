const apiBase = "https://zoro-foryou.vercel.app/api/web-islamai";


const generateUserId = () => {
    return 'user-' + Math.random().toString(36).substr(2, 9);
};


let userId = localStorage.getItem("userId");
if (!userId) {
    userId = generateUserId();
    localStorage.setItem("userId", userId);
}


const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");


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


const loadConversation = () => {
    chatWindow.innerHTML = `
        <div class="message ai">
            <div class="message-header">Muslim AI</div>
            السلام عليكم كيف يمكنني مساعدتك اليوم في الاسئله الاسلاميه ؟
        </div>`;
    scrollToBottom();
};


const saveConversation = () => {
    const conversationKey = `conversation-${userId}`;
    localStorage.setItem(conversationKey, chatWindow.innerHTML);
};


const sendMessage = async () => {
    const message = messageInput.value.trim();
    if (!message) return;

   
    appendMessage("YOU", message, "user");

  
    messageInput.value = "";

    
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


const removeLoadingMessage = (loadingMessage) => {
    if (loadingMessage) loadingMessage.remove();
};


const scrollToBottom = () => {
    chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: "smooth"
    });
};


window.onload = async () => {
    await deleteConversation(); 
    loadConversation();
};


sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});
