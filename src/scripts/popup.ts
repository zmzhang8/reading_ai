document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      setupAIButton(tab.id);

      chrome.tabs.sendMessage(
        tab.id,
        { action: "getSelectedContent" },
        (selectedContent: string) => {
          if (selectedContent) {
            (
              document.getElementById("lookup-input") as HTMLInputElement
            ).value = selectedContent;
          } else {
            (
              document.getElementById("lookup-input") as HTMLInputElement
            ).focus();
          }
        }
      );
    } else {
      (document.getElementById("lookup-input") as HTMLInputElement).focus();
    }
  });

  setupLookupButton();
});

function setupAIButton(tabId: number) {
  const aiButton = document.getElementById("ai-button") as HTMLButtonElement;
  aiButton.classList.add("active");
  aiButton.addEventListener("click", () => {
    chrome.sidePanel
      .setOptions({
        tabId: tabId,
        path: "sidepanel.html",
        enabled: true,
      })
      .then(() => {
        chrome.sidePanel.open({ tabId: tabId });
      });
    window.close();
  });
}

function setupLookupButton() {
  const lookupInput = document.getElementById(
    "lookup-input"
  ) as HTMLInputElement;
  const lookupButton = document.getElementById(
    "lookup-button"
  ) as HTMLButtonElement;

  lookupInput.addEventListener("input", () => {
    if (lookupInput.value.trim() !== "") {
      lookupButton.classList.add("active");
    } else {
      lookupButton.classList.remove("active");
    }
  });
}
