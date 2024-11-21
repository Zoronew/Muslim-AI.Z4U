const apiBase = "https://zoro-foryou.vercel.app/api/web-islamai";
const fallbackApiBase = "https://zoro-api-zoro-bot-5b28aebf.koyeb.app/api/islam-ai2"; 
const maxRetries = 3;  


const generateUserId = () => {
    return 'user-' + Math.random().toString(36).substr(2, 9);
};


const userId = generateUserId();


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
         السلام عليكم كيف يمكنني مساعدتك اليوم في مجال الاسئله الاسلامية ؟
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

    let attempt = 0;
    let response = null;
    let data = null;
    let success = false;

    
    while (attempt < maxRetries && !success) {
        attempt++;
        try {
            
            response = await fetch(`${apiBase}?userId=${userId}&q=${encodeURIComponent(message)}`);
            data = await response.json();

           
            if (response.status === 504 || !data.status || !data.result) {
                console.log(`المساعد الأول لم يرد أو حدث Timeout، المحاولة ${attempt} من ${maxRetries}...`);
                response = await fetch(`${fallbackApiBase}?userId=${userId}&q=${encodeURIComponent(message)}`);
                data = await response.json();
            }

            
            if (data.status && data.result) {
                success = true;
                appendMessage("Muslim AI", data.result, "ai");
            } else {
                console.log("لم يتم تلقي رد صالح، إعادة المحاولة...");
            }
        } catch (error) {
            console.error("خطأ في إرسال الرسالة:", error);
            console.log(`إعادة المحاولة ${attempt} من ${maxRetries}...`);
        }

        
        if (!success && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    
    if (!success) {
        appendMessage("Muslim AI", "اسف لم استطع الحصول علي جواب لسؤالك هل استطيع مساعدتك في سؤال اخر ؟", "ai");
    }

    removeLoadingMessage(loadingMessage);
    scrollToBottom();
    saveConversation();
};


const appendMessage = (sender, content, role) => {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  
  const cleanedContent = content.replace(/###/g, '').replace(/\*\*/g, '').replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
      <div class="message-header">${sender}</div>
      <div>${cleanedContent.replace(/\n/g, '<br>')}</div> <!-- الحفاظ على الأسطر الجديدة -->
  `;
  chatWindow.appendChild(messageDiv);
  scrollToBottom();
  saveConversation();
};


const appendLoadingMessage = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message ai";
    loadingDiv.innerHTML = `
        <div class="message-header">Muslim AI</div>
        جارٍ الإرسال...
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
