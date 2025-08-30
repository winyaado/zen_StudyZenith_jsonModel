/*
  初学者向けガイド（tabs.js）
  ------------------------------------------------------------
  タブボタンのクリックに応じて、対応するコンテンツの表示/非表示を切り替えます。
  - ボタンは data-tab="..." で、表示したいコンテンツの id と対応させます。
  - .hidden クラスの付け外しで可視状態を制御します。
  - 切り替え時のフック（onTabChange）を呼び出し、必要な再描画を行えるようにします。
*/
export function setupTabs(onTabChange) {
  const tabs = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // すべてのタブから active を外し、押したタブだけ active
      tabs.forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      tabContents.forEach(content => {
        // id が一致するコンテンツだけ表示、それ以外は .hidden で非表示
        content.classList.toggle('hidden', content.id !== targetTab);
      });
      onTabChange?.(targetTab);
    });
  });
}
