chrome.runtime.onUpdateAvailable.addListener(function (details) {
  console.log('Update available: ' + details.version);
  chrome.runtime.reload();
});

const getCurrentTabId = () => {
  return new Promise((res) => {
    const queryOptions = { active: true, currentWindow: true };
    chrome.tabs.query(queryOptions, (tabsArr) => {
      const activeTabId = tabsArr[0].id;
      res(activeTabId);
    });
  });
};

// Message listener to receive requests from the popup.js
chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  if (message.type === 'change-tab-url' && message.url && message.count) {
    const newUrl = message.url;
    const activeTabId = await getCurrentTabId();
    chrome.tabs.update(activeTabId, { url: newUrl });

    chrome.tabs.onUpdated.addListener(function onUpdatedListener(tabId, changeInfo) {
      if (tabId === activeTabId && changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { type: 'start-scraper', count: message.count });
        chrome.tabs.onUpdated.removeListener(onUpdatedListener);
      }
    });
  }
});
