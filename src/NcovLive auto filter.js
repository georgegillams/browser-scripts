// ==UserScript==
// @name        NcovLive auto filter
// @namespace   urn://https://www.georgegillams.co.uk/greasemonkey/ncovlive_auto_filter
// @include     *ncov2019.live*
// @exclude     none
// @version     2.0.0
// @description:en	Auto filters for `united kingdom` in the global data
// @grant    		none
// @description   	Auto filters for `united kingdom` in the global data
// ==/UserScript==

let searchDone = false;

function setFilter() {
  const inputField = document.getElementById('sortable_table_Global_filter')
    .children[0].children[0];
  if (inputField && !searchDone) {
    inputField.value = 'united kingdom';

    // Trigger an input change event otherwise it won't realise the input has changed 😞
    inputField.dispatchEvent(new Event('search'));
    searchDone = true;
  }
}

function worker() {
  try {
    setFilter();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 2000);
