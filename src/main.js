import './style.css';

/* ============================================================
   Tool - Main Application
   Multi-calendar demo with 4 library tabs:
   FullCalendar, TOAST UI, DayPilot, DHTMLX
   ============================================================ */

import { api } from './core/api.js';
import {
    toFullCalendar, fromFullCalendar,
    toToastUI, fromToastUI,
    toDayPilot, fromDayPilot,
    toDHMLX, fromDHMLX,
    formatDate, parseDate
} from './calendars/adapters.js';

// ---- Lazy-loaded library imports (populated on first init) ----
let FullCalendarLib = null;
let DayGridPlugin = null;
let TimeGridPlugin = null;
let InteractionPlugin = null;
let ToastCalendar = null;
let DayPilot = null;
let DhtmlxScheduler = null;

const CONFIG_KEY = 'tool_config';
const DEFAULT_CONFIG = {
    activeMode: 'fullcalendar',
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    theme: 'dark',
};

function loadConfig() {
    try {
        const saved = localStorage.getItem(CONFIG_KEY);
        return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
    } catch { return { ...DEFAULT_CONFIG }; }
}

function saveConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

// ---- SVG Icons ----
const ICONS = {
    sidebar: `<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    panelRight: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    moon: `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`,
};

const config = loadConfig();

// ---- Apply initial theme ----
if (config.theme === 'light') document.documentElement.setAttribute('data-theme', 'light');

// ---- Calendar State ----
const calendarInstances = {};   // { fullcalendar: Calendar, toastui: Calendar, ... }
const calendarViews = {};       // { fullcalendar: 'month', toastui: 'month', ... }
let defaultHubId = null;        // Loaded on init

// ---- Generate panel HTML for a calendar tab ----
function calendarPanelHTML(id, label) {
    return `
        <div class="mode-panel ${config.activeMode === id ? 'active' : ''}" id="panel-${id}">
            <div class="panel-toolbar">
                <div class="panel-toolbar-left">
                    <button class="toolbar-btn" data-cal="${id}" data-action="today">Today</button>
                    <button class="toolbar-btn icon-only" data-cal="${id}" data-action="prev">${ICONS.chevronLeft}</button>
                    <button class="toolbar-btn icon-only" data-cal="${id}" data-action="next">${ICONS.chevronRight}</button>
                    <span class="toolbar-date" id="date-label-${id}"></span>
                </div>
                <div class="panel-toolbar-right">
                    <div class="view-switcher">
                        <button class="view-btn active" data-cal="${id}" data-view="month">Month</button>
                        <button class="view-btn" data-cal="${id}" data-view="week">Week</button>
                        <button class="view-btn" data-cal="${id}" data-view="3day">3-Day</button>
                    </div>
                </div>
            </div>
            <div class="calendar-body" id="cal-body-${id}"></div>
        </div>
    `;
}

// ---- Render Layout ----
document.getElementById('app').innerHTML = `
    <div class="top-bar">
        <div class="top-bar-left">
            <button class="icon-btn" id="toggle-left" title="Toggle left sidebar">${ICONS.sidebar}</button>
        </div>
        <div class="top-bar-center">
            <div class="mode-switcher">
                <button class="mode-btn ${config.activeMode === 'fullcalendar' ? 'active' : ''}" data-mode="fullcalendar">
                    ${ICONS.calendar} FullCalendar
                </button>
                <button class="mode-btn ${config.activeMode === 'toastui' ? 'active' : ''}" data-mode="toastui">
                    ${ICONS.calendar} TOAST UI
                </button>
                <button class="mode-btn ${config.activeMode === 'daypilot' ? 'active' : ''}" data-mode="daypilot">
                    ${ICONS.calendar} DayPilot
                </button>
                <button class="mode-btn ${config.activeMode === 'dhtmlx' ? 'active' : ''}" data-mode="dhtmlx">
                    ${ICONS.calendar} DHTMLX
                </button>
            </div>
        </div>
        <div class="top-bar-right">
            <button class="icon-btn" id="btn-settings" title="Settings">${ICONS.settings}</button>
            <button class="theme-toggle" id="btn-theme" title="Toggle theme">
                <span class="theme-toggle-track">
                    <span class="theme-toggle-icon theme-icon-sun">${ICONS.sun}</span>
                    <span class="theme-toggle-icon theme-icon-moon">${ICONS.moon}</span>
                    <span class="theme-toggle-thumb"></span>
                </span>
            </button>
            <button class="icon-btn" id="toggle-right" title="Toggle right sidebar">${ICONS.panelRight}</button>
        </div>
    </div>

    <div class="app-body">
        <div class="sidebar sidebar-left ${config.leftSidebarOpen ? '' : 'collapsed'}" id="sidebar-left">
            <div class="sidebar-header"><h3>Workspace</h3></div>
            <div class="sidebar-content" id="left-sidebar-content"></div>
        </div>

        <div class="main-content" id="main-content">
            ${calendarPanelHTML('fullcalendar', 'FullCalendar')}
            ${calendarPanelHTML('toastui', 'TOAST UI')}
            ${calendarPanelHTML('daypilot', 'DayPilot')}
            ${calendarPanelHTML('dhtmlx', 'DHTMLX')}
        </div>

        <div class="sidebar sidebar-right ${config.rightSidebarOpen ? '' : 'collapsed'}" id="sidebar-right">
            <div class="sidebar-header"><h3>Details</h3></div>
            <div class="sidebar-content" id="right-sidebar-content"></div>
        </div>
    </div>
`;

// ---- Mode Switching ----
const modeBtns = document.querySelectorAll('.mode-btn');
const panels = {
    fullcalendar: document.getElementById('panel-fullcalendar'),
    toastui: document.getElementById('panel-toastui'),
    daypilot: document.getElementById('panel-daypilot'),
    dhtmlx: document.getElementById('panel-dhtmlx'),
};

function setMode(mode) {
    config.activeMode = mode;
    saveConfig(config);
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    Object.entries(panels).forEach(([k, p]) => p.classList.toggle('active', k === mode));

    // Lazy-init the calendar for this tab
    requestAnimationFrame(() => initCalendar(mode));
}

modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

// ---- Sidebar Toggles ----
document.getElementById('toggle-left').addEventListener('click', () => {
    const sb = document.getElementById('sidebar-left');
    sb.classList.toggle('collapsed');
    config.leftSidebarOpen = !sb.classList.contains('collapsed');
    saveConfig(config);
    // Resize active calendar after sidebar transition
    setTimeout(() => resizeCalendar(config.activeMode), 350);
});

document.getElementById('toggle-right').addEventListener('click', () => {
    const sb = document.getElementById('sidebar-right');
    sb.classList.toggle('collapsed');
    config.rightSidebarOpen = !sb.classList.contains('collapsed');
    saveConfig(config);
    setTimeout(() => resizeCalendar(config.activeMode), 350);
});

// ---- Theme Toggle ----
document.getElementById('btn-theme').addEventListener('click', () => {
    const isLight = config.theme === 'light';
    config.theme = isLight ? 'dark' : 'light';
    saveConfig(config);
    if (config.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
});

// ---- Settings Dialog ----
document.getElementById('btn-settings').addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    overlay.innerHTML = `
        <div class="dialog">
            <h3>Settings</h3>
            <div class="dialog-actions">
                <button class="btn btn-primary" id="cfg-close">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#cfg-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('keydown', e => {
        if (e.key === 'Escape') overlay.remove();
        if (e.key === 'Enter') overlay.remove();
    });
});

// ---- Panel Toolbar Buttons ----
document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const calId = btn.dataset.cal;
        const action = btn.dataset.action;
        if (action === 'today') calendarToday(calId);
        if (action === 'prev') calendarPrev(calId);
        if (action === 'next') calendarNext(calId);
    });
});

document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const calId = btn.dataset.cal;
        const view = btn.dataset.view;
        // Update active state on view switcher
        btn.closest('.view-switcher').querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calendarViews[calId] = view;
        calendarChangeView(calId, view);
    });
});

// ============================================================
//   Calendar Initialization Functions
// ============================================================

async function initCalendar(mode) {
    if (calendarInstances[mode]) {
        resizeCalendar(mode);
        return;
    }

    // Ensure we have a default hub
    if (!defaultHubId) {
        try {
            const hubs = await api.getHubs();
            if (hubs.length > 0) defaultHubId = hubs[0].id;
        } catch (e) {
            console.error('Failed to load hubs:', e);
        }
    }

    switch (mode) {
        case 'fullcalendar': return initFullCalendar();
        case 'toastui': return initToastUICalendar();
        case 'daypilot': return initDayPilotCalendar();
        case 'dhtmlx': return initDHMLXCalendar();
    }
}

// ---- Load events from API ----
async function loadEvents() {
    try {
        return await api.getCalendarEvents();
    } catch (e) {
        console.error('Failed to load events:', e);
        return [];
    }
}

// ---- Refresh all initialized calendars ----
async function refreshAllCalendars() {
    const events = await loadEvents();
    for (const [id, instance] of Object.entries(calendarInstances)) {
        try {
            if (id === 'fullcalendar' && instance) {
                instance.removeAllEvents();
                toFullCalendar(events).forEach(ev => instance.addEvent(ev));
            } else if (id === 'toastui' && instance) {
                instance.clear();
                instance.createEvents(toToastUI(events));
            } else if (id === 'daypilot' && instance) {
                if (instance.calendar) {
                    instance.calendar.events.list = toDayPilot(events);
                    instance.calendar.update();
                }
                if (instance.month) {
                    instance.month.events.list = toDayPilot(events);
                    instance.month.update();
                }
            } else if (id === 'dhtmlx' && instance) {
                instance.clearAll();
                instance.parse(toDHMLX(events));
            }
        } catch (e) {
            console.error(`Failed to refresh ${id}:`, e);
        }
    }
    updateDateLabels();
}

// ---- Update the date label for each calendar ----
function updateDateLabels() {
    for (const [id, instance] of Object.entries(calendarInstances)) {
        const label = document.getElementById(`date-label-${id}`);
        if (!label) continue;
        try {
            if (id === 'fullcalendar' && instance) {
                label.textContent = instance.view.title;
            } else if (id === 'toastui' && instance) {
                const d = instance.getDate();
                const date = d.toDate ? d.toDate() : new Date(d);
                label.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            } else if (id === 'daypilot') {
                const activeCal = instance?.calendar || instance?.month;
                if (activeCal) {
                    const start = activeCal.visibleStart ? activeCal.visibleStart() : null;
                    if (start) {
                        const d = new Date(start.value || start);
                        label.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }
                }
            } else if (id === 'dhtmlx' && instance) {
                const state = instance.getState();
                if (state?.date) {
                    const d = state.date;
                    label.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                }
            }
        } catch (e) { /* ignore label errors */ }
    }
}

// ---- Resize a calendar after layout change ----
function resizeCalendar(mode) {
    const instance = calendarInstances[mode];
    if (!instance) return;
    try {
        if (mode === 'fullcalendar') instance.updateSize();
        else if (mode === 'toastui') instance.render();
        else if (mode === 'daypilot') {
            if (instance.calendar) instance.calendar.update();
            if (instance.month) instance.month.update();
        }
        else if (mode === 'dhtmlx') instance.updateView();
    } catch (e) { /* ignore resize errors */ }
}

// ============================================================
//   FullCalendar
// ============================================================

async function initFullCalendar() {
    const container = document.getElementById('cal-body-fullcalendar');
    if (!container) return;
    container.innerHTML = '<div class="calendar-loading">Loading FullCalendar...</div>';

    try {
        // Dynamic imports
        const [coreModule, dayGridModule, timeGridModule, interactionModule] = await Promise.all([
            import('@fullcalendar/core'),
            import('@fullcalendar/daygrid'),
            import('@fullcalendar/timegrid'),
            import('@fullcalendar/interaction'),
        ]);
        FullCalendarLib = coreModule;
        DayGridPlugin = dayGridModule.default;
        TimeGridPlugin = timeGridModule.default;
        InteractionPlugin = interactionModule.default;
    } catch (e) {
        container.innerHTML = `<div class="calendar-error">Failed to load FullCalendar: ${e.message}</div>`;
        return;
    }

    const events = await loadEvents();
    const container2 = document.getElementById('cal-body-fullcalendar');
    container2.innerHTML = '';

    const cal = new FullCalendarLib.Calendar(container2, {
        plugins: [DayGridPlugin, TimeGridPlugin, InteractionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: false,  // We use our own toolbar
        height: '100%',
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        events: toFullCalendar(events),

        // Create event on date select
        select: async (info) => {
            const title = prompt('Event title:');
            if (!title) {
                cal.unselect();
                return;
            }
            try {
                const result = await api.createCalendarEvent({
                    hub_id: defaultHubId,
                    title,
                    start_date: formatDate(info.start),
                    end_date: formatDate(info.end),
                    all_day: info.allDay ? 1 : 0,
                });
                cal.unselect();
                await refreshAllCalendars();
            } catch (e) {
                console.error('Failed to create event:', e);
            }
        },

        // Update event on drag/resize
        eventDrop: async (info) => {
            try {
                await api.updateCalendarEvent(info.event.id, {
                    title: info.event.title,
                    start_date: formatDate(info.event.start),
                    end_date: formatDate(info.event.end || info.event.start),
                });
                await refreshAllCalendars();
            } catch (e) {
                info.revert();
                console.error('Failed to update event:', e);
            }
        },

        eventResize: async (info) => {
            try {
                await api.updateCalendarEvent(info.event.id, {
                    title: info.event.title,
                    start_date: formatDate(info.event.start),
                    end_date: formatDate(info.event.end),
                });
                await refreshAllCalendars();
            } catch (e) {
                info.revert();
                console.error('Failed to update event:', e);
            }
        },

        // Delete event on click
        eventClick: async (info) => {
            if (confirm(`Delete "${info.event.title}"?`)) {
                try {
                    await api.deleteCalendarEvent(info.event.id);
                    await refreshAllCalendars();
                } catch (e) {
                    console.error('Failed to delete event:', e);
                }
            }
        },

        datesSet: () => updateDateLabels(),
    });

    cal.render();
    calendarInstances.fullcalendar = cal;
    calendarViews.fullcalendar = 'month';
    updateDateLabels();
}

// ============================================================
//   TOAST UI Calendar
// ============================================================

async function initToastUICalendar() {
    const container = document.getElementById('cal-body-toastui');
    if (!container) return;
    container.innerHTML = '<div class="calendar-loading">Loading TOAST UI Calendar...</div>';

    let Calendar;
    try {
        const mod = await import('@toast-ui/calendar');
        Calendar = mod.default || mod.Calendar;
        // Import CSS
        await import('@toast-ui/calendar/dist/toastui-calendar.min.css');
    } catch (e) {
        container.innerHTML = `<div class="calendar-error">Failed to load TOAST UI Calendar: ${e.message}</div>`;
        return;
    }

    const events = await loadEvents();
    container.innerHTML = '';

    const cal = new Calendar(container, {
        defaultView: 'month',
        usageStatistics: false,
        isReadOnly: false,
        useDetailPopup: true,
        useFormPopup: true,
        week: {
            startDayOfWeek: 0,
            dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            taskView: false,
            eventView: ['time', 'allday'],
        },
        month: {
            startDayOfWeek: 0,
            dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        },
        calendars: [
            {
                id: 'default',
                name: 'Default',
                backgroundColor: '#6366f1',
                borderColor: '#6366f1',
                color: '#ffffff',
            }
        ],
        template: {
            titlePlaceholder() { return 'Event title'; },
        },
    });

    cal.createEvents(toToastUI(events));

    // Event handlers
    cal.on('beforeCreateEvent', async (eventData) => {
        try {
            const result = await api.createCalendarEvent({
                hub_id: defaultHubId,
                title: eventData.title,
                start_date: formatDate(eventData.start instanceof Date ? eventData.start : new Date(eventData.start)),
                end_date: formatDate(eventData.end instanceof Date ? eventData.end : new Date(eventData.end)),
                all_day: eventData.isAllday ? 1 : 0,
            });
            await refreshAllCalendars();
        } catch (e) {
            console.error('Failed to create event:', e);
        }
    });

    cal.on('beforeUpdateEvent', async ({ event, changes }) => {
        try {
            const updates = {};
            if (changes.title !== undefined) updates.title = changes.title;
            if (changes.start) updates.start_date = formatDate(changes.start instanceof Date ? changes.start : new Date(changes.start));
            if (changes.end) updates.end_date = formatDate(changes.end instanceof Date ? changes.end : new Date(changes.end));
            if (changes.isAllday !== undefined) updates.all_day = changes.isAllday ? 1 : 0;

            await api.updateCalendarEvent(event.id, updates);
            await refreshAllCalendars();
        } catch (e) {
            console.error('Failed to update event:', e);
        }
    });

    cal.on('beforeDeleteEvent', async (eventData) => {
        try {
            await api.deleteCalendarEvent(eventData.id);
            await refreshAllCalendars();
        } catch (e) {
            console.error('Failed to delete event:', e);
        }
    });

    calendarInstances.toastui = cal;
    calendarViews.toastui = 'month';
    updateDateLabels();
}

// ============================================================
//   DayPilot
// ============================================================

async function initDayPilotCalendar() {
    const container = document.getElementById('cal-body-daypilot');
    if (!container) return;
    container.innerHTML = '<div class="calendar-loading">Loading DayPilot...</div>';

    try {
        const mod = await import('@daypilot/daypilot-lite-javascript');
        DayPilot = mod.DayPilot || mod.default?.DayPilot || mod;
    } catch (e) {
        container.innerHTML = `<div class="calendar-error">Failed to load DayPilot: ${e.message}</div>`;
        return;
    }

    const events = await loadEvents();
    container.innerHTML = '<div id="daypilot-month" style="width:100%;height:100%;"></div><div id="daypilot-calendar" style="width:100%;height:100%;display:none;"></div>';

    const dpEvents = toDayPilot(events);

    // Month view
    const month = new DayPilot.Month('daypilot-month', {
        startDate: DayPilot.Date.today(),
        events: dpEvents,
        eventHeight: 25,
        cellHeaderHeight: 25,
        onEventMoved: async (args) => {
            try {
                await api.updateCalendarEvent(args.e.id(), {
                    start_date: formatDate(new Date(args.newStart.value)),
                    end_date: formatDate(new Date(args.newEnd.value)),
                });
                await refreshAllCalendars();
            } catch (e) { console.error('Failed to update:', e); }
        },
        onEventResized: async (args) => {
            try {
                await api.updateCalendarEvent(args.e.id(), {
                    start_date: formatDate(new Date(args.newStart.value)),
                    end_date: formatDate(new Date(args.newEnd.value)),
                });
                await refreshAllCalendars();
            } catch (e) { console.error('Failed to update:', e); }
        },
        onTimeRangeSelected: async (args) => {
            const title = prompt('Event title:');
            if (!title) { month.clearSelection(); return; }
            try {
                await api.createCalendarEvent({
                    hub_id: defaultHubId,
                    title,
                    start_date: formatDate(new Date(args.start.value)),
                    end_date: formatDate(new Date(args.end.value)),
                });
                month.clearSelection();
                await refreshAllCalendars();
            } catch (e) { console.error('Failed to create:', e); }
        },
        onEventClick: async (args) => {
            if (confirm(`Delete "${args.e.text()}"?`)) {
                try {
                    await api.deleteCalendarEvent(args.e.id());
                    await refreshAllCalendars();
                } catch (e) { console.error('Failed to delete:', e); }
            }
        },
    });
    month.init();

    // Calendar (week/3-day) view
    const calendar = new DayPilot.Calendar('daypilot-calendar', {
        viewType: 'Week',
        startDate: DayPilot.Date.today(),
        events: dpEvents,
        onEventMoved: async (args) => {
            try {
                await api.updateCalendarEvent(args.e.id(), {
                    start_date: formatDate(new Date(args.newStart.value)),
                    end_date: formatDate(new Date(args.newEnd.value)),
                });
                await refreshAllCalendars();
            } catch (e) { console.error('Failed to update:', e); }
        },
        onEventResized: async (args) => {
            try {
                await api.updateCalendarEvent(args.e.id(), {
                    start_date: formatDate(new Date(args.newStart.value)),
                    end_date: formatDate(new Date(args.newEnd.value)),
                });
                await refreshAllCalendars();
            } catch (e) { console.error('Failed to update:', e); }
        },
        onTimeRangeSelected: async (args) => {
            const title = prompt('Event title:');
            if (!title) { calendar.clearSelection(); return; }
            try {
                await api.createCalendarEvent({
                    hub_id: defaultHubId,
                    title,
                    start_date: formatDate(new Date(args.start.value)),
                    end_date: formatDate(new Date(args.end.value)),
                });
                calendar.clearSelection();
                await refreshAllCalendars();
            } catch (e) { console.error('Failed to create:', e); }
        },
        onEventClick: async (args) => {
            if (confirm(`Delete "${args.e.text()}"?`)) {
                try {
                    await api.deleteCalendarEvent(args.e.id());
                    await refreshAllCalendars();
                } catch (e) { console.error('Failed to delete:', e); }
            }
        },
    });
    calendar.init();

    calendarInstances.daypilot = { month, calendar, activeView: 'month' };
    calendarViews.daypilot = 'month';
    updateDateLabels();
}

// ============================================================
//   DHTMLX Scheduler
// ============================================================

async function initDHMLXCalendar() {
    const container = document.getElementById('cal-body-dhtmlx');
    if (!container) return;
    container.innerHTML = '<div class="calendar-loading">Loading DHTMLX Scheduler...</div>';

    let Scheduler;
    try {
        const mod = await import('dhtmlx-scheduler');
        Scheduler = mod.Scheduler || mod.scheduler || mod.default;
        await import('dhtmlx-scheduler/codebase/dhtmlxscheduler.css');
    } catch (e) {
        container.innerHTML = `<div class="calendar-error">Failed to load DHTMLX Scheduler: ${e.message}</div>`;
        return;
    }

    const events = await loadEvents();

    container.innerHTML = `
        <div id="dhtmlx-scheduler" class="dhx_cal_container" style="width:100%;height:100%;">
            <div class="dhx_cal_navline">
                <div class="dhx_cal_prev_button">&nbsp;</div>
                <div class="dhx_cal_next_button">&nbsp;</div>
                <div class="dhx_cal_today_button">Today</div>
                <div class="dhx_cal_date"></div>
            </div>
            <div class="dhx_cal_header"></div>
            <div class="dhx_cal_data"></div>
        </div>
    `;

    const scheduler = Scheduler.getSchedulerInstance();

    scheduler.config.header = null;  // We use our own toolbar
    scheduler.config.multi_day = true;
    scheduler.config.xml_date = '%Y-%m-%d %H:%i';
    scheduler.config.details_on_create = false;
    scheduler.config.details_on_dblclick = false;

    const dhxContainer = container.querySelector('#dhtmlx-scheduler');
    scheduler.init(dhxContainer, new Date(), 'month');

    scheduler.clearAll();
    scheduler.parse(toDHMLX(events));

    // Event handlers
    scheduler.attachEvent('onEventAdded', async (id, ev) => {
        try {
            const result = await api.createCalendarEvent({
                hub_id: defaultHubId,
                title: ev.text,
                start_date: formatDate(ev.start_date),
                end_date: formatDate(ev.end_date),
            });
            scheduler.changeEventId(id, result.id);
            await refreshAllCalendars();
        } catch (e) {
            console.error('Failed to create event:', e);
        }
    });

    scheduler.attachEvent('onEventChanged', async (id, ev) => {
        try {
            await api.updateCalendarEvent(id, {
                title: ev.text,
                start_date: formatDate(ev.start_date),
                end_date: formatDate(ev.end_date),
            });
            // Refresh others but not self (already updated)
            const otherEvents = await loadEvents();
            for (const [cid, inst] of Object.entries(calendarInstances)) {
                if (cid === 'dhtmlx') continue;
                try {
                    if (cid === 'fullcalendar' && inst) {
                        inst.removeAllEvents();
                        toFullCalendar(otherEvents).forEach(e => inst.addEvent(e));
                    } else if (cid === 'toastui' && inst) {
                        inst.clear();
                        inst.createEvents(toToastUI(otherEvents));
                    } else if (cid === 'daypilot' && inst) {
                        const dpEvts = toDayPilot(otherEvents);
                        if (inst.calendar) { inst.calendar.events.list = dpEvts; inst.calendar.update(); }
                        if (inst.month) { inst.month.events.list = dpEvts; inst.month.update(); }
                    }
                } catch (e) { /* ignore */ }
            }
        } catch (e) {
            console.error('Failed to update event:', e);
        }
    });

    scheduler.attachEvent('onEventDeleted', async (id) => {
        try {
            await api.deleteCalendarEvent(id);
            await refreshAllCalendars();
        } catch (e) {
            console.error('Failed to delete event:', e);
        }
    });

    calendarInstances.dhtmlx = scheduler;
    calendarViews.dhtmlx = 'month';
    updateDateLabels();
}

// ============================================================
//   Calendar Navigation Helpers
// ============================================================

function calendarToday(calId) {
    const inst = calendarInstances[calId];
    if (!inst) return;

    if (calId === 'fullcalendar') {
        inst.today();
    } else if (calId === 'toastui') {
        inst.today();
    } else if (calId === 'daypilot') {
        const today = DayPilot.Date.today();
        if (inst.month) { inst.month.startDate = today; inst.month.update(); }
        if (inst.calendar) { inst.calendar.startDate = today; inst.calendar.update(); }
    } else if (calId === 'dhtmlx') {
        inst.setCurrentView(new Date());
    }
    updateDateLabels();
}

function calendarPrev(calId) {
    const inst = calendarInstances[calId];
    if (!inst) return;

    if (calId === 'fullcalendar') {
        inst.prev();
    } else if (calId === 'toastui') {
        inst.prev();
    } else if (calId === 'daypilot') {
        const view = calendarViews[calId] || 'month';
        if (view === 'month' && inst.month) {
            inst.month.startDate = inst.month.startDate.addMonths(-1);
            inst.month.update();
        } else if (inst.calendar) {
            const days = view === '3day' ? 3 : 7;
            inst.calendar.startDate = inst.calendar.startDate.addDays(-days);
            inst.calendar.update();
        }
    } else if (calId === 'dhtmlx') {
        const state = inst.getState();
        const d = state.date;
        const view = calendarViews[calId] || 'month';
        if (view === 'month') {
            inst.setCurrentView(new Date(d.getFullYear(), d.getMonth() - 1, 1));
        } else if (view === 'week') {
            inst.setCurrentView(new Date(d.getTime() - 7 * 86400000));
        } else {
            inst.setCurrentView(new Date(d.getTime() - 3 * 86400000));
        }
    }
    updateDateLabels();
}

function calendarNext(calId) {
    const inst = calendarInstances[calId];
    if (!inst) return;

    if (calId === 'fullcalendar') {
        inst.next();
    } else if (calId === 'toastui') {
        inst.next();
    } else if (calId === 'daypilot') {
        const view = calendarViews[calId] || 'month';
        if (view === 'month' && inst.month) {
            inst.month.startDate = inst.month.startDate.addMonths(1);
            inst.month.update();
        } else if (inst.calendar) {
            const days = view === '3day' ? 3 : 7;
            inst.calendar.startDate = inst.calendar.startDate.addDays(days);
            inst.calendar.update();
        }
    } else if (calId === 'dhtmlx') {
        const state = inst.getState();
        const d = state.date;
        const view = calendarViews[calId] || 'month';
        if (view === 'month') {
            inst.setCurrentView(new Date(d.getFullYear(), d.getMonth() + 1, 1));
        } else if (view === 'week') {
            inst.setCurrentView(new Date(d.getTime() + 7 * 86400000));
        } else {
            inst.setCurrentView(new Date(d.getTime() + 3 * 86400000));
        }
    }
    updateDateLabels();
}

function calendarChangeView(calId, view) {
    const inst = calendarInstances[calId];
    if (!inst) return;

    if (calId === 'fullcalendar') {
        if (view === 'month') inst.changeView('dayGridMonth');
        else if (view === 'week') inst.changeView('timeGridWeek');
        else if (view === '3day') {
            // FullCalendar doesn't have a built-in 3-day; use timeGrid with duration
            inst.changeView('timeGrid', {
                type: 'timeGrid',
                duration: { days: 3 },
            });
        }
    } else if (calId === 'toastui') {
        if (view === 'month') inst.changeView('month');
        else if (view === 'week') inst.changeView('week');
        else if (view === '3day') {
            // TOAST UI doesn't have native 3-day. Use week view with options.
            inst.changeView('week');
            // Note: TOAST UI doesn't support arbitrary day counts out of the box.
            // We show the full week view as the closest alternative.
        }
    } else if (calId === 'daypilot') {
        const monthEl = document.getElementById('daypilot-month');
        const calEl = document.getElementById('daypilot-calendar');
        if (view === 'month') {
            monthEl.style.display = '';
            calEl.style.display = 'none';
            inst.activeView = 'month';
            inst.month.update();
        } else {
            monthEl.style.display = 'none';
            calEl.style.display = '';
            inst.calendar.viewType = view === '3day' ? 'Days' : 'Week';
            if (view === '3day') inst.calendar.days = 3;
            else inst.calendar.days = 7;
            inst.calendar.update();
            inst.activeView = 'calendar';
        }
    } else if (calId === 'dhtmlx') {
        if (view === 'month') inst.setCurrentView(inst.getState().date, 'month');
        else if (view === 'week') inst.setCurrentView(inst.getState().date, 'week');
        else if (view === '3day') {
            // DHTMLX doesn't have built-in 3-day. Use week as fallback.
            inst.setCurrentView(inst.getState().date, 'week');
        }
    }
    updateDateLabels();
}

// ---- Initialize the active tab on load ----
requestAnimationFrame(() => initCalendar(config.activeMode));

// ---- Window resize handler ----
window.addEventListener('resize', () => resizeCalendar(config.activeMode));
