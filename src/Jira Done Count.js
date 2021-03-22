// ==UserScript==
// @name        Jira done count
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/jira_done_count
// @include     *gojira.*
// @exclude     none
// @version     1
// @description:en	Adds done-count to sprint description.
// @grant    		none
// @description	Adds done-count to sprint description.
// ==/UserScript==

let doneCount = -1;

function getDoneCount() {
  const columns = document.getElementsByClassName('ghx-column ui-sortable');
  if (columns.length < 1) {
    return;
  }
  const doneColumn = columns[columns.length - 1];
  return doneColumn.childNodes.length;
}

function updateDoneCount(newValue) {
  if (doneCount === newValue) {
    return;
  }

  doneCount = newValue;

  const sprintDescriptionElement = document.getElementById('ghx-sprint-goal');
  const currentValue = sprintDescriptionElement.innerHTML;
  const newTextValue = `${currentValue.split(' • ')[0]} • ${doneCount} ticket${
    doneCount === 1 ? '' : 's'
  } done`;
  console.log(`newTextValue`, newTextValue);
  sprintDescriptionElement.innerHTML = newTextValue;
}

function updateCount() {
  const doneCount = getDoneCount();
  updateDoneCount(doneCount);
}

function worker() {
  try {
    updateCount();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 1500);
