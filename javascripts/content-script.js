let dataString = '';
const selector = {
  'talk-about': '.pv-text-details__left-panel:not(.mt2) div.text-body-medium span:nth-child(1)',
  location: 'pv-text-details__left-panel.mt2 span.text-body-small',
  'followers-count': 'ul.pv-top-card--list .text-body-small span.t-blod',
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'start-scraper') {
    startScrapingFollowings(message.count);
    dataString = 'PROFILE LINK,NAME,HEADLINE,TALK ABOUT,LOCATION,FOLLOWERS COUNT\n';
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const scrapeFollowingElements = async (count) => {
  return new Promise((resolve) => {
    let followingList = [];
    while (true) {
      followingList = document.querySelectorAll(
        'ul.reusable-search__entity-result-list li.reusable-search__result-container .entity-result .entity-result__item .entity-result__content'
      );
      if (followingList.length < count) {
        const loaderBtn = document.querySelector('.scaffold-finite-scroll__load-button .artdeco-button__text');
        if (loaderBtn) {
          loaderBtn.click();
          sleep(5000); // can change to check if loading finished
        } else {
          break;
        }
      } else {
        break;
      }
    }
    const followingListElements = [];
    if (followingList.length) {
      let i = 0;
      for (const element of followingList) {
        if (i < count) {
          followingListElements.push(element);
          i++;
        }
      }
    }
    resolve(followingListElements);
  });
};

const scrapeProfile = (htmlContent, link, name, headline) => {
  return new Promise((resolve) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const scrapedData = [link, name, headline];
    const tags = Object.values(selector);
    for (const tag of tags) {
      const value = doc.querySelector(tag)?.innerText || '';
      scrapedData.push(value);
    }
    dataString += scrapedData.map((item) => `"${item}"`).join(',') + '\n';
    resolve();
  });
};

const startDownload = () => {
  const blob = new Blob([dataString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'data.csv';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};

const startScrapingFollowings = async (count) => {
  const followingListElements = await scrapeFollowingElements(count);
  if (followingListElements.length) {
    const fetchPromises = followingListElements.map(async (element) => {
      try {
        const link = element.querySelector('.app-aware-link').getAttribute('href');
        const name = element.querySelector('.app-aware-link').innerText;
        const headline = element.querySelector('.entity-result__primary-subtitle').innerText;

        //const response = await fetch(link);
        //const htmlContent = await response.text();
        return await scrapeProfile(/*htmlContent*/ '', link, name, headline);
      } catch (error) {
        console.error('Error fetching page:', error);
        return { error }; // Returning an object with the error to handle it later
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    startDownload();
  } else {
    alert('Either no following found or something went wrong while scraping following profile urls.');
  }
};
