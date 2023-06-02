// ==UserScript==
// @name        Remember me
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/remember-me
// @include     *okta.com*
// @exclude     none
// @version     1.0.0
// @description:en	NA
// @grant    		none
// @description NA
// @license MIT
// ==/UserScript==

const REMEMBER_ME_NAMES = ['rememberMe'];

let interval = null;

function checkAndFill() {
  let hasChecked = false;
  const checkboxes = [...document.getElementsByTagName('INPUT')].filter(
    (element) => element.getAttribute('type') === 'checkbox',
  );
  for (const checkbox of checkboxes) {
    if (REMEMBER_ME_NAMES.includes(checkbox.name) && !checkbox.checked) {
      checkbox.click();
      hasChecked = true;
    }
  }

  if (hasChecked && interval) {
    clearInterval(interval);
    interval = null;
  }
}

function worker() {
  try {
    checkAndFill();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

interval = setInterval(worker, 100);
