// ==UserScript==
// @name        iHasco
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/swagger-hide-bearer-token
// @include     *swagger*
// @exclude     none
// @version     1.0.0
// @description:en	Hides bearer tokens in swagger to make screenshots safe
// @grant    		none
// @description Hides bearer tokens in swagger to make screenshots safe
// @license MIT
// ==/UserScript==

(() => {
  const hideBearerTokens = () => {
    const spans = document.querySelectorAll('span');
    const bearerRegex = /(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)/g;
    spans.forEach((span) => {
      if (span.textContent.includes('Bearer ')) {
        span.innerHTML = span.innerHTML.replace(
          bearerRegex,
          '$1<span style="color: black; background-color: black; border-radius: 3px;">$2</span>',
        );
      }
    });
  };

  hideBearerTokens();
  setInterval(() => {
    hideBearerTokens();
  }, 750);
})();
