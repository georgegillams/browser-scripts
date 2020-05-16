// ==UserScript==
// @name        Disney toggle play/pause
// @namespace   urn://https://www.georgegillams.co.uk/greasemonkey/disney_plus_play_pause
// @include     *disneyplus.com*
// @exclude     none
// @version     1
// @description:en	Allows you to play/pause disney plus by pressing `space` on your keyboard
// @grant    		none
// @description Allows you to play/pause disney plus by pressing `space` on your keyboard
// ==/UserScript==

function addListener() {
  document.addEventListener('keypress', function(event) {
    if (event.keyCode === 32) {
      // The play/pause button is not available unless we activate the playback controls:
      document.getElementsByClassName('btm-media-client-element')[0].click();

      // Now we can click the play/pause button
      document.getElementsByClassName('play-pause-icon')[0].click();
    }
  });
}

addListener();
