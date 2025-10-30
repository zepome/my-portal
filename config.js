/* ========================================
   Google API Configuration
   ======================================== */

// Google API設定
const API_KEY = 'AIzaSyC5Y06zUZzRRXgHy1scrCH5Li4qldb0Izo';
const CLIENT_ID = '335218274143-hn0lfceok6fjtuv8udv0s8jodrs55vnn.apps.googleusercontent.com';

// API Scopes
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks';

// LocalStorageキー
const STORAGE_KEYS = {
    todos: 'myPortalTodos',
    lastUpdate: 'myPortalLastUpdate',
    authToken: 'myPortalAuthToken'
};

// 気象庁API エンドポイント
const WEATHER_API = {
    shiga: 'https://www.jma.go.jp/bosai/forecast/data/forecast/250000.json',
    osaka: 'https://www.jma.go.jp/bosai/forecast/data/forecast/270000.json',
    tokyo: 'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json'
};

// Google APIが設定されているかチェック
function isGoogleAPIConfigured() {
    return API_KEY !== 'YOUR_API_KEY_HERE' && 
           CLIENT_ID !== 'YOUR_CLIENT_ID_HERE';
}
