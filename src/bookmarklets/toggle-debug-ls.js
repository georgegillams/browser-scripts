// ==UserScript==
// @name        Jira add CMSS label
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/jira-add-cmss-label
// @include     *atlassian.net/browse/*
// @exclude     none
// @version     1.0.0
// @description:en	Adds the CMSS label to the current Jira ticket
// @grant    		none
// @description	Adds the CMSS label to the current Jira ticket
// @license MIT
// ==/UserScript==

(async () => {
  const LOCAL_STORAGE_KEY = 'ui.debug';

  const addToast = (message, type = 'info') => {
    if (!document.getElementById('ge-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'ge-toast-styles';
      style.textContent = `
        @keyframes ge-toast-in {
          from { opacity: 0; transform: translateY(-0.5rem) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)        scale(1);    }
        }
        @keyframes ge-toast-out {
          from { opacity: 1; transform: translateY(0)        scale(1);    }
          to   { opacity: 0; transform: translateY(-0.5rem) scale(0.97); }
        }
      `;
      document.head.appendChild(style);
    }

    const existing = document.getElementById('ge-jira-cmss-label');
    if (existing) existing.remove();

    const bg = { info: '#2563eb', error: '#dc2626', success: '#16a34a' }[type] ?? '#2563eb';

    const el = document.createElement('div');
    el.id = 'ge-jira-cmss-label';
    el.style.cssText = `
      background: ${bg};
      color: contrast-color(${bg});
      padding: 0.75rem 1.25rem;
      font-size: 1rem;
      font-family: system-ui, sans-serif;
      line-height: 1.5;
      position: fixed;
      left: 1.5rem;
      top: 1.5rem;
      z-index: 20000;
      border-radius: 0.6rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      max-width: 28rem;
      animation: ge-toast-in 0.25s ease forwards;
    `;
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'ge-toast-out 0.25s ease forwards';
      setTimeout(() => el.remove(), 260);
    }, 9740);
  };

  const currentValue = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  const newValue = currentValue === 'true' ? 'false' : true;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, newValue);

  addToast(`Debug mode turned ${newValue === 'true' ? 'ON' : 'OFF'}`, 'success');
})();
