// ==UserScript==
// @name        Jira copy ID from URL
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/jira-copy-id-from-url
// @include     *atlassian.net/browse/*
// @exclude     none
// @version     1.0.0
// @description:en	Copies the Jira issue ID from the current URL to the clipboard
// @grant    		none
// @description	Copies the Jira issue ID from the current URL to the clipboard
// @license MIT
// ==/UserScript==

(async () => {
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

    const existing = document.getElementById('ge-jira-copy-id-toast');
    if (existing) existing.remove();

    const bg = { info: '#2563eb', error: '#dc2626', success: '#16a34a' }[type] ?? '#2563eb';

    const el = document.createElement('div');
    el.id = 'ge-jira-copy-id-toast';
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
    }, 3740);
  };

  const issueMatch = window.location.pathname.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/);
  if (!issueMatch) {
    addToast('Copy Jira ID: Not on a Jira issue URL.', 'error');
    return;
  }

  const issueKey = issueMatch[1];

  try {
    await navigator.clipboard.writeText(issueKey);
    addToast(`Copied: ${issueKey}`, 'success');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = issueKey;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    addToast(`Copied: ${issueKey}`, 'success');
  }
})();
