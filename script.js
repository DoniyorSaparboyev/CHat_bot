const chatBody = document.querySelector(".chatbot-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// API setup
const API_KEY = "AIzaSyChx4hgus_LuivzOCSsFS1Rrbhdbl0wQQY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
  messsage: null,
  file: {
    data: null,
    mime_type: null
  }
};

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    
    // Add user message to chat history
    chatHistory.push({
      role: "user",
      parts:[{ text: userData.messsage }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    }); 

    // API request options
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    };
     
    try {
        // Fetch bot response from API
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if (!response.ok) throw new Error( data.error.messsage);

        // Extract and display bot's response text
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim(); 
        messageElement.innerHTML = apiResponseText;

        // Add bot response to chat history
        chatHistory.push({
          role: "model",
          parts:[{ text: apiResponseText }]
        });

        // console.log(data);
    } 
    catch (error) {
        // Handle error in API response
        console.log(error);
        messageElement.innerHTML = error.messsage;
        messageElement.style.color = "#ff0000";
    } 
    finally {
        // RESET user's file data, removing thinking indicator and scroll chat to bottom
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
};

// handle outgoing user message
const handleOutGoingMessage = (e) => {
  e.preventDefault();
  userData.messsage = messageInput.value.trim();
  messageInput.value = "";
  fileUploadWrapper.classList.remove("file-uploaded");
  messageInput.dispatchEvent(new Event("input"));

  // create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;
  const outgoingMessageDiv = createMessageElement(messageContent,"user-message");
  outgoingMessageDiv.querySelector(".message-text").textContent =
    userData.messsage;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<img class="bot-avatar" src="./logo.jpg" alt="logo" width="50" height="50">
                                <div class="message-text">
                                    <div class="thinking-indicator">
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                    </div>
                                </div>`;
    const incomingMessageDiv = createMessageElement(
      messageContent,
      "bot-message",
      "thinking"
    );
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key == "Enter" && userMessage && !e.shiftKey && window.innerWidth > 768) {
    handleOutGoingMessage(e);
    // console.log(userMessage);
  }
});

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];

    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type
    }
    
    fileInput.value = "";

    // console.log(userData);
  };

  reader.readAsDataURL(file);
  
  // console.log(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker and handle selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if(e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    }
    else {
      document.body.classList.remove("show-emoji-picker");
    }
  }
});

document.querySelector(".chat-form").appendChild(picker);

sendMessageButton.addEventListener("click", (e) => handleOutGoingMessage(e));

document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot")); 

closeChatbot.addEventListener("click", () =>  document.body.classList.remove("show-chatbot"));
