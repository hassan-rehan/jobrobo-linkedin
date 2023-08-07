const getCurrentTabUrl = () => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        const currentUrl = currentTab.url;
        resolve(currentUrl);
      }
    });
  });
};

const getCurrentTabId = () => {
  return new Promise((res) => {
    const queryOptions = { active: true, currentWindow: true };
    chrome.tabs.query(queryOptions, (tabsArr) => {
      const activeTabId = tabsArr[0].id;
      res(activeTabId);
    });
  });
};

changeTabUrl = (message) => {
  chrome.runtime.sendMessage(message);
};

startScraper = async (message) => {
  const tabId = await getCurrentTabId();
  chrome.tabs.sendMessage(tabId, message);
};

document.addEventListener('DOMContentLoaded', function () {
  const countInput = document.getElementById('following-count');
  const startScrperBtn = document.getElementById('start-scraper');
  const linkedinFollowingURL = 'https://www.linkedin.com/mynetwork/network-manager/people-follow/following/';

  startScrperBtn.addEventListener('click', async () => {
    if (countInput.value) {
      const currentTabUrl = await getCurrentTabUrl();
      if (currentTabUrl === linkedinFollowingURL) {
        startScraper({ type: 'start-scraper', count: countInput.value });
      } else {
        changeTabUrl({ type: 'change-tab-url', url: linkedinFollowingURL, count: countInput.value });
      }
    } else {
      alert('Please provide following people count.');
    }
  });
});
