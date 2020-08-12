// ==UserScript==
// @name        Zoom retry
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/zoom_retry
// @include     *zoom.us*
// @exclude     none
// @version     2
// @description:en	Adds a link to retry launching a Zoom meeting.
// @grant    		none
// @description	Adds a link to retry launching a Zoom meeting.
// ==/UserScript==

function getCleanUrl() {
  let { href } = window.location;
  // eslint-disable-next-line prefer-destructuring
  href = href.split('#success')[0];
  return href;
}

function createButton() {
  const mergeButton = document.createElement('a');
  mergeButton.innerText = `RETRY`;
  mergeButton.style.color = 'white';
  mergeButton.style.fontSize = '1.2rem';
  mergeButton.style.fontWeight = 'bold';
  mergeButton.style.padding = '0.375rem 1.125rem';
  mergeButton.id = 'retry_button';
  mergeButton.style.border = 'none';
  mergeButton.style.backgroundColor = '#0770E3';
  mergeButton.style.borderRadius = '0.25rem';
  mergeButton.style.marginTop = '3rem';
  mergeButton.style.display = 'inline-block';
  mergeButton.style.marginLeft = 'auto';
  mergeButton.style.marginRight = 'auto';

  mergeButton.href = getCleanUrl();

  const mergeMessageElement = document.getElementById('zoom-ui-frame');
  if (mergeMessageElement) {
    mergeMessageElement.appendChild(mergeButton);
  }
}

function createButtonIfNecessary() {
  const mergeMessageElement = document.getElementById('retry_button');
  if (mergeMessageElement) {
    return;
  }

  createButton();
}

function worker() {
  try {
    createButtonIfNecessary();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 1500);
