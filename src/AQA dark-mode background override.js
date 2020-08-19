// ==UserScript==
// @name        AQA dark-mode background override
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/aqa_darkmode_background_override
// @include     *usablenet.com/*
// @exclude     none
// @version     1
// @description:en	Ensures that the app under inspections keeps it's white background when using Dark-Reader
// @grant    		none
// @description	Ensures that the app under inspections keeps it's white background when using Dark-Reader
// ==/UserScript==

function forceBackground() {
  const appInspectionElement = document.getElementById('app-root');

  if (appInspectionElement && appInspectionElement.style) {
    appInspectionElement.style.backgroundColor = 'white';
  }
}

function worker() {
  try {
    forceBackground();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 1500);
