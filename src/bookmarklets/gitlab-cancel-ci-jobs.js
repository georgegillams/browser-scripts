// ==UserScript==
// @name        GitLab cancel CI jobs
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/gitlab-cancel-ci-jobs
// @include     *gitlab*
// @exclude     none
// @version     2.1.0
// @description:en	Cancels all running pipeline jobs for a given MR
// @grant    		none
// @description Cancels all running pipeline jobs for a given MR
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

    const existing = document.getElementById('ge-gitlab-cancel');
    if (existing) existing.remove();

    const bg = { info: '#2563eb', error: '#dc2626', success: '#16a34a' }[type] ?? '#2563eb';

    const el = document.createElement('div');
    el.id = 'ge-gitlab-cancel';
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

  addToast('Working on it', 'info');

  const mrMatch = window.location.pathname.match(/^\/(.+)\/-\/merge_requests\/(\d+)/);
  if (!mrMatch) {
    addToast('GitLab Cancel CI: Not on a merge request URL. Aborting.', 'error');
    return;
  }

  const projectPath = mrMatch[1];
  const mrIid = mrMatch[2];
  const baseUrl = window.location.origin;
  const encodedProject = encodeURIComponent(projectPath);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const RETRY_INTERVAL_MS = 5000;
  const RETRY_TIMEOUT_MS = 3 * 60 * 1000;
  const startTime = Date.now();

  let active;
  for (let attempt = 0; ; attempt++) {
    const pipelinesResp = await fetch(
      `${baseUrl}/api/v4/projects/${encodedProject}/merge_requests/${mrIid}/pipelines`,
      { headers },
    );
    if (!pipelinesResp.ok) {
      addToast(`GitLab Cancel CI: Failed to fetch pipelines (${pipelinesResp.status}).`, 'error');
      return;
    }

    const pipelines = await pipelinesResp.json();
    active = pipelines.filter((p) =>
      ['running', 'pending', 'waiting_for_resource', 'preparing'].includes(p.status),
    );
    if (active.length > 0) break;

    if (Date.now() - startTime + RETRY_INTERVAL_MS > RETRY_TIMEOUT_MS) {
      addToast('GitLab Cancel CI: No active pipelines found after 3 minutes. Giving up.', 'error');
      return;
    }
    if (attempt === 0) {
      addToast(
        'GitLab Cancel CI: No active pipelines yet. Retrying every 5s for up to 3 minutes...',
        'info',
      );
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
  }

  let cancelled = 0;
  for (const pipeline of active) {
    const resp = await fetch(
      `${baseUrl}/api/v4/projects/${encodedProject}/pipelines/${pipeline.id}/cancel`,
      { method: 'POST', headers },
    );
    if (resp.ok) cancelled++;
  }

  addToast(`GitLab Cancel CI: Cancelled ${cancelled} of ${active.length} pipeline(s).`, 'success');
})();
