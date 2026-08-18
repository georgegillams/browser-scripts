// ==UserScript==
// @name        LRN
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/ihasco
// @include     *ihasco.co.uk*
// @exclude     none
// @version     0.0.1
// @description:en	Makes iHasco training less painful
// @grant    		none
// @description Makes iHasco training less painful
// @license MIT
// ==/UserScript==

(
  function(){
    const PLAYBACK_RATE = 80;
    const CORRECT_ANSWER_IDS = [
      'Answer_f30a31bcad7560324b3249ba66ccf7aa',
      'Answer_d5776aeecb3c45ab15adce6f5cb355f3',
      'Answer_bb6b5b6eb263722899d97e72bec2beaf',
      'Answer_c034a71b5fa9e92886d18bbbcad08ab2',
      'Answer_0741da502d25f6eb3d909dd21814cef7',
      'Answer_9b0cc5f6b28af30cad7e7b6ed23fd655',
      'Answer_097d3206b54b21df3adedc1c2634dc68',
      'Answer_5dfd73054e6fe8266baafbbdeef0cae4',
      'Answer_5798f48a01fa7fd52c87b1610f1225d9',
      'Answer_545f6c2f382c04810103b3e5e6f7d841',
      'Answer_f827cf462f62848df37c5e1e94a4da74',
      'Answer_30ad0136bdc75f8ae82585ae8999cb48',
      'Answer_17c30f6cdbac7a984375606f9adae6e3',
      'Answer_7e3b12c56f619bbb75e9e88ee9b3b833',
      'Answer_ca266d62d0536863eed2faf101c81f0b',
      'Answer_93cba07454f06a4a960172bbd6e2a435',
      'Answer_f8320b26d30ab433c5a54546d21f414c',
      'Answer_545f6c2f382c04810103b3e5e6f7d841',
      'Answer_5feb867b36ea2222ca19d9edd6c59528',
      'Answer_e52ced86ce2081fd8a16b1ff07d26038',
      'Answer_c1e2947a139ed3ef2e4d91ea05952508',
    ];

    setInterval(() => {
      const videoPlayButtons = document.getElementsByClassName("vjs-big-play-button");
      const videoElements = document.getElementsByTagName('video');
      const nextButton = document.getElementById("NavNext");
      const getStartedButton = document.getElementById("new-session");
      const quizWrapper = document.getElementById('SummaryText');
      const quizFormShown = quizWrapper?.checkVisibility();
      getStartedButton?.click();
      nextButton?.click();
      if (quizFormShown) {
        for (let correctAnswerId of CORRECT_ANSWER_IDS) {
          document.getElementById(correctAnswerId)?.click();
        }

        /* Correct answer is unknown so just choose anything */
        const answers = [...quizWrapper.getElementsByClassName('answer')];
        answers[Math.floor(Math.random() * answers.length)]?.click();

        return;
      }
      [...videoPlayButtons].map(b => b.click());
      [...videoElements].map(v => v.playbackRate = PLAYBACK_RATE);
    }, 500);
  }
)();