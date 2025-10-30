# Google Tasks API対応版 - 完全ガイド

## 📦 ダウンロード

**Google Tasks API対応版（最新）:**

🔗 **[my-portal-with-tasks.zip をダウンロード](リンクは後で提供)**

**含まれるファイル:**
- `config.js` - Google API設定（変更なし）
- `index.html` - スクリプト読み込み順序修正済み
- `script.js` - **Google Tasks API対応版**
- `style.css` - CSSファイル（変更なし）

---

## ✨ 新機能: Google Tasks API対応

### **追加された機能:**
1. ✅ TodoをGoogle Tasksに自動同期
2. ✅ TodoをGoogleカレンダーに自動同期（既存機能）
3. ✅ Gmail未読数表示（既存機能）

### **同期先:**
- **ブラウザのLocalStorage**（ポータルサイト内）
- **Googleカレンダー**（予定として登録）
- **Google Tasks**（タスクとして登録）← **NEW!**

---

## 🔧 追加・修正した内容

### **修正1: Google Tasks APIの初期化（script.js 962-977行目）**

**変更前:**
```javascript
await gapi.client.init({
    apiKey: CONFIG.API_KEY,
    discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
    ]
});
```

**変更後:**
```javascript
await gapi.client.init({
    apiKey: CONFIG.API_KEY,
    discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'  // ← 追加
    ]
});
```

---

### **追加2: Google Tasks追加関数（script.js 1115-1157行目）**

**新規追加:**
```javascript
async function addToGoogleTasks(todo) {
    if (!isGoogleAPIConfigured() || !gapiInited || !accessToken) {
        console.log('Google Tasks API not configured');
        return false;
    }
    
    try {
        const task = {
            title: todo.title,
            notes: todo.notes || ''
        };
        
        // 期限がある場合は設定
        if (todo.dueDate) {
            const dueDateTime = new Date(todo.dueDate);
            task.due = dueDateTime.toISOString();
        }
        
        const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            console.log('✅ Google Tasksに追加されました');
            return true;
        } else {
            const errorData = await response.json();
            console.error('❌ Google Tasksへの追加に失敗:', errorData);
            return false;
        }
    } catch (error) {
        console.error('Google Tasks add error:', error);
        return false;
    }
}
```

---

### **修正3: saveTodo関数（script.js 596-643行目）**

**変更前:**
```javascript
// Googleカレンダーにも追加
if (newTodo.dueDate && isGoogleAPIConfigured()) {
    addToGoogleCalendar(newTodo).then(success => {
        if (success) {
            console.log('✅ Googleカレンダーに追加されました');
        }
    });
}
```

**変更後:**
```javascript
// Googleカレンダーにも追加
if (newTodo.dueDate && isGoogleAPIConfigured()) {
    addToGoogleCalendar(newTodo).then(calendarSuccess => {
        if (calendarSuccess) {
            console.log('✅ Googleカレンダーに追加されました');
        } else {
            console.log('⚠️ Googleカレンダーへの追加に失敗しました。');
        }
    });
    
    // Google Tasksにも追加
    addToGoogleTasks(newTodo).then(tasksSuccess => {
        if (tasksSuccess) {
            console.log('✅ Google Tasksに追加されました');
        } else {
            console.log('⚠️ Google Tasksへの追加に失敗しました。');
        }
    });
}
```

---

### **修正4: updateTodo関数（script.js 646-690行目）**

saveTodo関数と同様に、Google Tasksへの同期処理を追加しました。

---

## 🚀 セットアップ手順

### **ステップ1: Google Tasks APIを有効化**

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニュー「**APIとサービス**」→「**ライブラリ**」
4. 検索ボックスに「**Tasks**」と入力
5. **「Google Tasks API」**をクリック
6. **「有効にする」**ボタンをクリック
7. 有効化完了まで**1〜2分待つ**

---

### **ステップ2: ファイルをダウンロード**

1. 上記リンクから`my-portal-with-tasks.zip`をダウンロード
2. ZIPファイルを解凍
3. 4つのファイルがあることを確認

---

### **ステップ3: GitHubにアップロード**

#### **方法: 個別ファイルを上書き**

**script.jsを上書き（最重要）:**
1. https://github.com にアクセス → `my-portal`リポジトリを開く
2. `script.js`をクリック
3. 右上の**鉛筆アイコン（✏️）**をクリック
4. 内容を**すべて削除**（Ctrl+A → Delete）
5. 解凍した`script.js`の内容を**コピー＆ペースト**
6. **「Commit changes」**をクリック
7. コミットメッセージ: `Add Google Tasks API support`
8. **「Commit changes」**をクリック

**index.html（まだアップロードしていない場合）:**
- 前回と同じ方法でアップロード

**config.js、style.css:**
- 変更なし（既にアップロード済みならスキップ）

---

### **ステップ4: デプロイ待機**
- **3〜5分待つ**

---

### **ステップ5: ブラウザのキャッシュをクリア**
1. **Ctrl+Shift+Delete**（Mac: Cmd+Shift+Delete）
2. 期間: **全期間**
3. **「データを削除」**をクリック

---

### **ステップ6: 動作確認**

#### 6-1. ポータルサイトにアクセス
1. https://zepome.github.io/my-portal/ を開く
2. **Ctrl+Shift+R**でスーパーリロード

#### 6-2. コンソールで確認
1. **F12キー**を押す
2. **「Console」タブ**をクリック
3. 以下のログが表示されるか確認:
   - ✅ 「GAPI client initialized (Gmail, Calendar, Tasks)」← **NEW!**

#### 6-3. 認証（まだの場合）
1. **💌アイコン**をクリック
2. 認証を完了（前回と同じ手順）

#### 6-4. Todo追加テスト
1. Todoリストで「**追加**」ボタンをクリック
2. 以下を入力:
   - **タスク名**: 「Google Tasks同期テスト」
   - **期限**: 今日の日付
   - **時間**: 「16:00」
   - **メモ**: 「テストです」
3. **「保存」**をクリック
4. **コンソールを確認**:
   - ✅ 「✅ Googleカレンダーに追加されました」
   - ✅ 「✅ Google Tasksに追加されました」← **NEW!**

#### 6-5. Google Tasksで確認
1. 新しいタブで https://tasks.google.com/ を開く
2. 「マイタスク」を選択
3. **「Google Tasks同期テスト」というタスクが追加されている**
4. タスクをクリックして詳細を確認:
   - タイトル: 「Google Tasks同期テスト」
   - 日付: 今日の日付
   - メモ: 「テストです」

#### 6-6. Googleカレンダーで確認
1. https://calendar.google.com/ を開く
2. 今日の16:00に「Google Tasks同期テスト」が追加されている

---

## ✅ 成功の確認

すべて正常に動作している状態:

- ✅ コンソールに「GAPI client initialized (Gmail, Calendar, Tasks)」と表示
- ✅ Todoを追加すると「✅ Google Tasksに追加されました」と表示
- ✅ Google Tasksにタスクが追加される
- ✅ Googleカレンダーに予定が追加される
- ✅ Gmail未読数が表示される

---

## ⚠️ トラブルシューティング

### **問題1: 「Google Tasks API not configured」と表示される**

**原因:** Google Tasks APIが有効化されていない

**対処法:**
1. Google Cloud Console → APIとサービス → ライブラリ
2. 「Google Tasks API」を検索
3. **「有効にする」**をクリック
4. **5分待つ**
5. ブラウザのキャッシュをクリア
6. ポータルサイトをリロード
7. 再度Todoを追加してテスト

---

### **問題2: 「Tasks API has not been used in project」エラー**

**原因:** Google Tasks APIが有効化されたばかりで、まだ反映されていない

**対処法:**
- **10分待つ**
- ブラウザをすべて閉じて再起動
- 再度認証からやり直す

---

### **問題3: Googleカレンダーには同期されるが、Tasksには同期されない**

**確認事項:**
1. コンソールに「⚠️ Google Tasksへの追加に失敗しました」と表示されているか
2. 認証時に「Google Tasksへのアクセス」を許可したか

**対処法:**
- 💌アイコンをクリックして再認証
- アクセス許可画面で「Google Tasks」の権限を確認

---

### **問題4: 「Access blocked: This app's request is invalid」**

**原因:** OAuth同意画面のスコープ設定が不完全

**対処法:**
1. Google Cloud Console → OAuth同意画面
2. 「アプリを編集」をクリック
3. 「スコープ」セクションに進む
4. 以下がすべて追加されているか確認:
   - `.../auth/gmail.readonly`
   - `.../auth/calendar`
   - `.../auth/tasks` ← **これが必要**
5. なければ「スコープを追加または削除」で追加
6. 「保存して次へ」で完了
7. 10分待ってから再認証

---

## 📊 同期の仕組み

### **Todoを追加したとき:**

```
ユーザーがTodoを保存
    ↓
ポータルサイトのLocalStorageに保存
    ↓
┌─────────────────┬─────────────────┐
│                 │                 │
↓                 ↓                 ↓
Googleカレンダー   Google Tasks    ブラウザに表示
（予定として）     （タスクとして）
```

### **保存される内容:**

| 項目 | LocalStorage | Googleカレンダー | Google Tasks |
|-----|-------------|----------------|-------------|
| タスク名 | ✅ | ✅（予定のタイトル） | ✅（タスクのタイトル） |
| 期限 | ✅ | ✅（予定の日時） | ✅（タスクの期限） |
| 時間 | ✅ | ✅（開始時刻） | ❌（Tasksは時刻非対応） |
| グループ | ✅ | ❌ | ❌ |
| メモ | ✅ | ✅（予定の説明） | ✅（タスクのメモ） |
| 完了状態 | ✅ | ❌ | ❌ |

---

## 📝 変更内容まとめ

| ファイル | 変更内容 | 追加機能 |
|---------|---------|---------|
| `script.js` | Google Tasks API初期化を追加 | ✅ |
| `script.js` | `addToGoogleTasks()`関数を追加 | ✅ |
| `script.js` | `saveTodo()`関数を修正 | ✅ |
| `script.js` | `updateTodo()`関数を修正 | ✅ |
| `index.html` | 変更なし（前回修正済み） | - |
| `config.js` | 変更なし | - |
| `style.css` | 変更なし | - |

**指示されていない機能: 一切追加していません**
**既存機能: すべて維持されています**

---

## 📞 完了報告

動作確認が完了したら教えてください:

**成功した場合:**
- 「✅ Google Tasksへの同期が成功しました！」
- Google Tasksのスクリーンショット（任意）

**問題がある場合:**
- コンソールのエラーメッセージ
- どのステップで問題が発生したか

---

これでGoogleカレンダーとGoogle Tasksの両方に同期されるようになりました！🎉
