(() => {
  if (window.__JARVIS_LOADED__) return;
  window.__JARVIS_LOADED__ = true;

  const root = document.createElement("div");
  root.id = "jarvis-root";

  root.innerHTML = `
    <div class="jarvis-shell">

      <div class="jarvis-head">
        <div>
          <div class="jarvis-title">JARVIS</div>
          <div class="jarvis-subtitle">PERSONAL AI SYSTEM</div>
        </div>

        <div id="jarvis-status">STANDBY</div>
      </div>

      <div class="jarvis-body">

        <div class="jarvis-orb">
          <div class="orb-core"></div>
        </div>

        <div
          class="jarvis-messages"
          id="jarvis-messages">
        </div>

        <div class="jarvis-input-row">

          <input
            id="jarvis-input"
            placeholder="Ask JARVIS..."
            autocomplete="off"
          >

          <button
            class="jarvis-btn"
            id="jarvis-mic"
            title="Voice input">
            🎙
          </button>

          <button
            class="jarvis-btn"
            id="jarvis-send">
            ➤
          </button>

        </div>

        <div class="jarvis-footer">
          ALT + J &nbsp; • &nbsp; VOICE ENABLED
        </div>

      </div>

    </div>
  `;

  document.documentElement.appendChild(root);

  const messages =
    root.querySelector("#jarvis-messages");

  const input =
    root.querySelector("#jarvis-input");

  const status =
    root.querySelector("#jarvis-status");

  function escapeHTML(text) {
    return String(text).replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char])
    );
  }

  function addMessage(who, text) {

    const message =
      document.createElement("div");

    message.className = "jarvis-msg";

    message.innerHTML = `
      <div class="msg-name">
        ${escapeHTML(who)}
      </div>

      <div class="msg-text">
        ${escapeHTML(text)}
      </div>
    `;

    messages.appendChild(message);

    messages.scrollTop =
      messages.scrollHeight;
  }

  function speak(text) {

    chrome.storage.local.get(
      ["voice"],
      data => {

        const utterance =
          new SpeechSynthesisUtterance(text);

        /*
          Slightly lower pitch and slower
          speed for a futuristic assistant feel.
        */

        utterance.rate = 0.92;
        utterance.pitch = 0.82;
        utterance.volume = 1;

        const voices =
          speechSynthesis.getVoices();

        const selected =
          voices.find(
            voice => voice.name === data.voice
          );

        if (selected) {
          utterance.voice = selected;
        } else {

          const british =
            voices.find(
              voice =>
                /^en-GB/i.test(voice.lang)
            );

          if (british)
            utterance.voice = british;
        }

        speechSynthesis.cancel();

        speechSynthesis.speak(utterance);
      }
    );
  }

  function toggleJarvis() {

    root.classList.toggle("open");

    if (root.classList.contains("open")) {

      input.focus();

      if (!messages.children.length) {

        const greeting =
          "Good evening. All systems are online. How may I assist you?";

        addMessage("JARVIS", greeting);

        speak(greeting);
      }
    }
  }

  function openWebsite(target) {

    const websites = {

      youtube:
        "https://www.youtube.com",

      google:
        "https://www.google.com",

      gmail:
        "https://mail.google.com",

      github:
        "https://github.com",

      reddit:
        "https://www.reddit.com",

      wikipedia:
        "https://www.wikipedia.org",

      chatgpt:
        "https://chatgpt.com",

      amazon:
        "https://www.amazon.com",

      netflix:
        "https://www.netflix.com",

      spotify:
        "https://open.spotify.com"
    };

    const clean =
      target
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(".com", "");

    let url =
      websites[clean];

    if (!url) {

      url = target;

      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }
    }

    chrome.runtime.sendMessage({
      type: "OPEN_URL",
      url
    });
  }

  async function askJarvis(text) {

    text = text.trim();

    if (!text)
      return;

    addMessage("YOU", text);

    input.value = "";

    status.textContent =
      "PROCESSING";

    /*
      Website commands.
    */

    const openCommand =
      text.match(
        /^open\s+(.+)$/i
      );

    if (openCommand) {

      const target =
        openCommand[1].trim();

      openWebsite(target);

      const reply =
        `Certainly. Opening ${target}.`;

      addMessage("JARVIS", reply);

      speak(reply);

      status.textContent =
        "STANDBY";

      return;
    }

    /*
      Need API key for AI requests.
    */

    const settings =
      await chrome.storage.local.get([
        "apiKey",
        "model"
      ]);

    if (!settings.apiKey) {

      const reply =
        "My AI systems require an OpenAI API key. Please open the JARVIS extension settings and add your key.";

      addMessage("JARVIS", reply);

      speak(reply);

      status.textContent =
        "SETUP REQUIRED";

      return;
    }

    try {

      const response =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${settings.apiKey}`
            },

            body: JSON.stringify({

              model:
                settings.model ||
                "gpt-5.6-luna",

              instructions: `
You are JARVIS, a sophisticated futuristic
personal AI assistant.

Your personality:
- calm
- intelligent
- concise
- professional
- slightly witty
- sophisticated
- helpful

Speak like an advanced British-style AI assistant.

Do not claim to literally be the fictional
Iron Man character.

Do not claim to reproduce an actor's voice.

The user may ask you questions about the
website they are currently viewing.

If the user asks you to open a website,
explain that they can say:
"open YouTube"
or
"open Google".
`,

              input: text
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data?.error?.message ||
          "AI request failed."
        );
      }

      const reply =
        data.output_text ||
        "I'm afraid I don't have a response for that.";

      addMessage(
        "JARVIS",
        reply
      );

      speak(reply);

      status.textContent =
        "STANDBY";

    } catch (error) {

      const reply =
        `I'm afraid I've encountered an error: ${error.message}`;

      addMessage(
        "JARVIS",
        reply
      );

      speak(reply);

      status.textContent =
        "ERROR";
    }
  }

  /*
    Send button.
  */

  root
    .querySelector("#jarvis-send")
    .addEventListener(
      "click",
      () => askJarvis(input.value)
    );

  /*
    Enter key.
  */

  input.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        askJarvis(input.value);
      }
    }
  );

  /*
    Microphone.
  */

  root
    .querySelector("#jarvis-mic")
    .addEventListener(
      "click",
      () => {

        const Recognition =
          window.SpeechRecognition ||
          window.webkitSpeechRecognition;

        if (!Recognition) {

          const message =
            "Voice recognition isn't supported by this browser.";

          addMessage(
            "JARVIS",
            message
          );

          speak(message);

          return;
        }

        const recognition =
          new Recognition();

        recognition.lang =
          "en-US";

        recognition.interimResults =
          false;

        recognition.onstart =
          () => {

            status.textContent =
              "LISTENING";
          };

        recognition.onresult =
          event => {

            const transcript =
              event
                .results[0][0]
                .transcript;

            input.value =
              transcript;

            askJarvis(
              transcript
            );
          };

        recognition.onerror =
          () => {

            status.textContent =
              "STANDBY";
          };

        recognition.onend =
          () => {

            if (
              status.textContent ===
              "LISTENING"
            ) {

              status.textContent =
                "STANDBY";
            }
          };

        recognition.start();
      }
    );

  /*
    Alt + J support.
  */

  chrome.runtime.onMessage.addListener(
    message => {

      if (
        message.type ===
        "TOGGLE_JARVIS"
      ) {

        toggleJarvis();
      }
    }
  );

  /*
    Small JARVIS launcher.
  */

  const launcher =
    document.createElement("button");

  launcher.id =
    "jarvis-launcher";

  launcher.textContent =
    "J";

  launcher.title =
    "Open JARVIS";

  launcher.addEventListener(
    "click",
    toggleJarvis
  );

  document.documentElement
    .appendChild(launcher);

})();
