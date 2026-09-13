chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-jarvis") {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "TOGGLE_JARVIS" }
          ).catch(() => {});
        }
      }
    );
  }
});


chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    /*
      Open website
    */

    if (message.type === "OPEN_URL") {

      let url = message.url;

      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      chrome.tabs.create({ url });

      sendResponse({ ok: true });

      return true;
    }


    /*
      Fish Audio TTS

      The request happens here instead of inside
      YouTube/Google/etc., which avoids webpage CORS.
    */

    if (message.type === "FISH_TTS") {

      (async () => {

        try {

          const response = await fetch(
            "https://api.fish.audio/v1/tts",
            {
              method: "POST",

              headers: {
                "Authorization":
                  `Bearer ${message.apiKey}`,

                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({

                text: message.text,

                reference_id:
                  message.voiceId,

                format: "mp3",

                mp3_bitrate: 128,

                latency: "normal"

              })
            }
          );


          if (!response.ok) {

            const errorText =
              await response.text();

            throw new Error(
              `Fish Audio ${response.status}: ${errorText}`
            );
          }


          const audioBuffer =
            await response.arrayBuffer();


          const bytes =
            new Uint8Array(audioBuffer);


          let binary = "";

          const chunkSize = 8192;


          for (
            let i = 0;
            i < bytes.length;
            i += chunkSize
          ) {

            binary += String.fromCharCode(
              ...bytes.subarray(
                i,
                Math.min(
                  i + chunkSize,
                  bytes.length
                )
              )
            );

          }


          const audioBase64 =
            btoa(binary);


          sendResponse({
            ok: true,
            audioBase64
          });


        } catch (error) {

          console.error(
            "Fish Audio error:",
            error
          );


          sendResponse({
            ok: false,
            error: error.message
          });

        }

      })();


      return true;
    }

  }
);
