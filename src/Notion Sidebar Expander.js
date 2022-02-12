// ==UserScript==
// @name        Notion Sidebar Expander
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/notion_sidebar_expander
// @include     *notion.so*
// @exclude     none
// @version     1.0.1
// @description:en	Reveals the current page in the sidebar
// @grant    		none
// @description Reveals the current page in the sidebar
// @license MIT
// ==/UserScript==

const pause = (duration) =>
  new Promise((res) => setTimeout(() => res(), duration));

const waitFor = async (getterFunction, options = {}, numberOfTries = 0) => {
  const { wait = 200, maxRetries = 1000 } = options;
  const { conditionMet, output } = getterFunction();
  if (conditionMet) {
    return output;
  }
  if (numberOfTries > maxRetries) {
    return null;
  }
  await pause(wait);
  return await waitFor(getterFunction, options, numberOfTries + 1);
};

const getTopNavItems = async () => {
  const topBarItems = await waitFor(() => {
    const topBar = document.getElementsByClassName('notion-topbar')[0];
    if (!topBar) {
      return { conditionMet: false };
    }
    const items = [...topBar.getElementsByClassName('notion-focusable')];
    if (!items.length) {
      return { conditionMet: false };
    }
    return { conditionMet: true, output: items };
  });
  return topBarItems;
};

const getTopNavHiddenItems = async () => {
  return await waitFor(() => {
    const overlayContainer = document.getElementsByClassName(
      'notion-overlay-container',
    )[0];
    if (!overlayContainer) {
      return { conditionMet: false };
    }
    const items = [
      ...overlayContainer.getElementsByClassName('notion-focusable'),
    ];
    if (!items.length) {
      return { conditionMet: false };
    }
    return { conditionMet: true, output: items };
  });
};

const createPagePath = (integrateHiddenItems, items, hiddenItems) => {
  const part1 = integrateHiddenItems ? items.slice(0, 1) : items;
  const part3 = items.slice(3, 100);
  let path = [...part1, ...hiddenItems, ...part3].filter((s) => s.length > 3);
  if (path[path.length - 1] === 'Share') {
    path = path.slice(0, path.length - 1);
  }
  return path;
};

async function checkAndExpand() {
  const topNavItems = await getTopNavItems();
  let topNavHiddenItems = [];

  const epsilonElement = topNavItems.filter(
    (item) => item.innerText === '...',
  )[0];
  if (epsilonElement) {
    epsilonElement.click();
    topNavHiddenItems = await getTopNavHiddenItems();
    document
      .getElementsByClassName('notion-overlay-container')[0]
      .children[1].children[0].children[0].click();
  }

  const pagePath = createPagePath(
    !!epsilonElement,
    topNavItems.map((x) => x.innerText),
    topNavHiddenItems.map((x) => x.innerText),
  );
  console.log(`Notion Sidebar Expander is expanding path`, pagePath);

  const sideBarElement = await waitFor(() => {
    const sidebar = document.getElementsByClassName('notion-sidebar')[0];
    return sidebar
      ? { conditionMet: true, output: sidebar }
      : { conditionMet: false };
  });
  for (let pathIndex = 0; pathIndex < pagePath.length; pathIndex++) {
    const pathItem = pagePath[pathIndex];
    const matchingSidebarElement = await waitFor(() => {
      const sideBarElements = [
        ...sideBarElement.getElementsByClassName('notion-focusable'),
      ];
      const match = sideBarElements.filter(
        (element) => element.innerText === pathItem,
      )[0];
      return match
        ? { conditionMet: true, output: match }
        : { conditionMet: false };
    });
    if (pathIndex === pagePath.length - 1) {
      // Hack to prevent entire page moving before tree is fully formed:
      setTimeout(() => {
        matchingSidebarElement.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }, 2000);
    } else {
      const toggleButton =
        matchingSidebarElement.children[0].children[0].children[0];
      const svg = toggleButton.children[0];
      if (svg.style.transform === 'rotateZ(90deg)') {
        toggleButton.click();
      }
    }
  }
}

checkAndExpand();
