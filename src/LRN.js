// ==UserScript==
// @name        LRN
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/lrn
// @include     *lrn.com*
// @exclude     none
// @version     0.0.2
// @description:en	Makes LRN training less painful
// @grant    		none
// @description Makes LRN training less painful
// @license MIT
// ==/UserScript==

let isWorking = false;

const pause = (duration) =>
  new Promise((res) => setTimeout(() => res(), duration));

const isAnswerCheckbox = (element) =>
  element.getAttribute('type') === 'checkbox' &&
  element.id.startsWith('SAQ_CHECKBOX');
const isAnswerRadio = (element) =>
  element.getAttribute('type') === 'radio' &&
  element.id.startsWith('SAQ_RADIO');

const speedUpVideo = () => {
  const videos = [...document.getElementsByTagName('video')];
  videos.forEach((video) => (video.playbackRate = 10.0));
};

const pressPlayVideo = () => {
  const playButton = document.getElementById('VIDEO_PLAY_BUTTON');
  if (!playButton) {
    return;
  }
  playButton.click();
};

const answerQuestionIfAvailable = () => {
  const scorePieChart = document.getElementById('PIE_TEXT_QUICK_QUIZ_PROGRESS');
  if (scorePieChart) {
    // We can't automate this part as we need the answers to be correct!
    return;
  }

  const submitButton = document.getElementById('IP_SAQ_SUBMIT_BUTTON');
  if (!submitButton) {
    return;
  }
  const submitDisabled = submitButton.getAttribute('aria-disabled') === 'true';
  if (!submitDisabled) {
    submitButton.click();
  }

  // The submit button cannot yet be pressed, so we need to select more answers
  const uncheckedAnswers = [...document.getElementsByTagName('INPUT')].filter(
    (input) =>
      (isAnswerCheckbox(input) || isAnswerRadio(input)) &&
      input.getAttribute('aria-checked') !== 'true',
  );
  if (!uncheckedAnswers.length) {
    return;
  }
  uncheckedAnswers[0].click();
};

const expandSectionsIfAvailable = async () => {
  const expandableItems = [
    ...document.getElementsByClassName('ip-ctr-Btn'),
    ...document.getElementsByClassName('ip-accordion-popupBtn'),
  ];
  if (!expandableItems.length) {
    return;
  }
  isWorking = true;
  for (let item of expandableItems) {
    item.click();
    await pause(600);
  }
  isWorking = false;
};

const pressNextIfAvailable = () => {
  const nextButton = document.getElementById('NAV_NEXT');
  if (!nextButton) {
    return;
  }
  const isDisabled = nextButton.getAttribute('aria-disabled') === 'true';
  if (isDisabled) {
    return;
  }
  nextButton.click();
};

function doActions() {
  pressNextIfAvailable();
  expandSectionsIfAvailable();
  answerQuestionIfAvailable();
  pressPlayVideo();
  speedUpVideo();
}

function worker() {
  try {
    // If another action is in progress, then don't trigger new actions yet...
    if (!isWorking) {
      doActions();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

setInterval(worker, 500);
