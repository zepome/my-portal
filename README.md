# 🚀 Personal Portal - ダークモード版

モダンなダークテーマの個人用ポータルサイトです。天気情報、カレンダー、Todo管理、スプレッドシート表示、タイマー/ストップウォッチなどの機能を統合しています。

## ✨ 機能

### 📊 ダッシュボード
- **リアルタイム時計**: 現在時刻を常に表示
- **Gmail未読数**: 未読メール件数の表示（要Google API設定）
- **ダークモードUI**: 目に優しい黒背景にネオンカラーのアクセント

### 🌤️ 天気情報
- 滋賀県、大阪府、東京都の天気予報
- 気象庁APIからリアルタイムデータ取得
- タブで簡単に地域切り替え

### 📅 カレンダー
- 月次カレンダー表示
- Todoの期日を自動的に表示
- 時間情報も含めた予定表示（例: 「10:00 資料作成」）
- 今日の予定を別ウィジェットで詳細表示

### ✅ Todoリスト
- タスクの作成・管理
- グループ分け機能（仕事、個人、買い物など）
- 期日・時間設定
- カレンダーへの自動反映機能
- 完了/未完了のチェック

### 📊 スプレッドシート
- 複数のGoogleスプレッドシートを表示
- タブで簡単に切り替え
- URLを貼り付けるだけで自動ID抽出

### ⏱️ タイマー/ストップウォッチ
- タイマーとストップウォッチの切り替え
- 0.1秒単位の表示（00:00:00.0形式）
- 一時停止・リセット機能

## 🛠️ セットアップ

### 1. ファイル構成

```
portal/
├── index.html      # メインHTML
├── style.css       # スタイルシート
├── script.js       # JavaScriptロジック
├── config.js       # 設定ファイル
└── README.md       # このファイル
```

### 2. GitHub Pagesで公開

#### 手順1: GitHubリポジトリ作成
1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」
3. リポジトリ名を入力（例: `my-portal`）
4. 「Public」を選択
5. 「Create repository」をクリック

#### 手順2: ファイルをアップロード
1. 作成したリポジトリを開く
2. 「uploading an existing file」をクリック
3. すべてのファイル（index.html, style.css, script.js, config.js）をドラッグ&ドロップ
4. 「Commit changes」をクリック

#### 手順3: GitHub Pagesを有効化
1. リポジトリの「Settings」タブを開く
2. 左メニューの「Pages」をクリック
3. 「Source」で「Deploy from a branch」を選択
4. 「Branch」で「main」を選択し、「/ (root)」を選択
5. 「Save」をクリック

#### 手順4: URLにアクセス
数分後、以下のURLでアクセス可能になります:
```
https://[あなたのユーザー名].github.io/[リポジトリ名]/
```

### 3. Google API設定（オプション）

Gmail未読数やGoogle Calendar連携を使用する場合:

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. Calendar API、Tasks API、Gmail APIを有効化
3. 認証情報でAPIキーとOAuthクライアントIDを作成
4. `config.js`の以下を編集:

```javascript
API_KEY: 'あなたのAPIキー',
CLIENT_ID: 'あなたのクライアントID.apps.googleusercontent.com',
```

**注意**: 現在はローカルストレージでTodoを管理しているため、Google API設定なしでも基本機能は動作します。

## 🎨 カスタマイズ

### 色の変更
`style.css`の`:root`セクションで色をカスタマイズできます:

```css
:root {
    --neon-blue: #00d4ff;      /* メインアクセント */
    --neon-purple: #b84fff;    /* セカンダリ */
    --neon-pink: #ff006e;      /* 強調 */
    --neon-green: #00ff88;     /* 成功 */
}
```

### 天気の地域追加
`config.js`で地域を追加できます:

```javascript
WEATHER_API: {
    shiga: 'https://www.jma.go.jp/bosai/forecast/data/forecast/250000.json',
    // 他の地域を追加...
}
```

地域コードは[気象庁API](https://www.jma.go.jp/bosai/common/const/area.json)で確認できます。

## 📱 レスポンシブ対応

- デスクトップ: 3カラムレイアウト
- タブレット: 1カラムレイアウト
- スマートフォン: 縦スクロール対応

## 🔒 プライバシー

- すべてのTodoデータはブラウザのLocalStorageに保存されます
- 外部サーバーにデータは送信されません
- 天気情報は気象庁の公開APIを使用

## 🐛 トラブルシューティング

### 天気情報が表示されない
- ブラウザのコンソールでエラーを確認
- CORS制限の可能性（ローカルで開いている場合）
- GitHub Pagesで公開すると解決します

### スプレッドシートが表示されない
- スプレッドシートの共有設定を「リンクを知っている全員」に変更
- URLが正しいか確認

### データが消える
- LocalStorageは同一ドメインでのみ保持されます
- ブラウザのキャッシュをクリアするとデータが消えます
- 重要なデータは別途バックアップを推奨

## 📝 今後の拡張案

- [ ] データのエクスポート/インポート機能
- [ ] Google Tasks APIとの完全連携
- [ ] ダークモード/ライトモードの切り替え
- [ ] ドラッグ&ドロップでのウィジェット配置変更
- [ ] ポモドーロタイマー機能
- [ ] RSSフィード表示
- [ ] メモ機能

## 📄 ライセンス

MIT License - 自由に改変・利用してください！

## 🙏 サポート

質問や要望があれば、GitHubのIssuesでお知らせください。

---

**Enjoy your personal portal! 🚀**