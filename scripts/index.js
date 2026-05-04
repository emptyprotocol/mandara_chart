window['ai_edge_gallery_get_result'] = async (dataStr) => {
  const fail = (msg) => JSON.stringify({ error: msg });

  // Accept either an already-parsed object or a JSON string. LLMs sometimes
  // output common JSON-ish glitches (smart quotes, trailing commas, an
  // explanatory prefix before the {...}); try a few cleanup passes before
  // giving up.
  function tryParse(raw) {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw !== 'string') throw new Error('data must be a string or object');
    const attempts = [
      (s) => s,
      (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
      (s) => s
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/,(\s*[}\]])/g, '$1'),
      (s) => {
        const m = s.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('no { ... } block found in data');
        return m[0]
          .replace(/[“”]/g, '"')
          .replace(/[‘’]/g, "'")
          .replace(/,(\s*[}\]])/g, '$1');
      },
    ];
    let lastErr;
    for (const transform of attempts) {
      try {
        return JSON.parse(transform(raw));
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('parse failed');
  }

  let parsed;
  try {
    parsed = tryParse(dataStr);
  } catch (e) {
    const snippet = (typeof dataStr === 'string' ? dataStr : String(dataStr)).slice(0, 240);
    return fail('Invalid JSON (' + e.message + '). data starts with: ' + snippet);
  }

  if (!parsed || typeof parsed !== 'object') {
    return fail('Expected a JSON object with mainTheme and subThemes.');
  }
  if (typeof parsed.mainTheme !== 'string' || !parsed.mainTheme.trim()) {
    return fail('mainTheme is required and must be a non-empty string.');
  }
  if (!Array.isArray(parsed.subThemes) || parsed.subThemes.length !== 8) {
    return fail('subThemes must be an array of exactly 8 entries (got ' +
      (Array.isArray(parsed.subThemes) ? parsed.subThemes.length : typeof parsed.subThemes) + ').');
  }
  for (let i = 0; i < 8; i++) {
    const s = parsed.subThemes[i];
    if (!s || typeof s.theme !== 'string' || !s.theme.trim()) {
      return fail('subThemes[' + i + '].theme is required.');
    }
    if (!Array.isArray(s.actions) || s.actions.length !== 8) {
      return fail('subThemes[' + i + '].actions must have exactly 8 strings (got ' +
        (Array.isArray(s.actions) ? s.actions.length : typeof s.actions) + ').');
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
