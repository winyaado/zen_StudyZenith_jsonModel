# 学習管理ページ（StudyZenith）

履修科目の検索・選択、卒業要件の達成状況チェック、選択内容の共有リンク作成ができるシンプルなフロントエンドです。ブラウザだけで動作し、サーバーサイドは不要です。

> 注意: 掲載されている科目データ・要件定義の正確性は保証しません。必ず学生便覧や公式資料で最終確認してください。

---

## できること

- 講義検索とフィルタ: キーワード、カテゴリ（プレフィックス）、クオーターで絞り込み
- 履修中リスト管理: 追加/削除、フィルタ、検索
- 卒業要件チェック: JSON 定義に基づく達成状況を表示（総単位・カテゴリ・サブチェック等）
- データの入出力: 選択中の科目コードをテキストでエクスポート/インポート
- 卒業要件の入出力: 現在の要件 JSON をエクスポート/インポート、デフォルトへリセット
- 共有リンク生成: タイトル/コメント付きの閲覧専用ページ（`share.html`）へのリンクを生成

---

## クイックスタート

このフォルダ（公開用）をリポジトリのルートとして GitHub にアップロードしてください。

### 1) ローカルで確認する

ES Modules と `fetch` を利用しているため、`file://` 直開きでは動作しない場合があります。簡易サーバーで配信して確認してください（どちらか1つ）。

- Python
  ```bash
  # ルート（この README と同じ階層）で実行
  python -m http.server 5500
  # http://localhost:5500 を開く
  ```
- Node.js（npx）
  ```bash
  npx serve -l 5500 .
  # または
  npx http-server -p 5500 .
  ```

ブラウザで `http://localhost:5500/index.html` を開きます。

> Tailwind CDN / Google Fonts を読み込むため、インターネット接続が必要です。

### 2) GitHub Pages で公開する

1. このフォルダの中身をそのままリポジトリ直下に配置して push
2. GitHub の `Settings` → `Pages` → `Branch` を `main`（または既定ブランチ）/`root` に設定
3. 発行URL（例: `https://<your-account>.github.io/<repo>/`）にアクセス
   - 共有リンクは `share.html` を使います（例: `https://<your-account>.github.io/<repo>/share.html?p=...`）

---

## 使い方（画面タブ）

- 講義選択: 検索/カテゴリ/クオーターで絞り込み、「履修追加」で右タブへ追加
- 履修中講義: 追加済み講義の一覧。検索/フィルタ、不要なものは削除
- 卒業要件チェック: JSON 要件に基づく達成状況（総単位・カテゴリ・サブチェック等）を表示
- データ管理: 科目コードのエクスポート/インポートで選択状態を保存・復元
- 卒業要件管理: 要件 JSON のエクスポート/インポート、現在適用中 JSON の閲覧、デフォルトへリセット
- 共有: タイトル/コメント（任意）を付けて共有リンクを生成。リンク先は閲覧専用（`share.html`）

---

## ディレクトリ構成

```
├─ index.html        # メイン画面
├─ share.html        # 共有リンクの閲覧専用ページ
├─ css/
│   └─ styles.css
├─ js/
│   ├─ main.js            # 初期化、イベント束ね
│   ├─ render.js          # 画面描画（講義一覧/履修中/要件表示）
│   ├─ data.js            # courses.json のロード
│   ├─ state.js           # 選択状態の保存/復元
│   ├─ filters.js         # 検索・カテゴリ・クオーターのフィルタUI
│   ├─ requirements.js    # 卒業要件の管理と判定ロジック
│   ├─ share.js           # 共有URLの作成/解析
│   └─ tabs.js            # タブの切り替え
└─ assets/
    ├─ courses.json       # 講義データ
    ├─ 卒業要件.json         # 外部の要件定義（なければデフォルトを適用）
```

---

## データと要件定義

- `assets/courses.json`
  - 例: `{ code, name, credits, description, prefix, quarters, ... }`
  - コード先頭の英字（例: `INT-`, `INF-` など）を「カテゴリ（プレフィックス）」として利用します。
- `assets/卒業要件.json`
  - 読み込みに失敗した場合は `requirements.js` の `DEFAULT_GRADUATION_REQUIREMENTS` を適用します。
  - 構造（例）: `totalCreditsRequired`, `categories`（`subCategories`, `subChecks`, `subSubChecks` を含み得る）, `exclusionPrefixes` など。

---

## 共有リンク仕様（概要）

- `share.html?p=...` のクエリに Base64URL で JSON をパックして埋め込みます。
- JSON 例: `{ v: 1, s: ["CODE1", "CODE2"], t: "タイトル", c: "コメント" }`
  - `s`: 科目コード配列、`t`: タイトル（最大80文字）、`c`: コメント（最大512文字）
- 表示時は安全のためテキストとして扱い、危険な文字はエスケープされます。

---

## 開発メモ

- 依存関係: ランタイムはブラウザのみ。CSS は Tailwind CDN、フォントは Google Fonts を利用（オフライン非対応）。
- 動作環境: 最新の Chromium/Firefox/Safari を想定。
- ビルド不要: そのまま静的配信で動作します（ローカルでは簡易サーバー推奨）。

---


