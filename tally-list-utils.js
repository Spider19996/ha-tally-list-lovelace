export function detectLang(hass, override = 'auto') {
  if (override && override !== 'auto') return override;
  const lang = hass?.language || hass?.locale?.language || navigator.language || 'en';
  return lang.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function translate(hass, override, strings, key) {
  const lang = detectLang(hass, override);
  return strings[lang]?.[key] ?? strings.en?.[key] ?? key;
}

export function fireEvent(node, type, detail = {}, options = {}) {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: options.bubbles ?? true,
      composed: options.composed ?? true,
    })
  );
}
