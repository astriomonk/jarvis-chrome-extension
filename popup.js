const apiKey = document.getElementById("apiKey");
const model = document.getElementById("model");

const fishApiKey =
  document.getElementById("fishApiKey");

const fishVoiceId =
  document.getElementById("fishVoiceId");


chrome.storage.local.get(
  [
    "apiKey",
    "model",
    "fishApiKey",
    "fishVoiceId"
  ],
  (data) => {

    if (data.apiKey)
      apiKey.value = data.apiKey;

    if (data.model)
      model.value = data.model;

    if (data.fishApiKey)
      fishApiKey.value = data.fishApiKey;

    if (data.fishVoiceId)
      fishVoiceId.value = data.fishVoiceId;

  }
);


document
  .getElementById("save")
  .onclick = async () => {

    await chrome.storage.local.set({

      apiKey:
        apiKey.value.trim(),

      model:
        model.value,

      fishApiKey:
        fishApiKey.value.trim(),

      fishVoiceId:
        fishVoiceId.value.trim()

    });


    const button =
      document.getElementById("save");

    button.textContent =
      "SAVED ✓";


    setTimeout(() => {

      button.textContent =
        "SAVE SETTINGS";

    }, 1200);

  };
