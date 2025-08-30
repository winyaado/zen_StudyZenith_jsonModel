/*
  初学者向けガイド（share.js）
  ------------------------------------------------------------
  共有リンクの作成・解析まわりのユーティリティを提供します。
  - buildShareUrl: 選択中の科目コード・タイトル・コメントを Base64URL で圧縮し、share.html へ渡す URL を作成
  - parseShareParams: share.html?p=... のクエリから元データを復元
  - getPrefixLabel: 科目コードの先頭英字からカテゴリ名（表示ラベル）を返す
  - setTextEsc: XSS 対策として textContent 経由で代入
*/
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// バイト列 → Base64URL（URLに入れやすい安全な表現）へ変換
function toBase64Url(bytes) {
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return b64;
}

// Base64URL → バイト列に復元
function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function buildShareUrl(selectedCourses, title, comment) {
  // 共有する最小情報（バージョン/科目コード/タイトル/コメント）をパック
  const codes = (selectedCourses || []).map(c => c.code);
  const payload = {
    v: 1,
    s: codes,
    t: (title || '').slice(0, 80),
    c: (comment || '').slice(0, 512)
  };
  const enc = new TextEncoder();
  const bytes = enc.encode(JSON.stringify(payload));
  const packed = toBase64Url(bytes);

  // 現在の origin とパスから share.html への URL を構築
  const url = new URL(window.location.origin + window.location.pathname.replace(/index\.html?$/, '') + 'share.html');
  url.searchParams.set('p', packed);
  return url.toString();
}

export function parseShareParams() {
  const sp = new URLSearchParams(window.location.search);
  const packed = sp.get('p') || '';
  try {
    // p クエリを復号 → JSON を取り出す
    const data = fromBase64Url(packed);
    const json = JSON.parse(new TextDecoder().decode(data));
    const codes = Array.isArray(json.s) ? json.s.map(String) : [];
    const title = (json.t || '').slice(0, 80);
    const comment = (json.c || '').slice(0, 512);
    return { codes, title, comment };
  } catch (_) {
    return { codes: [], title: '', comment: '' };
  }
}

// 先頭の英字部分を取り出してカテゴリ判定に使う
function prefixFromCode(code) {
  const m = String(code || '').match(/^[A-Z]+/i);
  return m ? m[0].toUpperCase() : '';
}

export function getPrefixLabel(code) {
  const PREFIX_LABELS = {
    'INT': '導入',
    'INF': '情報',
    'MTH': '数理',
    'LAN': '外国語',
    'BSC': '基礎',
    'OPT': '卒業要件外',
    'CAR': '社会接続',
    'DIGI': '世界理解科目[デジタル産業]',
    'ECON': '世界理解科目[経済・マーケット]',
    'HUM': '世界理解科目[文化・思想]',
    'SOC': '世界理解科目[社会・ネットワーク]'
  };
  const p = prefixFromCode(code);
  return PREFIX_LABELS[p] || p || 'その他';
}

export function setTextEsc(el, text) {
  el.textContent = text;
}
