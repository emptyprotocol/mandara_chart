window['ai_edge_gallery_get_result'] = async (dataStr) => {
  const fail = (msg) => JSON.stringify({ error: msg });

  let parsed;
  try {
    parsed = JSON.parse(dataStr || '{}');
  } catch (e) {
    return fail('Invalid JSON: ' + e.message);
  }

  if (!parsed || typeof parsed !== 'object') {
    return fail('Expected a JSON object with mainTheme and subThemes.');
  }
  if (typeof parsed.mainTheme !== 'string' || !parsed.mainTheme.trim()) {
    return fail('mainTheme is required and must be a non-empty string.');
  }
  if (!Array.isArray(parsed.subThemes) || parsed.subThemes.length !== 8) {
    return fail('subThemes must be an array of exactly 8 entries.');
  }
  for (let i = 0; i < 8; i++) {
    const s = parsed.subThemes[i];
    if (!s || typeof s.theme !== 'string' || !s.theme.trim()) {
      return fail('subThemes[' + i + '].theme is required.');
    }
    if (!Array.isArray(s.actions) || s.actions.length !== 8) {
      return fail('subThemes[' + i + '].actions must have exactly 8 strings.');
    }
    for (let j = 0; j < 8; j++) {
      if (typeof s.actions[j] !== 'string') {
        return fail('subThemes[' + i + '].actions[' + j + '] must be a string.');
      }
    }
  }

  const lang = parsed.language === 'en' ? 'en' : 'ja';
  const payload = {
    mainTheme: parsed.mainTheme,
    language: lang,
    subThemes: parsed.subThemes.map((s) => ({
      theme: s.theme,
      actions: s.actions.slice(0, 8),
    })),
  };

  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  const fullUrl = 'preview.html?d=' + encodeURIComponent(b64) + '&v=' + Date.now();

  return JSON.stringify({
    webview: { url: fullUrl },
    result: lang === 'ja'
      ? 'マンダラチャートを生成しました。プレビューをタップして拡大表示できます。'
      : 'Generated your mandala chart. Tap the preview card to view it full-size.',
  });
};
