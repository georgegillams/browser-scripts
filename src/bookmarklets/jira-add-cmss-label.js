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
  const LABEL = 'CMSS';

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

  const issueMatch = window.location.pathname.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/);
  if (!issueMatch) {
    addToast('Jira CMSS Label: Not on a Jira issue URL. Aborting.', 'error');
    return;
  }

  const issueKey = issueMatch[1];
  const baseUrl = window.location.origin;

  const getResp = await fetch(`${baseUrl}/rest/api/2/issue/${issueKey}?fields=labels`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!getResp.ok) {
    addToast(`Jira CMSS Label: Failed to fetch issue (${getResp.status}).`, 'error');
    return;
  }

  const issue = await getResp.json();
  const existingLabels = issue.fields?.labels ?? [];

  if (existingLabels.includes(LABEL)) {
    addToast(`Jira CMSS Label: ${issueKey} already has the ${LABEL} label.`, 'info');
    return;
  }

  const putResp = await fetch(`${baseUrl}/rest/api/2/issue/${issueKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ update: { labels: [{ add: LABEL }] } }),
  });

  if (!putResp.ok) {
    addToast(`Jira CMSS Label: Failed to add label (${putResp.status}).`, 'error');
    return;
  }

  addToast(`Jira CMSS Label: Added ${LABEL} to ${issueKey}.`, 'success');
})();
