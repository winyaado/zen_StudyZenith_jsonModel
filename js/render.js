/*
  初学者向けガイド（render.js）
  ------------------------------------------------------------
  画面への描画（DOM生成）を担当します。
  - renderAllCourses: 左タブの講義一覧カードを生成
  - renderSelectedCourses: 右タブの履修中リストを生成
  - renderGraduationStatus: 卒業要件の達成状況（プログレスバー等）を生成
  ここでは「見た目の組み立て」に専念し、状態の保存/判定は他のモジュールに委譲します。
*/
import { saveSelectedCourses } from './state.js';
import { computeGraduationStatus } from './requirements.js';

export function renderAllCourses(allCourses, selectedCourses) {
  const container = document.getElementById('allCourses');
  const loadingMessage = document.getElementById('loadingMessage');
  container.innerHTML = '';

  if (!allCourses.length && !loadingMessage.classList.contains('hidden')) {
    container.innerHTML = '<p class="text-gray-500 col-span-full text-center">講義データを読み込み中です...</p>';
    return;
  }
  if (!allCourses.length && loadingMessage.classList.contains('hidden')) {
    container.innerHTML = '<p class="text-gray-500 col-span-full text-center">該当する講義が見つかりません。</p>';
    return;
  }

  // 1講義ずつカードとして組み立て
  for (const course of allCourses) {
    // 既に履修中か（ボタンの活性に使う）
    const isSelected = selectedCourses.some(sc => sc.id === course.id);
    const el = document.createElement('div');
    el.className = 'p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between';
    const quarters = (course.quarters || []).join(' ');
    const safeDesc = escapeHtml(course.description || '説明なし').replaceAll('。', '。<br>');
    el.innerHTML = `
      <div class="md:grid md:grid-cols-3 md:gap-3 mb-3">
        <div class="md:col-span-1 text-[11px] text-gray-500 order-2 md:order-1">
          <div class="truncate">${escapeHtml(course.code)}</div>
          <div class="mt-0.5">${course.credits}単位</div>
          <div class="flex flex-wrap items-center gap-1 mt-1.5">${quarters ? quarters.split(' ').map(q => `<span class=\"px-1.5 py-0.5 rounded bg-gray-100 text-gray-600\">${q}</span>`).join('') : ''}</div>
        </div>
        <div class="md:col-span-2 order-1 md:order-2">
          <h3 class="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">${escapeHtml(course.name)}</h3>
          <p class="desc text-xs text-gray-600 flex-grow overflow-hidden" style="display:-webkit-box;-webkit-line-clamp:7;-webkit-box-orient:vertical;">${safeDesc}</p>
        </div>
      </div>
      <button data-course-id="${course.id}" class="add-course-btn w-full text-sm py-2 px-3 rounded-md transition-colors ${isSelected ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}" ${isSelected ? 'disabled' : ''}>
        ${isSelected ? '追加済み' : '履修追加'}
      </button>
    `;
    container.appendChild(el);


  }

  // ハンドラ
  // クリックで選択配列に追加し、保存とボタン無効化
  container.querySelectorAll('.add-course-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.getAttribute('data-course-id');
      const course = allCourses.find(c => c.id === id);
      if (!course) return;
      if (!selectedCourses.some(c => c.id === id)) {
        selectedCourses.push(course);
        saveSelectedCourses(selectedCourses);
        e.currentTarget.textContent = '追加済み';
        e.currentTarget.disabled = true;
        e.currentTarget.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        e.currentTarget.classList.add('bg-gray-400', 'text-gray-700', 'cursor-not-allowed');
      }
    });
  });
}

export function renderSelectedCourses(selectedCourses, onChange) {
  // 履修中（右タブ）を1行ずつ並べる
  const list = document.getElementById('selectedCoursesList');
  list.innerHTML = '';
  if (!selectedCourses.length) {
    list.innerHTML = '<p class="text-gray-500">まだ講義が選択されていません。「講義選択」タブから追加してください。</p>';
    return;
  }
  for (const course of selectedCourses) {
    const row = document.createElement('div');
    row.className = 'p-4 border border-gray-200 rounded-lg shadow-sm bg-white flex items-center justify-between';
    row.innerHTML = `
      <div>
        <h4 class="font-medium text-gray-800 text-sm md:text-base">${escapeHtml(course.name)}</h4>
        <p class="text-sm text-gray-500">${escapeHtml(course.code)} - ${course.credits}単位</p>
      </div>
      <button data-course-id="${course.id}" class="remove-course-btn bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-3 rounded-md transition-colors">削除</button>
    `;
    list.appendChild(row);
  }
  list.querySelectorAll('.remove-course-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      // data-* 属性から対象IDを取得して配列から除去
      const id = e.currentTarget.getAttribute('data-course-id');
      const next = selectedCourses.filter(c => c.id !== id);
      saveSelectedCourses(next);
      onChange?.(next);
    });
  });
}

export function renderGraduationStatus(selectedCourses, requirements) {
  const wrap = document.getElementById('graduationStatus');
  // 判定エンジンで現在の達成状況を取得
  const status = computeGraduationStatus(selectedCourses, requirements);
  // 総単位の進捗（%）
  const totalPct = Math.min(100, Math.round((status.total.achieved / status.total.req) * 100));

  let html = '';
  html += `
    <div class="mb-6">
      <div class="mb-2 text-sm text-gray-700">総単位: <span class="font-semibold">${status.total.achieved}</span> / 必要 <span class="font-semibold">${status.total.req}</span></div>
      <div class="progress-bar-bg w-full h-4"><div class="progress-bar" style="width:${totalPct}%">${totalPct}%</div></div>
    </div>
  `;

  // 各カテゴリごとにカードを描画
  for (const [catId, cat] of Object.entries(status.categories)) {
    const pct = Math.min(100, Math.round((cat.achieved / (cat.req || 1)) * 100));
    html += `
      <div class="mb-5 p-4 rounded-md border bg-white">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold text-gray-800">${escapeHtml(cat.name)}</div>
          <div class="text-sm ${cat.met ? 'text-green-600' : 'text-gray-600'}">${cat.achieved} / ${cat.req} 単位</div>
        </div>
        <div class="progress-bar-bg w-full h-3 mb-2"><div class="progress-bar" style="width:${pct}%"></div></div>
        ${cat.notes ? `<div class="text-xs text-gray-500 mb-2">${escapeHtml(cat.notes)}</div>` : ''}
    `;

    // サブカテゴリ（あれば）も進捗バーで表示
    if (cat.subCategories) {
      html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">`;
      for (const sub of Object.values(cat.subCategories)) {
        const spct = Math.min(100, Math.round((sub.achieved / (sub.req || 1)) * 100));
        html += `
          <div class="p-3 rounded border">
            <div class="flex items-center justify-between mb-1">
              <div class="text-sm text-gray-700">${escapeHtml(sub.name)}</div>
              <div class="text-xs ${sub.met ? 'text-green-600' : 'text-gray-600'}">${sub.achieved} / ${sub.req}</div>
            </div>
            <div class="progress-bar-bg w-full h-2"><div class="progress-bar" style="width:${spct}%"></div></div>
          </div>
        `;
      }
      html += `</div>`;
    }

    // サブチェック（上限/合算などのルールを含む）
    if (cat.subChecks) {
      html += `<div class="mt-3 space-y-3">`;
      for (const sc of Object.values(cat.subChecks)) {
        const r = sc.req || 0;
        const num = sc.achievedCounted ?? sc.achieved;
        const hasOnlyMax = (!r || r === 0) && typeof sc.max === 'number';
        const spct = r ? Math.min(100, Math.round((num / r) * 100)) : 0;

        if (hasOnlyMax) {
          html += `
            <div class="p-3 rounded border">
              <div class="flex items-center justify-between mb-1">
                <div class="text-sm text-gray-700">${escapeHtml(sc.name)}</div>
                <div class="text-xs text-gray-600">${num}</div>
              </div>
              ${sc.description ? `<div class="text-xs text-gray-500">${escapeHtml(sc.description)}</div>` : ''}
            </div>
          `;
        } else {
          html += `
            <div class="p-3 rounded border">
              <div class="flex items-center justify-between mb-1">
                <div class="text-sm text-gray-700">${escapeHtml(sc.name)}</div>
                <div class="text-xs ${sc.met ? 'text-green-600' : 'text-gray-600'}">${num} / ${r}${sc.max ? `（上限${sc.max}）` : ''}</div>
              </div>
              <div class="progress-bar-bg w-full h-2 mb-1"><div class="progress-bar" style="width:${spct}%"></div></div>
              ${sc.description ? `<div class="text-xs text-gray-500">${escapeHtml(sc.description)}</div>` : ''}
            </div>
          `;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  wrap.innerHTML = html;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
