// Shared theme state for the course shell and standalone demos.
(() => {
  const storageKey = 'cs4343-theme';
  const valid = theme => theme === 'light' || theme === 'dark';
  const fromUrl = () => new URLSearchParams(location.search).get('theme');

  function updateControls() {
    const next = get() === 'dark' ? 'light' : 'dark';
    for (const button of document.querySelectorAll('[data-theme-toggle]')) {
      button.textContent = next === 'dark' ? 'Dark mode' : 'Light mode';
      button.setAttribute('aria-label', `Switch to ${next} mode`);
    }
    for (const link of document.querySelectorAll('[data-theme-link]')) {
      const url = new URL(link.href);
      url.searchParams.set('theme', get());
      link.href = url.href;
    }
  }

  function get() {
    return document.documentElement.dataset.theme;
  }

  function set(theme, { persist = true, updateUrl = true, notifyParent = true } = {}) {
    if (!valid(theme)) return;
    const changed = get() !== theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    updateControls();
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('theme', theme);
      // Storage and history can be unavailable when opened as a local file.
      try { history.replaceState(history.state, '', url); } catch {}
    }
    if (persist) {
      try { localStorage.setItem(storageKey, theme); } catch {}
    }
    if (changed) {
      window.dispatchEvent(new CustomEvent('course-theme-change', { detail: { theme } }));
    }
    if (notifyParent && window.parent !== window) {
      // All course frames are same-origin. Standalone/foreign embedding is safe too.
      try { window.parent.CourseTheme?.set(theme); } catch {}
    }
  }

  let initial = fromUrl();
  if (!valid(initial)) {
    try { initial = localStorage.getItem(storageKey); } catch {}
  }
  window.CourseTheme = { get, set };
  set(valid(initial) ? initial : 'light', { persist: false, updateUrl: false, notifyParent: false });

  document.addEventListener('DOMContentLoaded', updateControls);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-theme-toggle]')) set(get() === 'dark' ? 'light' : 'dark');
  });
  window.addEventListener('popstate', () => {
    const theme = fromUrl();
    if (valid(theme)) set(theme, { persist: false, updateUrl: false });
  });
  window.addEventListener('storage', event => {
    if (event.key === storageKey && valid(event.newValue)) set(event.newValue, { persist: false });
  });
})();
