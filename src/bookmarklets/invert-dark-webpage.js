// ==UserScript==
// @name        Invert Dark Webpage
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/invert-dark-webpage
// @include     none
// @exclude     none
// @version     1.0.0
// @description:en	Crudely inverts a dark webpage
// @grant    		none
// @description	Crudely inverts a dark webpage
// @license MIT
// ==/UserScript==

(() => {
  const invert = () => {
    if (!document?.getElementsByTagName('HTML')[0]?.style) {
      return;
    }
    document.getElementsByTagName('HTML')[0].style.filter =
      'invert(1) brightness(1.1) hue-rotate(170deg)';
  };

  invert();
  setInterval(() => {
    invert();
  }, 1000);
})();
