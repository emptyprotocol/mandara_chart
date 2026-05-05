window['ai_edge_gallery_get_result'] = async (dataStr) => {
  // LLMs sometimes output common JSON-ish glitches; try a few cleanup
  // passes. Always return a webview — never return an error — so the
  // chat doesn't accumulate retries and stale preview cards.
  function tryParse(raw) {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw !== 'string') return null;
    const attempts = [
      (s) => s,
      (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
      (s) => s
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/,(\s*[}\]])/g, '$1'),
      (s) => {
        const m = s.match(/\{[\s\S]*\}/);
        if (!m) return null;
        return m[0]
          .replace(/[“”]/g, '"')
          .replace(/[‘’]/g, "'")
          .replace(/,(\s*[}\]])/g, '$1');
      },
    ];
    for (const transform of attempts) {
      try {
        const candidate = transform(raw);
        if (candidate == null) continue;
        return JSON.parse(candidate);
      } catch (_) { /* try next */ }
    }
    return null;
  }

  // Accept either short keys (m/l/s/t/a — preferred for token economy)
  // or long keys (mainTheme/language/subThemes/theme/actions — legacy).
  function pick(obj, shortKey, longKey) {
    if (obj == null) return undefined;
    return obj[shortKey] !== undefined ? obj[shortKey] : obj[longKey];
  }

  const parsed = tryParse(dataStr) || {};
  const mtRaw = pick(parsed, 'm', 'mainTheme');
  const langRaw = pick(parsed, 'l', 'language');
  const subsRaw = pick(parsed, 's', 'subThemes');

  const mainTheme = (typeof mtRaw === 'string' && mtRaw.trim())
    ? mtRaw.trim()
    : '(no theme)';
  const lang = langRaw === 'en' ? 'en' : 'ja';

  // Coerce to exactly 8 entries × 8 actions; pad short, trim long.
  const rawSubs = Array.isArray(subsRaw) ? subsRaw : [];
  const subThemes = [];
  for (let i = 0; i < 8; i++) {
    const s = rawSubs[i] || {};
    const themeRaw = pick(s, 't', 'theme');
    const actsRaw = pick(s, 'a', 'actions');
    const theme = (typeof themeRaw === 'string' && themeRaw.trim()) ? themeRaw.trim() : '';
    const rawActions = Array.isArray(actsRaw) ? actsRaw : [];
    const actions = [];
    for (let j = 0; j < 8; j++) {
      const a = rawActions[j];
      actions.push(typeof a === 'string' ? a : '');
    }
    subThemes.push({ theme, actions });
  }

  // Internal payload uses long keys (mandala.html expects them).
  const payload = { mainTheme, language: lang, subThemes };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));

  const fullUrl = 'preview.html?t=' + encodeURIComponent(mainTheme)
    + '&l=' + lang
    + '&d=' + encodeURIComponent(b64)
    + '&v=' + Date.now();

  return JSON.stringify({
    webview: { url: fullUrl, aspectRatio: 1.0 },
    result: lang === 'ja'
      ? 'マンダラチャートを生成しました。プレビューをタップして拡大表示できます。'
      : 'Generated your mandala chart. Tap the preview card to view it full-size.',
  });
};
