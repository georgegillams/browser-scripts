// ==UserScript==
// @name        Copy Jira ticket ID
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/jira_copy_ticket_id
// @include     *github.skyscannertools.net*
// @include     *gojira.skyscanner.net*
// @exclude     none
// @version     1.0.0
// @description:en	Adds a button next to a Jira ticket ID to copy the ID to the clipboard
// @grant    		none
// @description Adds a button next to a Jira ticket ID to copy the ID to the clipboard
// ==/UserScript==

function makeCopyButton(idElement, ticketID) {
  idElement.style.display = 'flex';
  idElement.style.marginBottom = '0.4rem';

  const newElement = document.createElement('button');
  newElement.innerText = '📋';
  newElement.style.border = 'none';
  newElement.style.borderRadius = '.25rem';
  newElement.style.marginLeft = '.5rem';
  newElement.id = `jira-id-copy-button-${ticketID}`;
  newElement.onclick = function () {
    console.log(`ID ${ticketID} copied`);
    navigator.clipboard.writeText(ticketID);
  };

  idElement.appendChild(newElement);
}

function makeCopyButtonIfNeeded(idElement) {
  const idElementSubElements = idElement.getElementsByClassName(
    'ghx-issue-key-link',
  );
  if (idElementSubElements.length < 1) {
    return;
  }

  const ticketID = idElementSubElements[0].innerText;
  const existingCopyElement = document.getElementById(
    `jira-id-copy-button-${ticketID}`,
  );
  if (!!existingCopyElement) {
    return;
  }

  makeCopyButton(idElement, ticketID);
}

function makeCopyButtons() {
  const idElements = document.getElementsByClassName('ghx-key');
  for (let i = 0; i < idElements.length; i += 1) {
    makeCopyButtonIfNeeded(idElements[i]);
  }
}

function worker() {
  try {
    makeCopyButtons();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 2000);
