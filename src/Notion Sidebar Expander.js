// ==UserScript==
// @name        Notion Sidebar Expander
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/notion_sidebar_expander
// @include     *notion.so*
// @exclude     none
// @version     1.0.5
// @description:en	Reveals the current page in the sidebar
// @grant    		none
// @description Reveals the current page in the sidebar
// @license MIT
// ==/UserScript==

const MAIN_TREE_NAMES_TO_IGNORE = ['Favorites'];

const DELAY_BEFORE_SIDEBAR_SCROLL = 2500;

const pause = (duration) =>
  new Promise((res) => setTimeout(() => res(), duration));

const waitFor = async (getterFunction, options = {}, numberOfTries = 0) => {
  const { wait = 200, maxRetries = 150 } = options;
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
    const items = [...topBarNavList.children].slice(1, 100);
    if (!items.length) {
      return { conditionMet: false };
    }
    return { conditionMet: true, output: items };
  });
  return topBarItems;
};

const isInMainTree = (element) => {
  const parentElement = element.parentElement;

  if (!parentElement) {
    return false;
  }

  if (
    parentElement.classList.contains('notion-outliner-team-header-container')
  ) {
    if (
      MAIN_TREE_NAMES_TO_IGNORE.includes(parentElement.children?.[0]?.innerText)
    ) {
      return false;
    } else {
      return true;
    }
  }

  return isInMainTree(parentElement);
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
      ...overlayContainer.getElementsByClassName('notion-selectable'),
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
  await waitFor(
    () => {
      const sideBarElements = [
        ...sideBarElement.getElementsByClassName('notion-selectable'),
      ];
      const matches = sideBarElements.filter(
        (element) => element.innerText === identifier,
      );

      return matches.length
        ? { conditionMet: true, output: matches }
        : { conditionMet: false };
    },
    { wait: 200, maxRetries: 20 },
  );
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
  const expansionStartTime = Date.now();
  let lastMatch = null;
  for (let pathIndex = 0; pathIndex < pagePath.length; pathIndex++) {
    const pathItem = pagePath[pathIndex];
    const matchingSidebarElements = await getSidebarElements(
      sideBarElement,
      pathItem,
    );
    if (matchingSidebarElements) {
      matchingSidebarElements.forEach((matchingSidebarElement) => {
        const toggleButton =
          matchingSidebarElement.children[0].children[0].children[0]
            .children[0];
        const svg = toggleButton.children[0];
        if (svg.style.transform === 'rotateZ(-90deg)') {
          toggleButton.click();
        }
      });
      lastMatch = matchingSidebarElements[matchingSidebarElements.length - 1];
    }
  }
  const expansionEndTime = Date.now();
  // Hack to ensure entire page is fully formed and tree is fully visible before we scroll
  const timeElapsed = expansionEndTime - expansionStartTime;
  if (timeElapsed < DELAY_BEFORE_SIDEBAR_SCROLL) {
    await pause(DELAY_BEFORE_SIDEBAR_SCROLL - timeElapsed);
  }
  lastMatch?.scrollIntoView({
    block: 'center',
    behavior: 'smooth',
  });
}

try {
  checkAndExpand();
} catch (e) {
  console.log(`Notion Sidebar Expander ran into a bit of an issue:`, e);
}
