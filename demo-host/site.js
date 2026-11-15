// Shared by the demo pages. The page chrome uses the plugin's own design tokens, so the header, nav and footer always
// match the form, in every colour theme, and follow the person's Colours choice (event 'db-theme').
(function () {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('db-form-theme'); } catch (e) { /* storage blocked: follow the device */ }
  root.dataset.theme = saved || 'auto';
  document.addEventListener('db-theme', e => { root.dataset.theme = e.detail.theme; });
  customElements.whenDefined('db-form').then(() => {
    const D = customElements.get('db-form').design;
    const css = [`html{${D.TOKENS.standard}}`, ...Object.entries(D.TOKENS).map(([k, v]) => `html[data-theme=${k}]{${v}}`),
      `@media (prefers-color-scheme:dark){html[data-theme=auto]{${D.TOKENS.dark}}}`,
      `@media (prefers-contrast:more){html[data-theme=auto]{${D.TOKENS.contrast}}}`].join('\n');
    const st = document.createElement('style'); st.id = 'db-tokens'; st.textContent = css; document.head.appendChild(st);
    if (!D.THEMES.includes(root.dataset.theme)) root.dataset.theme = 'auto';
  });
})();
