document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getReadableContent" }, (response) => {
        if (response) {
          if (response.selected) {
            document.getElementById("showText")!.textContent = response.content;
          } else {
            if (response.content) {
              document.getElementById("showText")!.innerHTML = response.content;

            } else {
              document.getElementById("showText")!.textContent = "Unable to parse content";
            }
          }
        }
      });
    } else {
      console.error("No active tab found");
    }
  });
});
