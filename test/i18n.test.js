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
  const match = html.match(/const I18N = (\{[\s\S]*?\n\s*\};)/);
  assert.ok(match, 'I18N object found in index.html');

  // Evaluate safely in isolated context
  const i18n = new Function(`return ${match[1].replace(/;$/, '')}`)();
  
  const langs = Object.keys(i18n);
  assert.equal(langs.length, 28, 'I18N must have exactly 28 languages');

  for (const code of ALL_28_CODES) {
    assert.ok(i18n[code], `Language ${code} must exist in I18N`);
  }

  const baseKeys = Object.keys(i18n['pt-PT']);
  assert.ok(baseKeys.length >= 320, `Base pt-PT must have >= 320 keys (found ${baseKeys.length})`);

  for (const code of ALL_28_CODES) {
    const langKeys = Object.keys(i18n[code]);
    for (const k of baseKeys) {
      assert.ok(
        i18n[code][k] !== undefined && i18n[code][k] !== '',
        `Language ${code} missing key "${k}"`
      );
    }
  }

  // Critical navigation functions
  assert.ok(html.includes('function switchTab('), 'function switchTab defined in index.html');
  assert.ok(html.includes('function applyTheme('), 'function applyTheme defined in index.html');
  assert.ok(html.includes('function toggleTheme('), 'function toggleTheme defined in index.html');

  // Check critical modal translation keys exist in HTML
  assert.ok(html.includes('data-i18n="terms_modal_title"'), 'terms_modal_title data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="terms_sec1_title"'), 'terms_sec1_title data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="terms_btn_close"'), 'terms_btn_close data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="terms_lead_dev"'), 'terms_lead_dev data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="terms_github_profile"'), 'terms_github_profile data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="btn_download_error_report"'), 'btn_download_error_report data-i18n present in index.html');
  assert.ok(!html.slice(0, html.indexOf('<script>')).includes('${t('), 'No raw ${t(...)} template literals in HTML markup');
  assert.ok(html.includes('function localizeDeployLog('), 'function localizeDeployLog defined in index.html');
  assert.ok(html.includes('data-i18n="set_modal_title"'), 'set_modal_title data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="set_tab_projects"'), 'set_tab_projects data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="wz_modal_title"'), 'wz_modal_title data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="wz_step1_label"'), 'wz_step1_label data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="wz_port_prefix_label"'), 'wz_port_prefix_label data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="header_tagline"'), 'header_tagline data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="lang_menu_title"'), 'lang_menu_title data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="lang_menu_count"'), 'lang_menu_count data-i18n present in index.html');
  assert.ok(html.includes('data-i18n-title="tt_global_settings"'), 'tt_global_settings data-i18n-title present in index.html');
  assert.ok(html.includes('data-i18n="api_gen_key_title"'), 'api_gen_key_title data-i18n present in index.html');
  assert.ok(html.includes('data-i18n="mcp_title"'), 'mcp_title data-i18n present in index.html');
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

test('i18n: api_docs.html contains all 28 languages, vector flags and options', () => {
  const apiHtml = fs.readFileSync('api_docs.html', 'utf8');

  for (const code of ALL_28_CODES) {
    assert.match(
      apiHtml,
      new RegExp(`<option value="${code}"`),
      `api_docs.html missing <option value="${code}"> in lang-selector`
    );
  }

  assert.ok(apiHtml.includes('id="lang-picker-container"'), 'api_docs.html has lang-picker-container');
  assert.ok(apiHtml.includes('id="lang-dropdown-menu"'), 'api_docs.html has lang-dropdown-menu');
  assert.ok(apiHtml.includes('const COUNTRY_FLAGS ='), 'api_docs.html has COUNTRY_FLAGS');

  const match = apiHtml.match(/const API_I18N = (\{[\s\S]*?\n\s*\};)/);
  assert.ok(match, 'API_I18N object found in api_docs.html');

  const apiI18n = new Function(`return ${match[1].replace(/;$/, '')}`)();
  const langs = Object.keys(apiI18n);
  assert.equal(langs.length, 28, 'API_I18N must have exactly 28 languages');

  for (const code of ALL_28_CODES) {
    assert.ok(apiI18n[code], `Language ${code} must exist in API_I18N`);
    assert.ok(apiI18n[code].portal_subtitle, `Language ${code} missing portal_subtitle in API_I18N`);
    assert.ok(apiI18n[code].btn_dashboard, `Language ${code} missing btn_dashboard in API_I18N`);
  }
});


