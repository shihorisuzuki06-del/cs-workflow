# CSワークフロー提案ツール

CS（カスタマーサポート）チームの問い合わせ対応を支援するツールです。OpenRouter経由のAIが過去の対応事例をもとに、最適な対応手順を提案します。

## 機能

- **対応提案タブ**: 問い合わせ内容を入力すると、AIが過去事例を参考にステップバイステップの対応手順を提案
- **事例一覧タブ**: 保存済みの対応事例をキーワード検索・カテゴリフィルタで閲覧
- **フロー図タブ**: 選択した事例の対応ステップを横方向の矢印フロー図で可視化

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、OpenRouter APIキーを設定してください。

```bash
cp .env.example .env
```

`.env` を編集:
```
CS_FLOW_OPENROUTER_KEY=your-actual-openrouter-api-key
```

APIキーは [OpenRouter](https://openrouter.ai/keys) から取得できます。

> APIキーは `CS_FLOW_OPENROUTER_KEY`（`VITE_` プレフィックスなし）で管理します。
> `VITE_` プレフィックスを付けるとビルド成果物にキーが埋め込まれてしまうため、
> サーバーサイド（Netlify Functions）でのみ参照する構成にしています。

### 3. 開発サーバーの起動

Netlify CLI を使って起動してください（Netlify Functions も同時に動作します）。

```bash
npm install -g netlify-cli
netlify dev
```

## Netlify へのデプロイ

### 方法1: Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### 方法2: GitHub連携

1. GitHubリポジトリにプッシュ
2. [Netlify](https://app.netlify.com/) でリポジトリを連携
3. Build command: `npm run build`
4. Publish directory: `dist`
5. **Environment variables** に `CS_FLOW_OPENROUTER_KEY` を設定

> ⚠️ APIキーはNetlifyの環境変数に設定し、`.env`ファイルはGitにコミットしないでください。
> `VITE_` プレフィックスは付けないでください（付けるとJSバンドルにキーが埋め込まれます）。

## データ保存

すべての対応事例はブラウザの `localStorage` に保存されます。初回起動時にサンプルデータ（3件）が自動登録されます。

## 技術スタック

- **フロントエンド**: React + Vite
- **スタイリング**: Tailwind CSS
- **AI**: OpenRouter API (`google/gemini-2.0-flash-001`、raw fetch)
- **データ保存**: localStorage
