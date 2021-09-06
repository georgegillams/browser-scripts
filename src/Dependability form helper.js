// ==UserScript==
// @name        Dependability form helper
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/dependability_form_helper
// @include     *forms.office.com/*
// @exclude     none
// @version     0.0.1
// @grant    	none
// @description	Helps when filling in the dependability form
// ==/UserScript==

const SQUAD_NAME = 'Koala';

function selectSquadIfNecessary() {
  const selectElement = document.getElementsByClassName(
    'select-placeholder',
  )[0];
  if (selectElement.innerText.includes(SQUAD_NAME)) {
    return;
  }
  selectElement.click();
  const options = document.getElementsByClassName('select-option-nocheck');
  for (let i = 0; i < options.length; i += 1) {
    if (options[i].innerText.includes(SQUAD_NAME)) {
      options[i].click();
    }
  }
}

function fixRadios() {
  const texts = document.getElementsByClassName('text-format-content');
  for (let i = 0; i < texts.length; i += 1) {
    if (texts[i].innerText === '0') {
      texts[i].innerText = 'No';
    }
    if (texts[i].innerText === '1') {
      texts[i].innerText = 'Yes';
    }
  }
}

function helpMe() {
  selectSquadIfNecessary();
  fixRadios();
}

function worker() {
  try {
    helpMe();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 1500);
