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
          ALT + J &nbsp; • &nbsp; JARVIS ONLINE
        </div>

      </div>

    </div>
  `;

  document.documentElement.appendChild(root);

  const messages = root.querySelector("#jarvis-messages");
  const input = root.querySelector("#jarvis-input");
  const status = root.querySelector("#jarvis-status");

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
    const message = document.createElement("div");

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
    messages.scrollTop = messages.scrollHeight;
  }

  /*
    JARVIS voice.

    Fish Audio will be connected in the next step.
    For now, browser speech remains as a fallback.
  */

  async function speak(text) {

  const settings =
    await chrome.storage.local.get([
      "fishApiKey",
      "fishVoiceId"
    ]);

  /*
    Try Fish Audio through the background
    service worker. This avoids webpage CORS.
  */

  if (
    settings.fishApiKey &&
    settings.fishVoiceId
  ) {

    try {

      status.textContent =
        "SPEAKING";

      const result =
        await new Promise((resolve) => {

          chrome.runtime.sendMessage(
            {
              type: "FISH_TTS",

              text: text,

              apiKey:
                settings.fishApiKey,

              voiceId:
                settings.fishVoiceId
            },

            resolve
          );

        });


      if (!result || !result.ok) {

        throw new Error(
          result?.error ||
          "Fish Audio request failed."
        );

      }


      /*
        Convert the returned Base64 MP3
        into playable audio.
      */

      const binary =
        atob(result.audioBase64);

      const bytes =
        new Uint8Array(
          binary.length
        );


      for (
        let i = 0;
        i < binary.length;
        i++
      ) {

        bytes[i] =
          binary.charCodeAt(i);

      }


      const audioBlob =
        new Blob(
          [bytes],
          { type: "audio/mpeg" }
        );


      const audioUrl =
        URL.createObjectURL(
          audioBlob
        );


      const audio =
        new Audio(audioUrl);


      audio.onended = () => {

        URL.revokeObjectURL(
          audioUrl
        );

        status.textContent =
          "STANDBY";

      };


      audio.onerror = () => {

        URL.revokeObjectURL(
          audioUrl
        );

        status.textContent =
          "STANDBY";

      };


      await audio.play();

      return;

    } catch (error) {

      console.warn(
        "Fish Audio failed:",
        error
      );

      status.textContent =
        "VOICE FALLBACK";

    }

  }


  /*
    Browser voice fallback.
  */

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.rate =
    0.92;

  utterance.pitch =
    0.82;

  utterance.volume =
    1;


  const voices =
    speechSynthesis.getVoices();


  const british =
    voices.find(
      voice =>
        /^en-GB/i.test(
          voice.lang
        )
    );


  if (british) {

    utterance.voice =
      british;

  }


  speechSynthesis.cancel();

  speechSynthesis.speak(
    utterance
  );


  utterance.onend = () => {

    status.textContent =
      "STANDBY";

  };

}

  async function askJarvis(text) {

    text = text.trim();

    if (!text) return;

    addMessage("YOU", text);

    input.value = "";

    status.textContent = "PROCESSING";

    /*
      Website commands.
    */

    const openCommand =
      text.match(/^open\s+(.+)$/i);

    if (openCommand) {

      const target =
        openCommand[1].trim();

      openWebsite(target);

      const reply =
        `Certainly. Opening ${target}.`;

      addMessage(
        "JARVIS",
        reply
      );

      speak(reply);

      return;
    }

    /*
      Load OpenAI settings.
    */

    const settings =
      await chrome.storage.local.get([
        "apiKey",
        "model"
      ]);

    if (!settings.apiKey) {

      const reply =
        "My AI systems require an OpenAI API key. Please open the JARVIS extension settings and add your key.";

      addMessage(
        "JARVIS",
        reply
      );

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

Personality:
- calm
- intelligent
- concise
- professional
- slightly witty
- sophisticated
- helpful

Speak like an advanced British-style AI assistant.

Do not claim to literally be Iron Man's fictional assistant.

Do not claim to reproduce an actor's voice.

The user may ask questions about the
website they are currently viewing.

If the user asks you to open a website,
they can say:
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
  data.output?.[0]?.content?.[0]?.text ||
  data.output?.[0]?.content?.[0]?.value ||
  "I received the request, but I couldn't read the AI response.";

      addMessage(
        "JARVIS",
        reply
      );

      await speak(reply);

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
              event.results[0][0]
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
    Alt + J.
  */

  chrome.runtime.onMessage.addListener(
    message => {

      if (
        message.type ===
        "TOGGLE_JARVIS"
      ) {
        function toggleJarvis() {

  root.classList.toggle("open");

  if (root.classList.contains("open")) {

    input.focus();

    if (!messages.children.length) {

      const greeting =
        "Good evening. All systems are online. How may I assist you?";

      addMessage(
        "JARVIS",
        greeting
      );

      speak(greeting);
    }
  }
}
      }
    }
  );

  /*
    JARVIS launcher.
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
