document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getReadableContent" },
        (readableContent: string) => {
          document.getElementById("sidePanelText")!.innerHTML = readableContent;
        }
      );
    } else {
      console.error("No active tab found");
    }
  });
});
