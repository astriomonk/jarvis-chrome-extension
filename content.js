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
