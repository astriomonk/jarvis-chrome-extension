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

    if (message.type === "OPEN_URL") {
      let url = message.url;

      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      chrome.tabs.create({ url });

      sendResponse({ ok: true });
    }

    return true;
  }
);
