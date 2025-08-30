/*
  初学者向けガイド（main.js）
  ------------------------------------------------------------
  このファイルはアプリ全体の初期化と画面間の橋渡しを行います。
  - タブ切り替えの設定（tabs.js）
  - 講義データの読み込み（data.js → assets/courses.json）
  - 履修中の保存/復元（state.js：localStorage を利用）
  - 各種描画の指示（render.js）
  - 卒業要件の読み込み・適用（requirements.js）
  - 共有リンクの生成（share.js）

  データの流れ（ざっくり）
  courses.json を読み込み → main.js が保持 → 検索/フィルタ適用 → render.js が DOM に描画。
  履修中の選択は localStorage に保存され、ページ再読込後も復元されます。
*/
import { setupTabs } from './tabs.js';
import { loadCoursesFromFile } from './data.js';
import { loadSelectedCourses, saveSelectedCourses } from './state.js';
import { renderAllCourses, renderSelectedCourses, renderGraduationStatus } from './render.js';
import { loadExternalRequirements, getRequirements, exportRequirements, importRequirementsFromFile, resetRequirements, updateRequirementsTextarea } from './requirements.js';
import { setupFilters } from './filters.js';
import { buildShareUrl } from './share.js';

// すべての講義一覧 / 履修中の選択を保持する変数
let allCourses = [];
let selectedCourses = [];
let searchInput;
let currentPrefix = '';
let currentQuarter = '';
let searchInputSelected;
let currentPrefixSelected = '';
let currentQuarterSelected = '';

// 左タブの講義一覧を、検索/フィルタ条件で再描画
function refreshCourseList() {
  if (!searchInput) return;
  // 入力値を小文字化して部分一致検索に利用
  const q = (searchInput.value || '').toLowerCase();
  let filtered = allCourses.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q) ||
    (c.description || '').toLowerCase().includes(q)
  );
  // カテゴリ（プレフィックス）で絞り込み
  if (currentPrefix) {
    filtered = filtered.filter(c => c.prefix === currentPrefix);
  }
  // クオーター（Q1?Q4）で絞り込み
  if (currentQuarter) {
    filtered = filtered.filter(c => Array.isArray(c.quarters) && c.quarters.includes(currentQuarter));
  }
  renderAllCourses(filtered, selectedCourses);
}

// 右タブの履修中一覧を、検索/フィルタ条件で再描画
function refreshSelectedList() {
  const q = (searchInputSelected?.value || '').toLowerCase();
  let filtered = selectedCourses.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q) ||
    (c.description || '').toLowerCase().includes(q)
  );
  // カテゴリ（プレフィックス）で絞り込み
  if (currentPrefixSelected) {
    filtered = filtered.filter(c => c.prefix === currentPrefixSelected);
  }
  // クオーター（Q1?Q4）で絞り込み
  if (currentQuarterSelected) {
    filtered = filtered.filter(c => Array.isArray(c.quarters) && c.quarters.includes(currentQuarterSelected));
  }
  renderSelectedCourses(filtered, syncSelectedCourses);
}

// 右下に出る簡易モーダルで通知するヘルパー
function showModal(msg) {
  const modal = document.getElementById('messageModal');
  const text = document.getElementById('modalMessageText');
  const close = document.getElementById('closeModalButton');
  // HTMLとして解釈させない（安全なテキスト表示）
  text.textContent = msg;
  modal.style.display = 'block';
  close.onclick = () => (modal.style.display = 'none');
  window.onclick = evt => { if (evt.target === modal) modal.style.display = 'none'; };
}

// ページ読み込み完了時にアプリを初期化
async function init() {
  setupTabs((tabId) => {
    if (tabId === 'myCoursesTab') {
      renderSelectedCourses(selectedCourses, syncSelectedCourses);
    }
    if (tabId === 'graduationCheckTab') {
      renderGraduationStatus(selectedCourses, getRequirements());
    }
    if (tabId === 'gradReqManagementTab') {
      updateRequirementsTextarea();
    }
  });

  // 卒業要件（外部 JSON）を先に読み込み
  await loadExternalRequirements();

  // 選択済みを復元
  selectedCourses = loadSelectedCourses();

  // 講義データ（ファイル）を読み込み
  try {
    allCourses = await loadCoursesFromFile('./assets/courses.json');
  } catch (e) {
    console.error(e);
    showModal(`講義データの読み込みに失敗しました: ${e.message}`);
  }

  // 検索と描画
  // 入力ボックスを取得してイベントを登録
  searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', refreshCourseList);
  // フィルター初期化
  setupFilters(allCourses, ({ prefix, quarter }) => {
    currentPrefix = prefix;
    currentQuarter = quarter;
    refreshCourseList();
  }, { prefixId: 'prefixFilter', quarterId: 'quarterFilter' });
  refreshCourseList();

  // 履修中フィルター初期化
  // 履修中タブ側の入力ボックス
  searchInputSelected = document.getElementById('searchInputSelected');
  if (searchInputSelected) {
    searchInputSelected.addEventListener('input', refreshSelectedList);
  }
  setupFilters(allCourses, ({ prefix, quarter }) => {
    currentPrefixSelected = prefix;
    currentQuarterSelected = quarter;
    refreshSelectedList();
  }, { prefixId: 'prefixFilterSelected', quarterId: 'quarterFilterSelected' });
  refreshSelectedList();

  // 共有タブ: コメント文字数制限とリンク生成
  const commentEl = document.getElementById('shareCommentInput');
  const titleEl = document.getElementById('shareTitleInput');
  const countEl = document.getElementById('shareCommentCount');
  const outEl = document.getElementById('shareLinkOutput');
  const genBtn = document.getElementById('generateShareLinkButton');
  const copyBtn = document.getElementById('copyShareLinkButton');

  function updateCount() {
    if (!commentEl || !countEl) return;
    const v = commentEl.value || '';
    if (v.length > 512) commentEl.value = v.slice(0,512);
    countEl.textContent = String(commentEl.value.length);
  }
  commentEl?.addEventListener('input', updateCount);
  updateCount();

  genBtn?.addEventListener('click', () => {
    const title = (titleEl?.value || '').slice(0,80);
    const comment = (commentEl?.value || '').slice(0,512);
    const url = buildShareUrl(selectedCourses, title, comment);
    if (outEl) outEl.value = url;
    if (copyBtn) copyBtn.disabled = !url;
  });

  copyBtn?.addEventListener('click', async () => {
    const url = outEl?.value || '';
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showModal('共有リンクをコピーしました。');
    } catch (_) {
      showModal('コピーに失敗しました。手動で選択してコピーしてください。');
    }
  });

  // 履修データのエクスポート/インポート
  const exportDataButton = document.getElementById('exportDataButton');
  const importDataButton = document.getElementById('importDataButton');
  const importDataInput = document.getElementById('importDataInput');
  exportDataButton.addEventListener('click', () => {
    const ids = selectedCourses.map(c => c.code).join('\n');
    const blob = new Blob([ids], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'selected_course_codes.txt'; a.click();
    URL.revokeObjectURL(url);
  });
  importDataButton.addEventListener('click', () => {
    const lines = (importDataInput.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const set = new Set(lines);
    const next = allCourses.filter(c => set.has(c.code));
    syncSelectedCourses(next);
    refreshCourseList();
    renderSelectedCourses(selectedCourses, syncSelectedCourses);
    renderGraduationStatus(selectedCourses, getRequirements());
    showModal('インポートが完了しました。');
  });

  // 卒業要件のエクスポート/インポート/リセット
  document.getElementById('exportRequirementsButton').addEventListener('click', exportRequirements);
  document.getElementById('importRequirementsButton').addEventListener('click', async () => {
    const input = document.getElementById('importRequirementsInputFile');
    if (!input.files || !input.files[0]) return;
    try {
      await importRequirementsFromFile(input.files[0]);
      renderGraduationStatus(selectedCourses, getRequirements());
      showModal('卒業要件を適用しました。');
    } catch (e) {
      showModal('卒業要件の読み込みに失敗しました。');
    }
  });
  document.getElementById('resetRequirementsButton').addEventListener('click', () => {
    resetRequirements();
    renderGraduationStatus(selectedCourses, getRequirements());
    showModal('卒業要件をデフォルトにリセットしました。');
  });
}

// 履修中配列を差し替えて保存→両タブを更新
function syncSelectedCourses(next) {
  selectedCourses = next;
  saveSelectedCourses(selectedCourses);
  renderSelectedCourses(selectedCourses, syncSelectedCourses);
  renderGraduationStatus(selectedCourses, getRequirements());
  // 講義選択画面のボタン状態も更新する
  refreshCourseList();
  // 履修中フィルターを適用して一覧を更新
  refreshSelectedList();
}

window.addEventListener('DOMContentLoaded', init);
