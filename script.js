/* ========================================
   Zepome's Portal - Main Script (Redesigned)
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
    loadWeatherMini(currentWeatherLocation);
    
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
    }
});

function initializeUI() {
    console.log('Zepome\'s Portal initialized');
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
    // 天気タブ（ミニ）
    document.querySelectorAll('.tab-btn-mini').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn-mini').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeatherLocation = btn.dataset.location;
            loadWeatherMini(currentWeatherLocation);
        });
    });
    
    // タイマー/ストップウォッチ切り替え（ミニ）
    document.getElementById('timerBtnMini').addEventListener('click', () => switchTimerMode('timer'));
    document.getElementById('stopwatchBtnMini').addEventListener('click', () => switchTimerMode('stopwatch'));
    
    // タイマーコントロール（ミニ）
    document.getElementById('timerStartMini').addEventListener('click', toggleTimer);
    document.getElementById('timerResetMini').addEventListener('click', resetTimer);
    
    // タイマー表示クリックで設定モーダル
    document.getElementById('timerDisplayMini').addEventListener('click', openTimerSettings);
    document.getElementById('closeTimerSettings')?.addEventListener('click', closeTimerSettings);
    document.getElementById('setTimer')?.addEventListener('click', setTimerFromModal);
    
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
    document.getElementById('timerSettingsModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'timerSettingsModal') closeTimerSettings();
    });
}

/* ========================================
   天気情報（ミニ版）
   ======================================== */

async function loadWeatherMini(location) {
    const weatherContent = document.getElementById('weatherContentMini');
    weatherContent.innerHTML = '<span class="weather-mini-text">Loading...</span>';
    
    try {
        const response = await fetch(CONFIG.WEATHER_API[location]);
        const data = await response.json();
        
        const todayForecast = data[0].timeSeries[0];
        const area = todayForecast.areas[0];
        
        const weatherText = area.weathers[0].split('　')[0]; // 最初の部分だけ
        
        weatherContent.innerHTML = `<span class="weather-mini-text">${weatherText}</span>`;
    } catch (error) {
        console.error('Weather fetch error:', error);
        weatherContent.innerHTML = '<span class="weather-mini-text">エラー</span>';
    }
}

/* ========================================
   タイマー/ストップウォッチ（ミニ版）
   ======================================== */

function switchTimerMode(mode) {
    currentTimerMode = mode;
    
    // ボタンのアクティブ状態切り替え
    document.getElementById('timerBtnMini').classList.toggle('active', mode === 'timer');
    document.getElementById('stopwatchBtnMini').classList.toggle('active', mode === 'stopwatch');
    
    // 表示を更新
    if (mode === 'timer') {
        updateTimerDisplay();
    } else {
        updateStopwatchDisplay();
    }
}

function openTimerSettings() {
    if (currentTimerMode === 'timer' && !isTimerRunning) {
        document.getElementById('timerSettingsModal').classList.add('active');
    }
}

function closeTimerSettings() {
    document.getElementById('timerSettingsModal').classList.remove('active');
}

function setTimerFromModal() {
    const hours = parseInt(document.getElementById('timerHours').value) || 0;
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    
    timerSeconds = hours * 3600 + minutes * 60 + seconds;
    updateTimerDisplay();
    closeTimerSettings();
}

function toggleTimer() {
    if (currentTimerMode === 'stopwatch') {
        toggleStopwatch();
        return;
    }
    
    if (!isTimerRunning) {
        if (timerSeconds <= 0) {
            openTimerSettings();
            return;
        }
        
        isTimerRunning = true;
        document.getElementById('timerStartMini').textContent = '⏸';
        
        timerInterval = setInterval(() => {
            timerSeconds -= 0.1;
            if (timerSeconds <= 0) {
                timerSeconds = 0;
                clearInterval(timerInterval);
                isTimerRunning = false;
                document.getElementById('timerStartMini').textContent = '▶';
                alert('タイマー終了！');
            }
            updateTimerDisplay();
        }, 100);
    } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('timerStartMini').textContent = '▶';
    }
}

function resetTimer() {
    if (currentTimerMode === 'stopwatch') {
        resetStopwatch();
        return;
    }
    
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSeconds = 0;
    document.getElementById('timerStartMini').textContent = '▶';
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const secs = Math.floor(timerSeconds % 60);
    const decisecs = Math.floor((timerSeconds % 1) * 10);
    
    document.getElementById('timerDisplayMini').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${decisecs}`;
}

function toggleStopwatch() {
    if (!isStopwatchRunning) {
        isStopwatchRunning = true;
        document.getElementById('timerStartMini').textContent = '⏸';
        
        timerInterval = setInterval(() => {
            stopwatchSeconds += 0.1;
            updateStopwatchDisplay();
        }, 100);
    } else {
        clearInterval(timerInterval);
        isStopwatchRunning = false;
        document.getElementById('timerStartMini').textContent = '▶';
    }
}

function resetStopwatch() {
    clearInterval(timerInterval);
    isStopwatchRunning = false;
    stopwatchSeconds = 0;
    document.getElementById('timerStartMini').textContent = '▶';
    updateStopwatchDisplay();
}

function updateStopwatchDisplay() {
    const hours = Math.floor(stopwatchSeconds / 3600);
    const minutes = Math.floor((stopwatchSeconds % 3600) / 60);
    const secs = Math.floor(stopwatchSeconds % 60);
    const decisecs = Math.floor((stopwatchSeconds % 1) * 10);
    
    document.getElementById('timerDisplayMini').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${decisecs}`;
}

/* ========================================
   カレンダー
   ======================================== */

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        `${year}年 ${month + 1}月`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayEl = createCalendarDay(prevMonthLastDay - i, true, year, month - 1);
        calendarGrid.appendChild(dayEl);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = createCalendarDay(day, false, year, month);
        calendarGrid.appendChild(dayEl);
    }
    
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
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
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
    
    if (spreadsheets.length > 0) {
        showSpreadsheet(0);
    }
}

function showSpreadsheet(index) {
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
   Google API関連
   ======================================== */

function gapiLoaded() {
    console.log('GAPI loaded');
    gapiInited = true;
}

function gisLoaded() {
    console.log('GIS loaded');
    gisInited = true;
}

function updateGmailCount() {
    document.getElementById('unreadCount').textContent = '0';
}

/* ========================================
   初期データ読み込み
   ======================================== */

window.addEventListener('load', () => {
    renderTodoList();
    updateGmailCount();
});