// ==UserScript==
// @name        iHasco
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/gitlab-cancel-ci-jobs
// @include     *gitlab*
// @exclude     none
// @version     1.0.0
// @description:en	Cancels all running pipeline jobs for a given MR
// @grant    		none
// @description Cancels all running pipeline jobs for a given MR
// @license MIT
// ==/UserScript==

(async () => {
  let hasCancelled = false;
  let isTrying = false;

  let interval;
  interval = setInterval(async () => {
    if (isTrying) {
      return;
    }
    isTrying = true;
    const pipelineStageButtons = [...document.getElementsByTagName('button')].filter(
      (e) => e.getAttribute('data-testid') === 'pipeline-mini-graph-dropdown-toggle',
    );
    for (let pipelineStateButton of pipelineStageButtons) {
      pipelineStateButton.click();
      await new Promise((res) => setTimeout(res, 1000));
      const cancelButtons = [...document.getElementsByTagName('button')].filter(
        (e) => e.getAttribute('aria-label') === 'Cancel',
      );
      for (let cancelButton of cancelButtons) {
        hasCancelled = true;
        cancelButton.click();
      }
    }
    isTrying = false;
    if (hasCancelled) {
      clearInterval(interval);
    }
  }, 500);
})();
