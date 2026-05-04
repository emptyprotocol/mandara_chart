window['ai_edge_gallery_get_result'] = async (dataStr) => {
  // LLMs sometimes output common JSON-ish glitches. Try a few cleanup
  // passes; never reject on size mismatches — pad/truncate instead — so
  // the chat doesn't accumulate retries and stale preview cards.
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

  const parsed = tryParse(dataStr) || {};
  const mainTheme = (typeof parsed.mainTheme === 'string' && parsed.mainTheme.trim())
    ? parsed.mainTheme.trim()
    : '(no theme)';
  const lang = parsed.language === 'en' ? 'en' : 'ja';

  // Coerce subThemes into exactly 8 entries × 8 actions, padding empties
  // when the model returned a short list and trimming when it overshot.
  const rawSubs = Array.isArray(parsed.subThemes) ? parsed.subThemes : [];
  const subThemes = [];
  for (let i = 0; i < 8; i++) {
    const s = rawSubs[i] || {};
    const theme = (typeof s.theme === 'string' && s.theme.trim()) ? s.theme.trim() : '';
    const rawActions = Array.isArray(s.actions) ? s.actions : [];
    const actions = [];
    for (let j = 0; j < 8; j++) {
      const a = rawActions[j];
      actions.push(typeof a === 'string' ? a : '');
    }
    subThemes.push({ theme, actions });
  }

  const payload = { mainTheme, language: lang, subThemes };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));

  // Pass the (short) main theme + language as separate query params so the
  // preview card can render instantly without decoding the heavy d= blob.
  // The preview card forwards d= verbatim to mandala.html on tap.
  const fullUrl = 'preview.html?t=' + encodeURIComponent(mainTheme)
    + '&l=' + lang
    + '&d=' + encodeURIComponent(b64)
    + '&v=' + Date.now();

  return JSON.stringify({
    webview: { url: fullUrl },
    result: lang === 'ja'
      ? 'マンダラチャートを生成しました。プレビューをタップして拡大表示できます。'
      : 'Generated your mandala chart. Tap the preview card to view it full-size.',
  });
};
