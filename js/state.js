/*
  初学者向けガイド（state.js）
  ------------------------------------------------------------
  履修中の選択状態をブラウザの localStorage に保存/復元します。
  保存フォーマットは JSON 文字列で、選択中コース配列をそのまま保持します。
*/
const STORAGE_KEY = 'selectedCourses';

export function loadSelectedCourses() {
  // 失敗時は空配列で復帰（初回起動など）
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load selectedCourses:', e);
    return [];
  }
}

export function saveSelectedCourses(courses) {
  // localStorage は同期 API。例外は握りつぶして警告出力のみ
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch (e) {
    console.warn('Failed to save selectedCourses:', e);
  }
}
