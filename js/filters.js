/*
  初学者向けガイド（filters.js）
  ------------------------------------------------------------
  セレクトボックス（カテゴリ/クオーター）の選択肢を生成し、
  変更イベントで現在のフィルタ条件を親（main.js）へ通知します。
  - カテゴリは科目コード先頭の英字（prefix）をラベル化して表示
  - クオーターはコースに付与された quarters 配列（Q1〜Q4）から抽出
*/
export function setupFilters(courses, onChange, opts = {}) {
  const { prefixId = 'prefixFilter', quarterId = 'quarterFilter' } = opts;
  const prefixSel = document.getElementById(prefixId);
  const quarterSel = document.getElementById(quarterId);
  if (!prefixSel || !quarterSel) return;

  const PREFIX_LABELS = {
    'INT': '導入',
    'INF': '情報',
    'MTH': '数理',
    'LAN': '外国語',
    'BSC': '基礎',
    'OPT': '自由科目',
    'CAR': '社会接続',
    'DIGI': '世界理解科目[デジタル産業]',
    'ECON': '世界理解科目[経済・マーケット]',
    'HUM': '世界理解科目[文化・思想]',
    'SOC': '世界理解科目[社会・ネットワーク]',
    'PRJ': '卒業プロジェクト'
    // 必要に応じて追記してください
  };
  const labelForPrefix = (p) => PREFIX_LABELS[p] || p; // 未定義はそのまま表示

  // プレフィックス抽出（コード先頭の英字）→ 表示名称でソート
  // コースから prefix を集計して重複排除 → 表示名でソート
  const prefixes = Array.from(new Set(courses.map(c => c.prefix).filter(Boolean)))
    .sort((a, b) => labelForPrefix(a).localeCompare(labelForPrefix(b)));
  for (const p of prefixes) {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = labelForPrefix(p);
    prefixSel.appendChild(opt);
  }

  // クオーター抽出（コードのAAAA→quarters配列）
  // Q1〜Q4 を集計して重複排除 → ソート
  const quarters = Array.from(new Set(courses.flatMap(c => c.quarters || []))).sort();
  for (const q of quarters) {
    const opt = document.createElement('option');
    opt.value = q; opt.textContent = q;
    quarterSel.appendChild(opt);
  }

  // セレクト変更時に現在値を親へ通知
  const handler = () => onChange({ prefix: prefixSel.value || '', quarter: quarterSel.value || '' });
  prefixSel.addEventListener('change', handler);
  quarterSel.addEventListener('change', handler);
}
