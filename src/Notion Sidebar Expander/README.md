## Notion Sidebar Expander

[Get it for Chrome](https://chrome.google.com/webstore/detail/notion-sidebar-expander/bcncpphhpgindiaibcnbhihjkchnanad/preview)

[Get it for Firefox](https://addons.mozilla.org/en-GB/firefox/addon/notion-sidebar-expander/)

### Developing in Chrome

- Disable the installed extension from the store so that you don't run duplicate instances.
- Open [`chrome://extensions`](chrome://extensions).
- Enable dev mode (if not already).
- Drag this entire directory to the extensions view — Alternatively click `Load unpacked` and select this directory.

If you make changes to the code:

- Press the `reload` button next to the extension in [`chrome://extensions`](chrome://extensions).
- Reload the tab where you are testing the extension.

### Running locally in Firefox

- Decrement the manifest version to `2` as `3` is not supported.
- Enter this directory.
- Run `npx web-ext run`.
  - If using Firefox Nightly or Developer Edition, specify the FF executable: `--firefox=/Applications/Firefox\ Developer\ Edition.app/Contents/MacOS/firefox-bin`

Changes to the code will trigger an automatic rebuild, so all you need to do is refresh the page.
