// ==UserScript==
// @name        GitHub WIP reminder
// @namespace   urn://https://www.georgegillams.co.uk/greasemonkey/github_WIP_reminder
// @include     *github.com*
// @exclude     none
// @version     5
// @description:en	Adds an reminder to not review WIP PR's
// @description	Adds an reminder to not review WIP PR's
// @grant    		none
// ==/UserScript==

let lastModifiedPr = null;

function addReminder() {
  const prId = `${window.location}`.split('pull/')[1];
  if (lastModifiedPr !== prId) {
    const allElements = document.getElementsByTagName('SPAN');
    for (let i = 0; i < allElements.length; i += 1) {
      const element = allElements[i];
      if (element.innerText.includes('WIP')) {
        if (
          element.parentElement.parentElement.className.includes(
            'labels css-truncate',
          )
        ) {
          const newElement = document.createElement('div');
          newElement.innerText = `HEY THIS IS WIP!`;
          newElement.style.backgroundColor = '#b60205';
          newElement.style.color = 'white';
          newElement.style.fontSize = '2rem';
          newElement.style.position = 'fixed';
          newElement.style.left = 0;
          newElement.style.top = 0;
          newElement.style.zIndex = 40000;
          newElement.style.width = '100vw';
          newElement.style.height = '5rem';
          newElement.style.padding = '1rem';
          newElement.style.display = 'flex';
          newElement.style.alignItems = 'center';
          newElement.style.justifyContent = 'center';
          newElement.style.transition = 'all 0.4s';
          newElement.style.fontWeight = 'bold';
          newElement.onclick = () => {
            newElement.style.opacity = 0;
            newElement.style.pointerEvents = 'none';
          };
          element.parentElement.parentElement.appendChild(newElement);
        }
      }
    }
  }
  lastModifiedPr = prId;
}

setInterval(addReminder, 2000);
