/* ========================================
   Personal Portal - Main Script
   ======================================== */

// グローバル変数
let gapiInited = false;
let gisInited = false;
let tokenClient;
let accessToken = null;

// 現在の状態
let currentWeatherLocation = 'shiga';
let currentMonth = new Date();
let currentTimerMode = 'timer';
let timerInterval = null;
let timerSeconds = 0;
let stopwatchSeconds = 0;
let isTimerRunning = false;
let isStopwatchRunning = false;

// データストレージ
let spreadsheets = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPREADSHEETS) || '[]');
let todoGroups = JSON.parse(localStorage.getItem(STORAGE_KEYS.TODO_GROUPS) || '["仕事", "個人", "買い物"]');
let calendarEvents = [];
let todos = [];

/* ========================================
   初期化
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 天気情報読み込み
    loadWeather(currentWeatherLocation);
    
    // カレンダー初期化
    renderCalendar();
    
    // スプレッドシート初期化
    renderSpreadsheetTabs();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // Google API初期化（設定されている場合）
    if (isGoogleAPIConfigured()) {
        gapiLoaded();
        gisLoaded();
    } else {
        showSetupModal();
    }
});

function initializeUI() {
    console.log('Portal initialized');
}

function showSetupModal() {
    // 実際の運用では設定モーダルを表示
    console.warn('Google API設定が必要です。config.jsを編集してください。');
}

/* ========================================
   時計更新
   ======================================== */

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

/* ========================================
   イベントリスナー設定
   ======================================== */

function setupEventListeners() {
    // 天気タブ
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeatherLocation = btn.dataset.location;
            loadWeather(currentWeatherLocation);
        });
    });
    
    // タイマー/ストップウォッチ切り替え
    document.getElementById('timerBtn').addEventListener('click', () => switchTimerMode('timer'));
    document.getElementById('stopwatchBtn').addEventListener('click', () => switchTimerMode('stopwatch'));
    
    // タイマーコントロール
    document.getElementById('timerStart').addEventListener('click', toggleTimer);
    document.getElementById('timerReset').addEventListener('click', resetTimer);
    
    // ストップウォッチコントロール
    document.getElementById('stopwatchStart').addEventListener('click', toggleStopwatch);
    document.getElementById('stopwatchReset').addEventListener('click', resetStopwatch);
    
    // カレンダーナビゲーション
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    
    // Todoモーダル
    document.getElementById('addTodoBtn').addEventListener('click', openTodoModal);
    document.getElementById('closeTodoModal').addEventListener('click', closeTodoModal);
    document.getElementById('cancelTodo').addEventListener('click', closeTodoModal);
    document.getElementById('saveTodo').addEventListener('click', saveTodo);
    
    // Todoグループ選択
    document.getElementById('todoGroup').addEventListener('change', function() {
        if (this.value === '__new__') {
            const newGroup = prompt('新しいグループ名を入力してください:');
            if (newGroup && newGroup.trim()) {
                todoGroups.push(newGroup.trim());
                localStorage.setItem(STORAGE_KEYS.TODO_GROUPS, JSON.stringify(todoGroups));
                updateTodoGroupOptions();
                this.value = newGroup.trim();
            } else {
                this.value = '';
            }
        }
    });
    
    // スプレッドシートモーダル
    document.getElementById('addSheetBtn').addEventListener('click', openSheetModal);
    document.getElementById('closeSheetModal').addEventListener('click', closeSheetModal);
    document.getElementById('cancelSheet').addEventListener('click', closeSheetModal);
    document.getElementById('saveSheet').addEventListener('click', saveSpreadsheet);
    
    // モーダル外クリックで閉じる
    document.getElementById('todoModal').addEventListener('click', (e) => {
        if (e.target.id === 'todoModal') closeTodoModal();
    });
    document.getElementById('sheetModal').addEventListener('click', (e) => {
        if (e.target.id === 'sheetModal') closeSheetModal();
    });
}

/* ========================================
   天気情報
   ======================================== */

async function loadWeather(location) {
    const weatherContent = document.getElementById('weatherContent');
    weatherContent.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const response = await fetch(CONFIG.WEATHER_API[location]);
        const data = await response.json();
        
        const todayForecast = data[0].timeSeries[0];
        const area = todayForecast.areas[0];
        
        const locationNames = {
            'shiga': '滋賀県',
            'osaka': '大阪府',
            'tokyo': '東京都'
        };
        
        const weatherHTML = `
            <div class="weather-info">
                <div class="weather-location">${locationNames[location]}</div>
                <div class="weather-description">${area.weathers[0]}</div>
                <div class="weather-details">
                    <div class="weather-detail-item">
                        <span class="label">降水確率</span>
                        <span class="value">${data[0].timeSeries[1]?.areas[0]?.pops[0] || '-'}%</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="label">風</span>
                        <span class="value">${area.winds[0]}</span>
                    </div>
                </div>
            </div>
        `;
        
        weatherContent.innerHTML = weatherHTML;
    } catch (error) {
        console.error('Weather fetch error:', error);
        weatherContent.innerHTML = '<div class="loading">天気情報の取得に失敗しました</div>';
    }
}

/* ========================================
   タイマー/ストップウォッチ
   ======================================== */

function switchTimerMode(mode) {
    currentTimerMode = mode;
    
    // ボタンのアクティブ状態切り替え
    document.getElementById('timerBtn').classList.toggle('active', mode === 'timer');
    document.getElementById('stopwatchBtn').classList.toggle('active', mode === 'stopwatch');
    
    // セクション表示切り替え
    document.getElementById('timerSection').style.display = mode === 'timer' ? 'flex' : 'none';
    document.getElementById('stopwatchSection').style.display = mode === 'stopwatch' ? 'flex' : 'none';
}

function toggleTimer() {
    if (!isTimerRunning) {
        // タイマー開始
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        
        timerSeconds = hours * 3600 + minutes * 60 + seconds;
        
        if (timerSeconds <= 0) {
            alert('時間を設定してください');
            return;
        }
        
        isTimerRunning = true;
        document.getElementById('timerStart').innerHTML = '<i class="fas fa-pause"></i> 一時停止';
        
        timerInterval = setInterval(() => {
            timerSeconds -= 0.1;
            if (timerSeconds <= 0) {
                timerSeconds = 0;
                clearInterval(timerInterval);
                isTimerRunning = false;
                document.getElementById('timerStart').innerHTML = '<i class="fas fa-play"></i> スタート';
                alert('タイマー終了！');
            }
            updateTimerDisplay();
        }, 100);
    } else {
        // タイマー一時停止
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('timerStart').innerHTML = '<i class="fas fa-play"></i> 再開';
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSeconds = 0;
    document.getElementById('timerStart').innerHTML = '<i class="fas fa-play"></i> スタート';
    document.getElementById('timerDisplay').textContent = '00:00:00.0';
}

function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const secs = Math.floor(timerSeconds % 60);
    const decisecs = Math.floor((timerSeconds % 1) * 10);
    
    document.getElementById('timerDisplay').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${decisecs}`;
}

function toggleStopwatch() {
    if (!isStopwatchRunning) {
        // ストップウォッチ開始
        isStopwatchRunning = true;
        document.getElementById('stopwatchStart').innerHTML = '<i class="fas fa-pause"></i> 一時停止';
        
        timerInterval = setInterval(() => {
            stopwatchSeconds += 0.1;
            updateStopwatchDisplay();
        }, 100);
    } else {
        // ストップウォッチ一時停止
        clearInterval(timerInterval);
        isStopwatchRunning = false;
        document.getElementById('stopwatchStart').innerHTML = '<i class="fas fa-play"></i> 再開';
    }
}

function resetStopwatch() {
    clearInterval(timerInterval);
    isStopwatchRunning = false;
    stopwatchSeconds = 0;
    document.getElementById('stopwatchStart').innerHTML = '<i class="fas fa-play"></i> スタート';
    document.getElementById('stopwatchDisplay').textContent = '00:00:00.0';
}

function updateStopwatchDisplay() {
    const hours = Math.floor(stopwatchSeconds / 3600);
    const minutes = Math.floor((stopwatchSeconds % 3600) / 60);
    const secs = Math.floor(stopwatchSeconds % 60);
    const decisecs = Math.floor((stopwatchSeconds % 1) * 10);
    
    document.getElementById('stopwatchDisplay').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${decisecs}`;
}

/* ========================================
   カレンダー
   ======================================== */

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 月の表示を更新
    document.getElementById('currentMonth').textContent = 
        `${year}年 ${month + 1}月`;
    
    // カレンダーグリッドをクリア
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // 曜日ヘッダー
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // 前月の日付を表示
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayEl = createCalendarDay(prevMonthLastDay - i, true, year, month - 1);
        calendarGrid.appendChild(dayEl);
    }
    
    // 当月の日付を表示
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = createCalendarDay(day, false, year, month);
        calendarGrid.appendChild(dayEl);
    }
    
    // 次月の日付を表示
    const remainingDays = 42 - (firstDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = createCalendarDay(day, true, year, month + 1);
        calendarGrid.appendChild(dayEl);
    }
}

function createCalendarDay(day, isOtherMonth, year, month) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }
    
    // 今日の日付をハイライト
    const today = new Date();
    if (!isOtherMonth && 
        day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear()) {
        dayEl.classList.add('today');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);
    
    // この日のイベントを取得
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = getEventsForDate(dateStr);
    
    if (dayEvents.length > 0) {
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        dayEvents.forEach(event => {
            const eventDot = document.createElement('div');
            eventDot.className = 'event-dot';
            eventDot.textContent = event.time ? `${event.time} ${event.title}` : event.title;
            eventDot.title = event.title;
            eventsContainer.appendChild(eventDot);
        });
        dayEl.appendChild(eventsContainer);
    }
    
    return dayEl;
}

function getEventsForDate(dateStr) {
    // Todoリストから該当日のイベントを取得
    return todos.filter(todo => {
        if (!todo.dueDate) return false;
        const todoDate = new Date(todo.dueDate);
        const checkDate = new Date(dateStr);
        return todoDate.toDateString() === checkDate.toDateString() && todo.addToCalendar;
    }).map(todo => ({
        title: todo.title,
        time: todo.time || null
    }));
}

function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
}

/* ========================================
   今日の予定
   ======================================== */

function renderTodaySchedule() {
    const scheduleList = document.getElementById('todaySchedule');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const todayEvents = todos.filter(todo => {
        if (!todo.dueDate) return false;
        const todoDate = new Date(todo.dueDate);
        return todoDate.toDateString() === today.toDateString();
    }).sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
    
    if (todayEvents.length === 0) {
        scheduleList.innerHTML = `
            <div class="empty-schedule">
                <i class="fas fa-calendar-check"></i>
                <p>今日の予定はありません</p>
            </div>
        `;
        return;
    }
    
    scheduleList.innerHTML = todayEvents.map(event => `
        <div class="schedule-item">
            <div class="schedule-time">${event.time || '未設定'}</div>
            <div class="schedule-content">
                <div class="schedule-title">${event.title}</div>
                ${event.notes ? `<div class="schedule-description">${event.notes}</div>` : ''}
            </div>
        </div>
    `).join('');
}

/* ========================================
   Todo管理
   ======================================== */

function openTodoModal() {
    document.getElementById('todoModal').classList.add('active');
    updateTodoGroupOptions();
}

function closeTodoModal() {
    document.getElementById('todoModal').classList.remove('active');
    clearTodoForm();
}

function updateTodoGroupOptions() {
    const select = document.getElementById('todoGroup');
    select.innerHTML = '<option value="">グループを選択</option>';
    todoGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        select.appendChild(option);
    });
    const newOption = document.createElement('option');
    newOption.value = '__new__';
    newOption.textContent = '+ 新しいグループを作成';
    select.appendChild(newOption);
}

function saveTodo() {
    const title = document.getElementById('todoTitle').value.trim();
    const group = document.getElementById('todoGroup').value;
    const dueDate = document.getElementById('todoDueDate').value;
    const time = document.getElementById('todoTime').value;
    const addToCalendar = document.getElementById('todoCalendar').checked;
    const notes = document.getElementById('todoNotes').value.trim();
    
    if (!title) {
        alert('タスク名を入力してください');
        return;
    }
    
    const newTodo = {
        id: Date.now(),
        title,
        group,
        dueDate,
        time,
        addToCalendar,
        notes,
        completed: false
    };
    
    todos.push(newTodo);
    renderTodoList();
    renderCalendar();
    renderTodaySchedule();
    closeTodoModal();
}

function renderTodoList() {
    const todoList = document.getElementById('todoList');
    
    if (todos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-schedule">
                <i class="fas fa-tasks"></i>
                <p>Todoを追加してください</p>
            </div>
        `;
        return;
    }
    
    todoList.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <input type="checkbox" class="todo-checkbox" 
                   ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodoComplete(${todo.id})">
            <div class="todo-content">
                <div class="todo-title">${todo.title}</div>
                <div class="todo-meta">
                    ${todo.group ? `<span class="todo-group"><i class="fas fa-tag"></i> ${todo.group}</span>` : ''}
                    ${todo.dueDate ? `<span class="todo-due"><i class="fas fa-calendar"></i> ${todo.dueDate}</span>` : ''}
                    ${todo.time ? `<span class="todo-time"><i class="fas fa-clock"></i> ${todo.time}</span>` : ''}
                </div>
            </div>
            <button class="todo-delete" onclick="deleteTodo(${todo.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function toggleTodoComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        renderTodoList();
    }
}

function deleteTodo(id) {
    if (confirm('このTodoを削除しますか?')) {
        todos = todos.filter(t => t.id !== id);
        renderTodoList();
        renderCalendar();
        renderTodaySchedule();
    }
}

function clearTodoForm() {
    document.getElementById('todoTitle').value = '';
    document.getElementById('todoGroup').value = '';
    document.getElementById('todoDueDate').value = '';
    document.getElementById('todoTime').value = '';
    document.getElementById('todoCalendar').checked = false;
    document.getElementById('todoNotes').value = '';
}

/* ========================================
   スプレッドシート管理
   ======================================== */

function openSheetModal() {
    document.getElementById('sheetModal').classList.add('active');
}

function closeSheetModal() {
    document.getElementById('sheetModal').classList.remove('active');
    clearSheetForm();
}

function saveSpreadsheet() {
    const name = document.getElementById('sheetName').value.trim();
    const url = document.getElementById('sheetUrl').value.trim();
    
    if (!name || !url) {
        alert('シート名とURLを入力してください');
        return;
    }
    
    // URLからスプレッドシートIDを抽出
    const sheetId = extractSpreadsheetId(url);
    
    if (!sheetId) {
        alert('有効なGoogleスプレッドシートのURLを入力してください');
        return;
    }
    
    spreadsheets.push({ name, id: sheetId });
    localStorage.setItem(STORAGE_KEYS.SPREADSHEETS, JSON.stringify(spreadsheets));
    
    renderSpreadsheetTabs();
    closeSheetModal();
}

function extractSpreadsheetId(url) {
    // GoogleスプレッドシートのURLからIDを抽出
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url; // URLでない場合はそのまま返す
}

function renderSpreadsheetTabs() {
    const tabsContainer = document.getElementById('sheetTabs');
    const contentContainer = document.getElementById('sheetContent');
    
    if (spreadsheets.length === 0) {
        tabsContainer.innerHTML = '';
        contentContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-table"></i>
                <p>スプレッドシートを追加してください</p>
            </div>
        `;
        return;
    }
    
    tabsContainer.innerHTML = spreadsheets.map((sheet, index) => `
        <div class="sheet-tab ${index === 0 ? 'active' : ''}" onclick="showSpreadsheet(${index})">
            ${sheet.name}
            <button class="delete-sheet" onclick="event.stopPropagation(); deleteSpreadsheet(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // 最初のスプレッドシートを表示
    if (spreadsheets.length > 0) {
        showSpreadsheet(0);
    }
}

function showSpreadsheet(index) {
    // タブのアクティブ状態を更新
    document.querySelectorAll('.sheet-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    const sheet = spreadsheets[index];
    const contentContainer = document.getElementById('sheetContent');
    
    contentContainer.innerHTML = `
        <iframe src="https://docs.google.com/spreadsheets/d/${sheet.id}/edit?embedded=true"></iframe>
    `;
}

function deleteSpreadsheet(index) {
    if (confirm('このスプレッドシートを削除しますか?')) {
        spreadsheets.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.SPREADSHEETS, JSON.stringify(spreadsheets));
        renderSpreadsheetTabs();
    }
}

function clearSheetForm() {
    document.getElementById('sheetName').value = '';
    document.getElementById('sheetUrl').value = '';
}

/* ========================================
   Google API関連（将来の実装用）
   ======================================== */

function gapiLoaded() {
    // Google API Client Library の読み込み完了
    console.log('GAPI loaded');
    gapiInited = true;
}

function gisLoaded() {
    // Google Identity Services の読み込み完了
    console.log('GIS loaded');
    gisInited = true;
}

// Gmail未読数を取得（デモ用）
function updateGmailCount() {
    // 実際の実装ではGmail APIを使用
    document.getElementById('unreadCount').textContent = '0';
}

/* ========================================
   初期データ読み込み
   ======================================== */

// ページ読み込み時にTodoリストを描画
window.addEventListener('load', () => {
    renderTodoList();
    renderTodaySchedule();
    updateGmailCount();
});