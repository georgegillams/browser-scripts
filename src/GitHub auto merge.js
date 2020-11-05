// ==UserScript==
// @name        GitHub auto merge
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/github_auto_merge
// @include     *github.com*
// @include     *github.skyscannertools.net*
// @exclude     none
// @version     28
// @description:en	Adds an option to GitHub PRs to auto-merge them. The tab must be kept open for the merge to be performed.
// @grant    		none
// @description	Adds an option to GitHub PRs to auto-merge them. The tab must be kept open for the merge to be performed.
// ==/UserScript==

let testCount = 0;

function getLocalStorageUrls() {
  const automergeUrlsString = window.localStorage.getItem('AUTOMERGE_URLS');
  const automergeUrls = automergeUrlsString
    ? JSON.parse(automergeUrlsString)
    : [];
  return automergeUrls;
}

function willAutoMerge() {
  const automergeUrls = getLocalStorageUrls();
  if (automergeUrls.includes(window.location.href)) {
    return true;
  }
  return false;
}

function requestNotificationPermissions() {
  if (!('Notification' in window) || Notification.permission === 'denied') {
    Notification.requestPermission();
  }
}

function createMergedNotification() {
  Notification.requestPermission();
  if ('Notification' in window && Notification.permission !== 'denied') {
    // eslint-disable-next-line no-unused-vars
    const not = new Notification('PR merged!', {
      body: `Your PR was merged automatically! ${window.location.href}`,
    });
  }
}

function createNotification() {
  const notificationElement = document.createElement('div');
  notificationElement.innerText = `THIS PR WILL BE AUTOMATICALLY MERGED.`;
  notificationElement.style.backgroundColor = '#0770E3';
  notificationElement.style.fontSize = '1.5rem';
  notificationElement.style.fontWeight = 'bold';
  notificationElement.style.padding = '0.375rem 1.5rem';
  notificationElement.style.display = 'flex';
  notificationElement.style.justifyContent = 'center';
  notificationElement.style.position = 'fixed';
  notificationElement.style.top = 0;
  notificationElement.style.left = 0;
  notificationElement.style.width = '100vw';
  notificationElement.style.color = 'white';
  notificationElement.style.zIndex = 500;
  notificationElement.id = 'auto_merge_notification';

  const bodyElement = document.getElementsByTagName('BODY')[0];
  bodyElement.appendChild(notificationElement);
}

function getNotification() {
  const addedNotification = document.getElementById('auto_merge_notification');
  return addedNotification;
}

function createNotificationIfNecessary() {
  if (willAutoMerge() && !getNotification()) {
    createNotification();
  }
}

function saveAutoMergeUrls(automergeUrls, retry = false) {
  try {
    window.localStorage.setItem(
      'AUTOMERGE_URLS',
      JSON.stringify(automergeUrls),
    );
  } catch (e) {
    if (retry) {
      // eslint-disable-next-line no-alert
      window.alert(
        'There was a problem writing to localStorage. Check that the quota has not been exceeded.',
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        'clearing jump_to:page_views from local storage and retrying...',
      );
      window.localStorage.setItem('jump_to:page_views', '');
      saveAutoMergeUrls(automergeUrls, true);
    }
  }
}

function createButton() {
  const mergeButton = document.createElement('button');
  mergeButton.innerText = `AUTO MERGE PR`;
  mergeButton.style.color = 'white';
  mergeButton.style.fontSize = '1.2rem';
  mergeButton.style.fontWeight = 'bold';
  mergeButton.style.padding = '0.375rem 1.125rem';
  mergeButton.id = 'auto_merge_button';
  mergeButton.style.border = 'none';
  mergeButton.style.backgroundColor = '#0770E3';
  mergeButton.style.borderRadius = '0.5rem';
  // eslint-disable-next-line
  mergeButton.onclick = toggleAutoMerge;

  const mergeMessageElements = document.getElementsByClassName('merge-message');
  if (mergeMessageElements.length < 1) {
    return;
  }

  const tabNavElements = document.getElementsByClassName('tabnav-tabs');
  if (tabNavElements.length < 1) {
    return;
  }

  const tabNavElement = tabNavElements[0];
  if (tabNavElement) {
    tabNavElement.appendChild(mergeButton);
  }
}

function getAutoMergeButton() {
  const addedButton = document.getElementById('auto_merge_button');
  return addedButton;
}

function removeNotificationIfNecessary() {
  const addedNotification = getNotification();

  if (addedNotification && !willAutoMerge()) {
    addedNotification.remove();
  }
}

function updateUI() {
  const addedButton = getAutoMergeButton();

  if (addedButton) {
    if (willAutoMerge()) {
      addedButton.innerText = 'CANCEL MERGE';
    } else {
      addedButton.innerText = 'AUTO MERGE PR';
    }
  }
  removeNotificationIfNecessary();
  createNotificationIfNecessary();
}

function createButtonIfNecessary() {
  if (!getAutoMergeButton()) {
    createButton();
    updateUI();
  }
}

function toggleAutoMerge() {
  let automergeUrls = getLocalStorageUrls();
  if (automergeUrls.includes(window.location.href)) {
    automergeUrls = automergeUrls.filter((a) => a !== window.location.href);
  } else {
    automergeUrls.push(window.location.href);
  }
  saveAutoMergeUrls(automergeUrls);
  updateUI();
}

function removeUrlFromLocalStorage() {
  let automergeUrls = getLocalStorageUrls();
  if (automergeUrls.includes(window.location.href)) {
    automergeUrls = automergeUrls.filter((a) => a !== window.location.href);
    createMergedNotification();
  }
  saveAutoMergeUrls(automergeUrls);
}

function mergeIfReady() {
  if (!willAutoMerge()) {
    return;
  }

  testCount += 1;

  let allElements = document.getElementsByTagName('BUTTON');

  allElements = document.getElementsByTagName('BUTTON');
  for (let i = 0; i < allElements.length; i += 1) {
    const element = allElements[i];
    if (
      element.textContent &&
      !element.disabled &&
      element.innerText === 'Delete branch'
    ) {
      element.click();
      return;
    }
  }

  allElements = document.getElementsByTagName('BUTTON');
  for (let i = 0; i < allElements.length; i += 1) {
    const element = allElements[i];
    if (
      element.textContent &&
      !element.disabled &&
      (element.innerText === 'Confirm merge' ||
        element.innerText === 'Confirm squash and merge')
    ) {
      element.click();
      return;
    }
  }

  for (let i = 0; i < allElements.length; i += 1) {
    const element = allElements[i];
    if (
      element.textContent &&
      !element.disabled &&
      !element.className.includes('btn-danger') &&
      (element.innerText === 'Merge pull request' ||
        element.innerText === 'Squash and merge' ||
        element.innerText === 'SMERGE!')
    ) {
      element.click();
    }
  }
}

function cleanupLocalStorage() {
  const mergedBadgeElements = document.getElementsByClassName('State--purple');
  if (mergedBadgeElements.length < 1) {
    return;
  }

  const mergedBadgeElement = mergedBadgeElements[0];
  if (mergedBadgeElement && mergedBadgeElement.innerText === ' Merged') {
    removeUrlFromLocalStorage();
  }
}

function reload() {
  if (!willAutoMerge()) {
    return;
  }

  window.location.reload();
}

function worker() {
  console.log(`worker`);
  try {
    mergeIfReady();
    cleanupLocalStorage();
    createButtonIfNecessary();
    requestNotificationPermissions();

    if (testCount > 200) {
      testCount = 0;
      reload();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 1500);
