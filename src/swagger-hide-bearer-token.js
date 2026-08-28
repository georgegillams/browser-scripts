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
  const hasCodeAncestor = (element) => {
    return !!element.closest('pre, code, [class*="code"]');
  };

  const hideBearerTokens = () => {
    const spans = document.querySelectorAll('span:not(.masked-token)');
    const bearerRegex = /(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)/g;
    spans.forEach((span) => {
      if (
        hasCodeAncestor(span) &&
        span.textContent.includes('Bearer ') &&
        !span.innerHTML.includes('masked-token')
      ) {
        span.innerHTML = span.innerHTML.replace(
          bearerRegex,
          '$1<span class="masked-token" style="color: black; background-color: black; border-radius: 3px;">$2</span>',
        );
      }
    });
  };

  hideBearerTokens();
  setInterval(() => {
    hideBearerTokens();
  }, 750);
})();
