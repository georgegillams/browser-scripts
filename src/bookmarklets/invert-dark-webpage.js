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
  const htmlEl = document.getElementsByTagName('HTML')[0];
  const bodyEl = document.getElementsByTagName('BODY')[0];
  if (!htmlEl || !bodyEl) return;

  const initialClass = htmlEl.className;
  let mode, targetTheme, targetFilter;

  if (initialClass === 'dark' || initialClass === 'light') {
    mode = 'class';
    const currentTheme = initialClass;
    targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
  } else {
    mode = 'filter';
    const filterOn = !!htmlEl.style.filter;
    targetFilter = filterOn ? '' : 'invert(1) brightness(1.1) hue-rotate(170deg)';
  }

  const apply = () => {
    if (mode === 'class') {
      htmlEl.className = targetTheme;
      bodyEl.className = targetTheme;
    } else {
      if (!htmlEl.style) return;
      htmlEl.style.filter = targetFilter;
    }
  };

  if (window.__invertDarkInterval) clearInterval(window.__invertDarkInterval);
  apply();
  window.__invertDarkInterval = setInterval(apply, 1000);
})();
