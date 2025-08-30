/*
  初学者向けガイド（data.js）
  ------------------------------------------------------------
  assets/courses.json を読み込み、画面で扱いやすい形に整形します。
  - parseCredits: 文字列/数値の単位表記を数値へ正規化
  - derivePrefix: 科目コード先頭の英字を「カテゴリ（プレフィックス）」として抽出
  - deriveQuartersFromCode: コード中の学期表現から Q1〜Q4 を推定
  - loadCoursesFromFile: fetch → JSON → 正規化配列を返却
*/
// 文字列や null 混在の単位表記を数値へ正規化します
function parseCredits(raw) {
  if (typeof raw === 'number') return raw;
  if (!raw) return 0;
  const m = String(raw).match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

// 科目コードの先頭英字（例: INT, INF, ...）を抽出して大文字化
function derivePrefix(code) {
  if (!code) return '';
  const m = String(code).match(/^[A-Z]+/i);
  return m ? m[0].toUpperCase() : '';
}

// コード中の 4桁フラグ（例: 1011 なら Q1,Q3,Q4）を解析して quarters 配列を返す
function deriveQuartersFromCode(code) {
  const s = String(code || '');
  const parts = s.split('-');
  // 形式: XXXX-X-XX-AAAA-XXX → index 3 が AAAA
  const a = parts[3] || '';
  if (a.length !== 4) return [];
  const qs = [];
  for (let i = 0; i < 4; i++) {
    if (a[i] && a[i] !== '0') qs.push(`Q${i + 1}`);
  }
  return qs;
}

// courses.json を取得して、UI で扱いやすいオブジェクト配列に整形
export async function loadCoursesFromFile(path = './assets/courses.json') {
  const loadingMessage = document.getElementById('loadingMessage');
  loadingMessage.textContent = '講義データを読み込み中...';
  loadingMessage.classList.remove('hidden');

  // fetch で JSON を取得（静的ホスティング環境ではそのまま読めます）
  const res = await fetch(path);
  if (!res.ok) throw new Error(`コースデータの取得に失敗: ${res.status}`);
  const raw = await res.json();
  const seen = new Set(); // id の重複を避けるための集合
  const courses = [];
  for (const c of raw) {
    if (c && c.id && !seen.has(c.id)) {
      seen.add(c.id);
      const code = c.code ?? c.id;
      const quarters = deriveQuartersFromCode(code);
      courses.push({
        id: c.id,
        code,
        name: c.name ?? '(名称未設定)',
        description: c.description ?? '',
        credits: parseCredits(c.credits),
        rawCourseData: c.rawCourseData || null,
        prefix: derivePrefix(code),
        quarters
      });
    }
  }
  loadingMessage.classList.add('hidden');
  return courses;
}
