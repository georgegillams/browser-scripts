// ==UserScript==
// @name        LRN
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/lrn
// @include     *lrn.com*
// @exclude     none
// @version     0.0.5
// @description:en	Makes LRN training less painful
// @grant    		none
// @description Makes LRN training less painful
// @license MIT
// ==/UserScript==

const DEBUG = false;
const ATTEMPT_QUIZZES = false;

let isWorking = false;

const getRandomItem = (arr) => {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex] ?? arr[0];
};

const pause = (duration) =>
  new Promise((res) => setTimeout(() => res(), duration));

const debug = DEBUG ? (...args) => console.log('DEBUG:', ...args) : () => null;

const closePopup = () => {
  const closeButton = document.getElementById('POP_CLOSE');
  if (!closeButton) {
    return;
  }
  closeButton.click();
};

const isAnswerCheckbox = (element) =>
  element.getAttribute('type') === 'checkbox' &&
  element.id.startsWith('SAQ_CHECKBOX');
const isAnswerRadio = (element) =>
  element.getAttribute('type') === 'radio' &&
  element.id.startsWith('SAQ_RADIO');

const speedUpVideo = () => {
  const videos = [...document.getElementsByTagName('video')];
  debug('Speeding up videos', videos);
  videos.forEach((video) => (video.playbackRate = 4.0));
};

const pressPlayVideo = () => {
  const playButton = document.getElementById('VIDEO_PLAY_BUTTON');
  debug('Play button', playButton);
  if (!playButton) {
    return;
  }
  playButton.click();
  debug('Pressing play button');
};

const answerQuestionIfAvailable = () => {
  const scorePieChart = document.getElementById('PIE_TEXT_QUICK_QUIZ_PROGRESS');
  if (scorePieChart && !TRY_QUIZZES) {
    // We can't automate this part as we need the answers to be correct!
    debug('Not attempting quiz');
    return;
  }

  const submitButton = document.getElementById('IP_SAQ_SUBMIT_BUTTON');
  debug('submitButton', submitButton);
  if (!submitButton) {
    return;
  }
  debug('Attempting question(s)');
  const submitDisabled = submitButton.getAttribute('aria-disabled') === 'true';
  debug('submitDisabled', submitDisabled);
  if (!submitDisabled) {
    submitButton.click();
  }

  // The submit button cannot yet be pressed, so we need to select more answers
  const uncheckedAnswers = [...document.getElementsByTagName('INPUT')].filter(
    (input) =>
      (isAnswerCheckbox(input) || isAnswerRadio(input)) &&
      input.getAttribute('aria-checked') !== 'true',
  );
  debug('uncheckedAnswers', uncheckedAnswers);
  if (!uncheckedAnswers.length) {
    return;
  }
  getRandomItem(uncheckedAnswers).click();
};

const expandSectionsIfAvailable = async () => {
  const expandableItems = [
    ...document.getElementsByClassName('ip-ctr-Btn'),
    ...document.getElementsByClassName('ip-accordion-popupBtn'),
  ];
  debug('expandableItems', expandableItems);
  if (!expandableItems.length) {
    return;
  }
  isWorking = true;
  for (let item of expandableItems) {
    debug('Expandable item', item);
    item.click();
    await pause(800);
  }
  isWorking = false;
};

const pressNextIfAvailable = () => {
  const nextButton = document.getElementById('NAV_NEXT');
  debug('nextButton', nextButton);
  if (!nextButton) {
    return;
  }
  const isDisabled = nextButton.getAttribute('aria-disabled') === 'true';
  debug('nextButton isDisabled', isDisabled);
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
  closePopup();
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
