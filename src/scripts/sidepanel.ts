document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getReadableContent" },
        (readableContent: string) => {
          (document.getElementById("readingMode") as HTMLDivElement).innerHTML =
            readableContent;

          chrome.runtime.sendMessage(
            { action: "getAIQuery" },
            (query: string) => {
              (
                document.getElementById("aiQuery") as HTMLDivElement
              ).textContent = query;
            }
          );
        }
      );
    } else {
      console.error("No active tab found");
    }
  });
});
