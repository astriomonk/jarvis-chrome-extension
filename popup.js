const apiKey = document.getElementById("apiKey");
const model = document.getElementById("model");
const voice = document.getElementById("voice");

function loadVoices() {

  const voices = speechSynthesis.getVoices();

  voice.innerHTML = "";

  voices
    .filter(v => /^en(-|_)/i.test(v.lang))
    .forEach(v => {

      const option = document.createElement("option");

      option.value = v.name;

      option.textContent =
        `${v.name} — ${v.lang}`;

      voice.appendChild(option);

    });
}

speechSynthesis.onvoiceschanged = loadVoices;

loadVoices();

chrome.storage.local.get(
  ["apiKey", "model", "voice"],
  (data) => {

    if (data.apiKey)
      apiKey.value = data.apiKey;

    if (data.model)
      model.value = data.model;

    if (data.voice)
      voice.value = data.voice;

  }
);

document
  .getElementById("save")
  .onclick = async () => {

    await chrome.storage.local.set({

      apiKey: apiKey.value.trim(),

      model: model.value,

      voice: voice.value

    });

    const button =
      document.getElementById("save");

    button.textContent = "SAVED ✓";

    setTimeout(() => {

      button.textContent =
        "SAVE SETTINGS";

    }, 1200);

  };
