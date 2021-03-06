// ==UserScript==
// @name        GitHub CI links new tab
// @namespace   urn://https://www.georgegillams.co.uk/greasemonkey/github_ci_new_tab
// @include     *github.*
// @exclude     none
// @version     8.0.0
// @description:en	Adds rel=no_opener and taget=blank to github travis links on GitHub
// @grant    		none
// @description   	Adds rel=no_opener and taget=blank to github travis links on GitHub
// ==/UserScript==

function addTarget() {
  const allElements = document.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i += 1) {
    const element = allElements[i];
    if (
      element.href &&
      element.href.includes &&
      (element.href.includes('travis') ||
        element.href.includes('jenkins') ||
        element.href.includes('check_run_id'))
    ) {
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
    }
  }
}

function worker() {
  try {
    addTarget();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 2000);
