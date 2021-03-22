// ==UserScript==
// @name        Google Meet auto-admit
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/google_meet_auto_admit
// @include     *meet.google.com*
// @exclude     none
// @version     1.0.0
// @description:en	Automatically admits Google Meet participants
// @grant    		none
// @description Automatically admits Google Meet participants
// ==/UserScript==

function admitUserIfWaiting() {
  const divElements = document.getElementsByTagName('DIV');
  for (let i = 0; i < divElements.length; i += 1) {
    const div = divElements[i];
    if (div.innerText === 'Admit') {
      // eslint-disable-next-line no-console
      console.log(`Admitting participant automatically.`);
      div.click();
    }
  }
}

function worker() {
  try {
    admitUserIfWaiting();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 2000);
