// ==UserScript==
// @name        Sainsbury's no scroll
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/sainsburys-no-scroll
// @include     https://www.sainsburys.co.uk/gol-ui/SearchResults/*
// @exclude     none
// @version     1.0.0
// @description:en	Prevents the page from scrolling after you add an item to your basket
// @grant    		none
// @description	Prevents the page from scrolling after you add an item to your basket
// @license MIT
// ==/UserScript==

function worker() {
  try {
    Element.prototype.scrollIntoView = () =>
      console.log('scrollIntoView is disabled');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

worker();
