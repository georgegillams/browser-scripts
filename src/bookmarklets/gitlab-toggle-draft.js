/* ==UserScript==
@name        GitLab toggle draft
@namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/gitlab-toggle-draft
@include     *gitlab*
@exclude     none
@version     1.0.0
@description:en	Toggles draft status on a GitLab MR. If draft, removes draft (and approves if author is you). If not draft, makes it draft and removes your approval.
@grant    		none
@description Toggles draft status on a GitLab MR
@license MIT
==/UserScript== */

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

    const existing = document.getElementById('ge-gitlab-toggle-draft');
    if (existing) existing.remove();

    const bg = { info: '#2563eb', error: '#dc2626', success: '#16a34a' }[type] ?? '#2563eb';

    const el = document.createElement('div');
    el.id = 'ge-gitlab-toggle-draft';
    el.style.cssText = `
      background: ${bg};
      color: white;
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

  const updatePageTitle = (newTitle) => {
    const selectors = [
      '.merge-request-title-text',
      '[data-testid="mr-title"]',
      '.title.qa-title',
      '.page-title .title',
      'h1.title',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) { el.textContent = newTitle; break; }
    }
  };

  const mrMatch = window.location.pathname.match(/^\/(.+)\/-\/merge_requests\/(\d+)/);
  if (!mrMatch) {
    addToast('GitLab Toggle Draft: Not on a merge request URL. Aborting.', 'error');
    return;
  }

  const projectPath = mrMatch[1];
  const mrIid = mrMatch[2];
  const baseUrl = window.location.origin;
  const encodedProject = encodeURIComponent(projectPath);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

  /* Fetch current user */
  const currentUserResp = await fetch(`${baseUrl}/api/v4/user`, { headers });
  if (!currentUserResp.ok) {
    addToast(`GitLab Toggle Draft: Failed to fetch current user (${currentUserResp.status}).`, 'error');
    return;
  }
  const currentUser = await currentUserResp.json();

  /* Fetch MR details */
  const mrResp = await fetch(
    `${baseUrl}/api/v4/projects/${encodedProject}/merge_requests/${mrIid}`,
    { headers },
  );
  if (!mrResp.ok) {
    addToast(`GitLab Toggle Draft: Failed to fetch MR (${mrResp.status}).`, 'error');
    return;
  }
  const mr = await mrResp.json();

  const isDraft = mr.draft || mr.work_in_progress;
  const isAuthor = mr.author?.id === currentUser.id;

  if (isDraft) {
    /* Remove draft */
    const title = mr.title.replace(/^(Draft:|WIP:)\s*/i, '').trim();
    const updateResp = await fetch(
      `${baseUrl}/api/v4/projects/${encodedProject}/merge_requests/${mrIid}`,
      { method: 'PUT', headers, body: JSON.stringify({ title }) },
    );
    if (!updateResp.ok) {
      addToast(`GitLab Toggle Draft: Failed to remove draft (${updateResp.status}).`, 'error');
      return;
    }

    if (isAuthor) {
      /* Approve the MR */
      const approveResp = await fetch(
        `${baseUrl}/api/v4/projects/${encodedProject}/merge_requests/${mrIid}/approve`,
        { method: 'POST', headers },
      );
      if (approveResp.ok) {
        updatePageTitle(title);
        addToast('GitLab Toggle Draft: Draft removed and MR approved.', 'success');
      } else {
        updatePageTitle(title);
        addToast(`GitLab Toggle Draft: Draft removed, but approval failed (${approveResp.status}).`, 'info');
      }
    } else {
      updatePageTitle(title);
      addToast('GitLab Toggle Draft: Draft removed.', 'success');
    }
  } else {
    /* Make draft */
    const draftTitle = `Draft: ${mr.title}`;
    const updateResp = await fetch(
      `${baseUrl}/api/v4/projects/${encodedProject}/merge_requests/${mrIid}`,
      { method: 'PUT', headers, body: JSON.stringify({ title: draftTitle }) },
    );
    if (!updateResp.ok) {
      addToast(`GitLab Toggle Draft: Failed to make draft (${updateResp.status}).`, 'error');
      return;
    }

    /* Remove approval (unapprove) */
    const unapproveResp = await fetch(
      `${baseUrl}/api/v4/projects/${encodedProject}/merge_requests/${mrIid}/unapprove`,
      { method: 'POST', headers },
    );
    if (unapproveResp.ok) {
      updatePageTitle(draftTitle);
      addToast('GitLab Toggle Draft: MR set to draft and approval removed.', 'success');
    } else if (unapproveResp.status === 404) {
      /* No approval to remove */
      updatePageTitle(draftTitle);
      addToast('GitLab Toggle Draft: MR set to draft (no approval to remove).', 'success');
    } else {
      updatePageTitle(draftTitle);
      addToast(`GitLab Toggle Draft: Set to draft, but unapprove failed (${unapproveResp.status}).`, 'info');
    }
  }
})();
