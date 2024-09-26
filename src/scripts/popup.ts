document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      document
        .getElementById("openSidePanelBtn")
        ?.addEventListener("click", () => {
          openSidePanel(tab.id!);
          window.close();
        });

      chrome.tabs.sendMessage(
        tab.id,
        { action: "getSelectedContent" },
        (selectedContent: string) => {
          document.getElementById("popupText")!.textContent = selectedContent;
        }
      );
    } else {
      console.error("No active tab found");
    }
  });
});

async function openSidePanel(tabId: number) {
  await chrome.sidePanel.setOptions({
    tabId: tabId,
    path: "sidepanel.html",
    enabled: true,
  });
  await chrome.sidePanel.open({ tabId: tabId });
}
