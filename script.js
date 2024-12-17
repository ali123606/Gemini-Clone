const typingForm = document.querySelector(".typing-form");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const chatList = document.querySelector(".chat-list");
const typingInput = typingForm.querySelector(".typing-input");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let isResponseGenerating = false;
let userMessage = null;

// API configration
const API_KEY = "AIzaSyB-5ThFRkda8DbQSKDgyGvOZSsHXPo_3O4";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorage = () => {
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  const savedChats = localStorage.getItem("savedChats");

  // apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  document.body.classList.toggle("hide-header", savedChats); // hide the header once the chat start
  // Restore saved chats
  chatList.innerHTML = savedChats || "";
  chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
};

loadLocalStorage();

// create a new message element and return it;
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentwordIndex = 0;

  const typingInterval = setInterval(() => {
    // append each word to the text element with a space
    textElement.innerText +=
      (currentwordIndex === 0 ? "" : " ") + words[currentwordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    // if all words are displayed
    if (currentwordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML); // save chats to local storage
    }
    chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
  }, 75);
};

// fetch a response from the API based on user messgae
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); // get text element

  // send a post request to the API with the user's message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: {
          role: "user",
          parts: [{ text: userMessage }],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error.message);

    // get the api response text
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    ); // remove asterisks for bold text
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

// show loading animation while wating for the API response
const showLoadingAnimation = () => {
  const html = `
              <div class="message-content">
                <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
              </div>
              <span onclick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>`;

  chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
  // create ongoing element and add it to chat list
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);
  generateAPIResponse(incomingMessageDiv);
};

// copy message text to the clipboard
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done"; // show tick icon

  setTimeout(() => {
    copyIcon.innerText = "content_copy";
  }, 1000);
};

const handleOutgoingChat = () => {
  userMessage = typingInput.value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const html = `
              <div class="message-content">
                <img src="images/medium.webp" alt="user Image" class="avatar">
                <p class="text"></p>
              </div>`;

  // create ongoing element and add it to chat list

  // what does this mean
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset();
  chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
  document.body.classList.add("hide-header"); // hide the header once the chat start
  setTimeout(showLoadingAnimation, 500); //show loding animation after a delay
};

// set usermessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach((suggestions) => {
  suggestions.addEventListener("click", () => {
    userMessage = suggestions.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

//delete all chats from the local storage when the button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you wnat to delete all messages?")) {
    localStorage.removeItem("savedChats");
    loadLocalStorage();
  }
});

// Main function
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
