// 旧実装の構造に対応した判定エンジンを提供
// categories/subCategories/subChecks/subSubChecks、識別ルールや上限値に対応

/*
  初学者向けガイド（requirements.js）
  ------------------------------------------------------------
  卒業要件の「定義（設定値）」と「判定ロジック」を提供します。
  - DEFAULT_GRADUATION_REQUIREMENTS: デフォルト要件（外部 JSON が読めない時に使用）
  - get/set/load/export/import/reset/update: 要件定義の取得/設定/入出力/適用
  - computeGraduationStatus(selectedCourses, config): 選択中講義の達成状況を集計

  判定の流れ（概要）
  1) カテゴリ/サブカテゴリ/サブチェック/下位チェックにコースを分類（identification で判定）
  2) 単位を加算し、必要に応じて合算・上限（max）を適用
  3) met フラグ（充足）を更新し、全体と各カテゴリの進捗を算出
*/
export const DEFAULT_GRADUATION_REQUIREMENTS = {
  version: '1.1.0',
  description: 'サンプル: 詳細要件構造に対応（総単位+導入/基礎/展開の例）',
  exclusionPrefixes: ['OPT'],
  totalCreditsRequired: 124,
  categories: [
    {
      id: 'introductory',
      name: '導入科目',
      creditsRequired: 14,
      identification: { startsWith: ['INT-'] }
    },
    {
      id: 'basic',
      name: '基礎科目',
      creditsRequired: 12,
      allSubCategoriesMustBeMet: true,
      subCategories: [
        { id: 'basicMath', name: '数理', creditsRequired: 2, identification: { courseCodes: ['BSC-1-B1-0204-004', 'BSC-1-B1-1030-005', 'BSC-1-B1-0204-006'] } },
        { id: 'basicInfo', name: '情報', creditsRequired: 2, identification: { courseCodes: ['BSC-1-B1-1030-001', 'BSC-1-B1-0204-002', 'BSC-1-B1-0204-003'] } },
        { id: 'basicCultureThought', name: '文化・思想', creditsRequired: 2, identification: { courseCodes: ['BSC-1-B1-1030-007', 'BSC-1-B1-1030-008', 'BSC-1-B1-0204-009'] } },
        { id: 'basicSocietyNetwork', name: '社会・ネットワーク', creditsRequired: 2, identification: { courseCodes: ['BSC-1-B1-1030-010', 'BSC-1-B1-0204-011', 'BSC-1-B1-1030-012'] } },
        { id: 'basicEconomyMarket', name: '経済・マーケット', creditsRequired: 2, identification: { courseCodes: ['BSC-1-B1-0204-013', 'BSC-1-B1-0204-014', 'BSC-1-B1-0204-015'] } },
        { id: 'basicMultilingualITComm', name: '多言語ITコミュニケーション', creditsRequired: 2, identification: { courseCodes: ['BSC-1-A2-1234-016'] } }
      ]
    },
    {
      id: 'development',
      name: '展開科目',
      creditsRequired: 74,
      notes: '社会接続科目は最大10単位まで算入',
      isGeneralDevelopmentCategory: true,
      subChecks: [
        {
          id: 'devCombinedBasicLiteracy',
          name: '基盤リテラシー科目（基礎科目と合わせて）',
          creditsRequired: 8,
          identification: { startsWith: ['INF-', 'MTH-'] },
          includeBasicCategoryIds: ['basicMath', 'basicInfo']
        },
        {
          id: 'devCombinedMultiInfoComp',
          name: '多言語情報理解科目（基礎科目と合わせて）',
          creditsRequired: 8,
          identification: { startsWith: ['LAN-'] },
          includeBasicCategoryIds: ['basicMultilingualITComm']
        }
        // ここに他のsubChecksやsubSubChecksを追加可能
      ]
    }
  ]
};

// 実際に参照される「現在の要件」。起動時はデフォルトをクローン
let currentRequirements = structuredClone(DEFAULT_GRADUATION_REQUIREMENTS);

// 現在の要件設定を返す
export function getRequirements() { return currentRequirements; }

// 要件設定を差し替え、表示テキストエリアも更新
export function setRequirements(obj) {
  currentRequirements = obj;
  updateRequirementsTextarea();
}

// 外部 JSON（assets/卒業要件.json）を読み込み。失敗時はデフォルトを適用
export async function loadExternalRequirements(path = './assets/卒業要件.json') {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`卒業要件の読み込みに失敗: ${res.status}`);
    const json = await res.json();
    setRequirements(json);
  } catch (e) {
    console.warn('外部要件の読み込みに失敗。デフォルト適用:', e);
    setRequirements(structuredClone(DEFAULT_GRADUATION_REQUIREMENTS));
  }
}

// 現在の要件 JSON をダウンロード（ファイル名: 卒業要件.json）
export function exportRequirements() {
  const blob = new Blob([JSON.stringify(currentRequirements, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '卒業要件.json'; a.click();
  URL.revokeObjectURL(url);
}

// アップロードされた JSON ファイルから要件を適用
export async function importRequirementsFromFile(file) {
  const text = await file.text();
  const json = JSON.parse(text);
  setRequirements(json);
}

// デフォルト要件に戻す
export function resetRequirements() {
  setRequirements(structuredClone(DEFAULT_GRADUATION_REQUIREMENTS));
}

// 画面のテキストエリアへ現在の要件を整形表示
export function updateRequirementsTextarea() {
  const textarea = document.getElementById('currentRequirementsTextarea');
  if (textarea) textarea.value = JSON.stringify(currentRequirements, null, 2);
}

// 旧実装互換の識別ルール
// startsWith / courseCodes / subjectCategoryIdsFromRaw のいずれかで判定
function courseMatchesIdentification(course, rules) {
  if (!rules) return false;
  if (rules.startsWith && rules.startsWith.some(p => course.code?.startsWith(p))) return true;
  if (rules.courseCodes && rules.courseCodes.includes(course.code)) return true;
  if (rules.subjectCategoryIdsFromRaw && course.rawCourseData?.subjectCategoryIds) {
    if (rules.subjectCategoryIdsFromRaw.some(id => course.rawCourseData.subjectCategoryIds.includes(id))) return true;
  }
  return false;
}

// 旧実装互換の判定メイン
// 選択中の講義配列から、総単位・カテゴリ・サブチェックの達成状況を集計
export function computeGraduationStatus(selectedCourses, config = currentRequirements) {
  if (!config || !config.categories) {
    return { overallMet: false, total: { req: config?.totalCreditsRequired ?? 124, achieved: 0, met: false, courses: [], details: '設定エラー' }, categories: {} };
  }

  const status = {
    total: { req: config.totalCreditsRequired ?? 124, achieved: 0, met: false, courses: [], details: '' },
    categories: {},
    overallMet: false
  };

  // 構造初期化
  for (const cat of config.categories) {
    status.categories[cat.id] = {
      name: cat.name,
      req: cat.creditsRequired ?? 0,
      achieved: 0,
      met: false,
      courses: [],
      details: '',
      isGeneralDevelopmentCategory: !!cat.isGeneralDevelopmentCategory,
      notes: cat.notes || ''
    };
    if (cat.subCategories) {
      status.categories[cat.id].subCategories = {};
      for (const sub of cat.subCategories) {
        status.categories[cat.id].subCategories[sub.id] = { name: sub.name, req: sub.creditsRequired ?? 0, achieved: 0, met: false, courses: [] };
      }
    }
    if (cat.subChecks) {
      status.categories[cat.id].subChecks = {};
      for (const sc of cat.subChecks) {
        status.categories[cat.id].subChecks[sc.id] = { name: sc.name, req: sc.creditsRequired ?? 0, max: sc.creditsMax, achieved: 0, achievedCounted: 0, met: false, courses: [], description: sc.description || '', includeBasicCategoryIds: sc.includeBasicCategoryIds || {} };
        if (sc.subSubChecks) {
          status.categories[cat.id].subChecks[sc.id].subSubChecks = {};
          for (const ssc of sc.subSubChecks) {
            status.categories[cat.id].subChecks[sc.id].subSubChecks[ssc.id] = { name: ssc.name, req: ssc.creditsRequired ?? 0, achieved: 0, met: false, courses: [] };
          }
        }
      }
    }
  }

  const developmentCat = config.categories.find(c => c.isGeneralDevelopmentCategory);
  const developmentId = developmentCat?.id;
  const developmentCourses = [];

  // コース分類
  for (const course of selectedCourses) {
    if (config.exclusionPrefixes && config.exclusionPrefixes.some(p => course.code?.startsWith(p))) continue;
    let categorized = false;
    for (const cat of config.categories) {
      if (cat.identification && courseMatchesIdentification(course, cat.identification)) {
        status.categories[cat.id].achieved += course.credits || 0;
        status.categories[cat.id].courses.push(course);
        categorized = true; break;
      }
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          if (courseMatchesIdentification(course, sub.identification)) {
            status.categories[cat.id].subCategories[sub.id].achieved += course.credits || 0;
            status.categories[cat.id].subCategories[sub.id].courses.push(course);
            status.categories[cat.id].achieved += course.credits || 0;
            status.categories[cat.id].courses.push(course);
            categorized = true; break;
          }
        }
        if (categorized) break;
      }
    }
    if (!categorized && developmentId) {
      developmentCourses.push(course);
      status.categories[developmentId].achieved += course.credits || 0;
      status.categories[developmentId].courses.push(course);
    }
  }

  // 展開科目のsubChecks
  if (developmentId && status.categories[developmentId].subChecks) {
    const devCatStatus = status.categories[developmentId];
    const devDef = config.categories.find(c => c.id === developmentId);
    for (const course of developmentCourses) {
      for (const sc of devDef.subChecks) {
        if (courseMatchesIdentification(course, sc.identification)) {
          const entry = devCatStatus.subChecks[sc.id];
          entry.achieved += course.credits || 0;
          entry.courses.push(course);
          if (sc.subSubChecks) {
            for (const ssc of sc.subSubChecks) {
              if (courseMatchesIdentification(course, ssc.identification)) {
                const sscEntry = entry.subSubChecks[ssc.id];
                sscEntry.achieved += course.credits || 0;
                sscEntry.courses.push(course);
              }
            }
          }
        }
      }
    }

    // 基礎との合算や上限
    for (const [scId, entry] of Object.entries(devCatStatus.subChecks)) {
      // includeBasicCategoryIdsを合算
      const scDef = devDef.subChecks.find(x => x.id === scId);
      let combined = entry.achieved;
      if (scDef?.includeBasicCategoryIds && status.categories.basic?.subCategories) {
        for (const bid of scDef.includeBasicCategoryIds) {
          combined += status.categories.basic.subCategories[bid]?.achieved || 0;
        }
      }
      // 上限適用
      entry.achievedCounted = typeof entry.max === 'number' ? Math.min(combined, entry.max) : combined;
      entry.met = entry.achievedCounted >= (entry.req ?? 0);
    }

    // 展開科目のカテゴリ合計から、上限を超えた社会接続等の超過分を差し引く
    let reduceDevCredits = 0;
    for (const sc of devDef.subChecks || []) {
      if (typeof sc.creditsMax !== 'number') continue;
      const entry = devCatStatus.subChecks[sc.id];
      if (!entry) continue;
      // 開発側貢献（展開コース由来）の実測
      const devFromThisSub = entry.achieved || 0;
      // 基礎の合算分（上限に対して消費）
      let basicIncluded = 0;
      if (sc.includeBasicCategoryIds && status.categories.basic?.subCategories) {
        for (const bid of sc.includeBasicCategoryIds) {
          basicIncluded += status.categories.basic.subCategories[bid]?.achieved || 0;
        }
      }
      const allowedDev = Math.max(0, sc.creditsMax - Math.min(basicIncluded, sc.creditsMax));
      const effectiveDev = Math.min(devFromThisSub, allowedDev);
      const excess = Math.max(0, devFromThisSub - effectiveDev);
      reduceDevCredits += excess;
    }
    if (reduceDevCredits > 0) {
      devCatStatus.achieved = Math.max(0, (devCatStatus.achieved || 0) - reduceDevCredits);
    }
  }

  // met判定と合計
  let total = 0;
  for (const [catId, cat] of Object.entries(status.categories)) {
    // subCategoriesのmet
    if (cat.subCategories) {
      for (const sub of Object.values(cat.subCategories)) {
        sub.met = (sub.achieved >= (sub.req ?? 0));
      }
    }
    // subChecksのmet（上で済）
    // カテゴリ達成
    cat.met = (cat.achieved >= (cat.req ?? 0));
    // 合計単位
    total += cat.achieved;
  }
  status.total.achieved = total;
  status.total.met = total >= status.total.req;
  status.overallMet = status.total.met; // 詳細条件が増える場合はここでAND
  return status;
}
