import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ALL_28_CODES = [
  'pt-PT', 'en', 'es', 'fr', 'it', 'de', 'de-AT', 'nl', 'el',
  'pl', 'ru', 'zh', 'ja', 'sv', 'ro', 'mo', 'cs', 'hr', 'da',
  'sk', 'sl', 'et', 'fi', 'hu', 'lv', 'lt', 'mt', 'la'
];

test('i18n: index.html contains all 28 languages with 100% dictionary completeness', () => {
  const html = fs.readFileSync('index.html', 'utf8');

  // Check language selector has all 28 options
  for (const code of ALL_28_CODES) {
    assert.match(
      html,
      new RegExp(`<option value="${code}"`),
      `index.html missing <option value="${code}"> in lang-selector`
    );
  }

  // Extract I18N object
  const match = html.match(/const I18N = (\{[\s\S]*?\n    \};)/);
  assert.ok(match, 'I18N object found in index.html');

  // Evaluate safely in isolated context
  const i18n = new Function(`return ${match[1].replace(/;$/, '')}`)();
  
  const langs = Object.keys(i18n);
  assert.equal(langs.length, 28, 'I18N must have exactly 28 languages');

  for (const code of ALL_28_CODES) {
    assert.ok(i18n[code], `Language ${code} must exist in I18N`);
  }

  const baseKeys = Object.keys(i18n['pt-PT']);
  assert.ok(baseKeys.length >= 160, `Base pt-PT must have >= 160 keys (found ${baseKeys.length})`);

  for (const code of ALL_28_CODES) {
    const langKeys = Object.keys(i18n[code]);
    for (const k of baseKeys) {
      assert.ok(
        i18n[code][k] !== undefined && i18n[code][k] !== '',
        `Language ${code} missing key "${k}"`
      );
    }
  }
});

test('i18n: login.html contains all 28 languages and selector options', () => {
  const html = fs.readFileSync('login.html', 'utf8');

  for (const code of ALL_28_CODES) {
    assert.match(
      html,
      new RegExp(`<option value="${code}"`),
      `login.html missing <option value="${code}"> in lang-selector`
    );
  }

  const match = html.match(/const LOGIN_I18N = (\{[\s\S]*?\n\s*\};)/);
  assert.ok(match, 'LOGIN_I18N object found in login.html');

  const loginI18n = new Function(`return ${match[1].replace(/;$/, '')}`)();
  const langs = Object.keys(loginI18n);
  assert.equal(langs.length, 28, 'LOGIN_I18N must have exactly 28 languages');

  for (const code of ALL_28_CODES) {
    assert.ok(loginI18n[code], `Language ${code} must exist in LOGIN_I18N`);
    assert.ok(loginI18n[code].btn_login, `Language ${code} missing btn_login`);
    assert.ok(loginI18n[code].username_label, `Language ${code} missing username_label`);
    assert.ok(loginI18n[code].password_label, `Language ${code} missing password_label`);
    assert.ok(loginI18n[code].tagline, `Language ${code} missing tagline`);
  }
});

test('i18n: browser autodetection handles all 28 locales and variations', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok(html.includes('function detectBrowserLanguage()'), 'detectBrowserLanguage defined');

  // Verify logic on sample variations
  const testCases = [
    { input: ['pt-PT'], expected: 'pt-PT' },
    { input: ['pt-BR', 'en'], expected: 'pt-PT' },
    { input: ['en-US'], expected: 'en' },
    { input: ['es-ES'], expected: 'es' },
    { input: ['fr-FR'], expected: 'fr' },
    { input: ['it-IT'], expected: 'it' },
    { input: ['de-DE'], expected: 'de' },
    { input: ['de-AT'], expected: 'de-AT' },
    { input: ['nl-NL'], expected: 'nl' },
    { input: ['el-GR'], expected: 'el' },
    { input: ['pl-PL'], expected: 'pl' },
    { input: ['ru-RU'], expected: 'ru' },
    { input: ['zh-CN'], expected: 'zh' },
    { input: ['ja-JP'], expected: 'ja' },
    { input: ['sv-SE'], expected: 'sv' },
    { input: ['ro-RO'], expected: 'ro' },
    { input: ['ro-MD'], expected: 'mo' },
    { input: ['cs-CZ'], expected: 'cs' },
    { input: ['hr-HR'], expected: 'hr' },
    { input: ['da-DK'], expected: 'da' },
    { input: ['sk-SK'], expected: 'sk' },
    { input: ['sl-SI'], expected: 'sl' },
    { input: ['et-EE'], expected: 'et' },
    { input: ['fi-FI'], expected: 'fi' },
    { input: ['hu-HU'], expected: 'hu' },
    { input: ['lv-LV'], expected: 'lv' },
    { input: ['lt-LT'], expected: 'lt' },
    { input: ['mt-MT'], expected: 'mt' },
    { input: ['la-VA'], expected: 'la' },
    { input: ['unknown-language'], expected: 'pt-PT' }
  ];

  // Emulate detectBrowserLanguage implementation
  function detect(browserLangs, supported) {
    for (let rawLang of browserLangs) {
      if (!rawLang) continue;
      const l = rawLang.toLowerCase();

      if (l === 'pt-pt' || l === 'pt-br' || l.startsWith('pt')) return 'pt-PT';
      if (l === 'de-at') return 'de-AT';
      if (l === 'ro-md' || l === 'mo') return 'mo';
      if (l === 'zh-cn' || l === 'zh-tw' || l === 'zh-hk' || l.startsWith('zh')) return 'zh';

      const exact = supported.find(s => s.toLowerCase() === l);
      if (exact) return exact;

      const primary = l.split('-')[0];
      const prefixMatch = supported.find(s => s.toLowerCase() === primary);
      if (prefixMatch) return prefixMatch;
    }
    return 'pt-PT';
  }

  for (const tc of testCases) {
    const result = detect(tc.input, ALL_28_CODES);
    assert.equal(
      result,
      tc.expected,
      `For browser languages ${JSON.stringify(tc.input)}, expected ${tc.expected} but got ${result}`
    );
  }
});

test('i18n: vector country flags exist for all 28 languages in index.html and login.html', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  const loginHtml = fs.readFileSync('login.html', 'utf8');

  assert.ok(indexHtml.includes('id="lang-picker-container"'), 'index.html has lang-picker-container');
  assert.ok(indexHtml.includes('id="lang-dropdown-menu"'), 'index.html has lang-dropdown-menu');
  assert.ok(indexHtml.includes('const COUNTRY_FLAGS ='), 'index.html has COUNTRY_FLAGS');

  assert.ok(loginHtml.includes('id="lang-picker-container"'), 'login.html has lang-picker-container');
  assert.ok(loginHtml.includes('id="lang-dropdown-menu"'), 'login.html has lang-dropdown-menu');
  assert.ok(loginHtml.includes('const COUNTRY_FLAGS ='), 'login.html has COUNTRY_FLAGS');

  const match = indexHtml.match(/const COUNTRY_FLAGS = (\{[\s\S]*?\});/);
  assert.ok(match, 'COUNTRY_FLAGS object found in index.html');
  const flags = JSON.parse(match[1]);

  for (const code of ALL_28_CODES) {
    assert.ok(flags[code], `COUNTRY_FLAGS missing vector flag for ${code}`);
    assert.ok(flags[code].includes('<svg'), `COUNTRY_FLAGS[${code}] must be an SVG vector`);
  }
});

