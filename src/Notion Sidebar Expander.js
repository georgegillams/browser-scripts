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
    const topBarFirstChild = topBar.children[0];
    if (!topBarFirstChild) {
      return { conditionMet: false };
    }
    const topBarNavList = topBarFirstChild.children[0];
    if (!topBarNavList) {
      return { conditionMet: false };
    }
    const items = [...topBarNavList.getElementsByClassName('notion-focusable')];
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

const plainText = (text) => text.replaceAll(/[^a-zA-Z ]/g, '');

const createPagePath = (integrateHiddenItems, items, hiddenItems) => {
  let result = items;
  if (integrateHiddenItems) {
    const part1 = items.slice(0, 1);
    const part3 = items.slice(2, 100);
    result = [...part1, ...hiddenItems, ...part3];
  }
  result = result.filter((s) => plainText(s).length > 0);
  return result;
};

const getSidebarElements = async (sideBarElement, identifier) =>
  await waitFor(() => {
    const sideBarElements = [
      ...sideBarElement.getElementsByClassName('notion-focusable'),
    ];
    const matches = sideBarElements.filter(
      (element) => element.innerText === identifier,
    );
    return matches.length
      ? { conditionMet: true, output: matches }
      : { conditionMet: false };
  });
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
  for (let pathIndex = 0; pathIndex < pagePath.length - 1; pathIndex++) {
    const pathItem = pagePath[pathIndex];
    const matchingSidebarElements = await getSidebarElements(
      sideBarElement,
      pathItem,
    );
    matchingSidebarElements.forEach((matchingSidebarElement) => {
      const toggleButton =
        matchingSidebarElement.children[0].children[0].children[0];
      const svg = toggleButton.children[0];
      if (svg.style.transform === 'rotateZ(90deg)') {
        toggleButton.click();
      }
    });
  }
  // Hack to ensure entire page is fully formed and tree is fully visible before we scroll
  await pause(2000);
  const matchingSidebarElements = await getSidebarElements(
    sideBarElement,
    pagePath[pagePath.length - 1],
  );
  const lastMatch = matchingSidebarElements[matchingSidebarElements.length - 1];
  lastMatch.scrollIntoView({
    block: 'center',
    behavior: 'smooth',
  });
}

checkAndExpand();
