import './style.css';

/* ============================================================
   Tool - Main Application
   FullCalendar with Month, Week, and 3-Day views
   ============================================================ */

import { api } from './core/api.js';
import { toFullCalendar, formatDate } from './calendars/adapters.js';

const CONFIG_KEY = 'tool_config';
const DEFAULT_CONFIG = {
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
let calendar = null;
let currentView = 'month';
let defaultHubId = null;

// ---- Render Layout ----
document.getElementById('app').innerHTML = `
    <div class="top-bar">
        <div class="top-bar-left">
            <button class="icon-btn" id="toggle-left" title="Toggle left sidebar">${ICONS.sidebar}</button>
        </div>
        <div class="top-bar-center">
            <h2 class="top-bar-title">Calendar</h2>
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
            <div class="panel-toolbar">
                <div class="panel-toolbar-left">
                    <button class="toolbar-btn" id="btn-today">Today</button>
                    <button class="toolbar-btn icon-only" id="btn-prev">${ICONS.chevronLeft}</button>
                    <button class="toolbar-btn icon-only" id="btn-next">${ICONS.chevronRight}</button>
                    <span class="toolbar-date" id="date-label"></span>
                </div>
                <div class="panel-toolbar-right">
                    <div class="view-switcher">
                        <button class="view-btn active" data-view="month">Month</button>
                        <button class="view-btn" data-view="week">Week</button>
                        <button class="view-btn" data-view="3day">3-Day</button>
                    </div>
                </div>
            </div>
            <div class="calendar-body" id="cal-body"></div>
        </div>

        <div class="sidebar sidebar-right ${config.rightSidebarOpen ? '' : 'collapsed'}" id="sidebar-right">
            <div class="sidebar-header"><h3>Details</h3></div>
            <div class="sidebar-content" id="right-sidebar-content"></div>
        </div>
    </div>
`;

// ---- Sidebar Toggles ----
document.getElementById('toggle-left').addEventListener('click', () => {
    const sb = document.getElementById('sidebar-left');
    sb.classList.toggle('collapsed');
    config.leftSidebarOpen = !sb.classList.contains('collapsed');
    saveConfig(config);
    setTimeout(() => { if (calendar) calendar.updateSize(); }, 350);
});

document.getElementById('toggle-right').addEventListener('click', () => {
    const sb = document.getElementById('sidebar-right');
    sb.classList.toggle('collapsed');
    config.rightSidebarOpen = !sb.classList.contains('collapsed');
    saveConfig(config);
    setTimeout(() => { if (calendar) calendar.updateSize(); }, 350);
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

// ---- Calendar Toolbar ----
document.getElementById('btn-today').addEventListener('click', () => {
    if (calendar) { calendar.today(); updateDateLabel(); }
});
document.getElementById('btn-prev').addEventListener('click', () => {
    if (calendar) { calendar.prev(); updateDateLabel(); }
});
document.getElementById('btn-next').addEventListener('click', () => {
    if (calendar) { calendar.next(); updateDateLabel(); }
});

document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        currentView = view;
        if (!calendar) return;
        if (view === 'month') calendar.changeView('dayGridMonth');
        else if (view === 'week') calendar.changeView('timeGridWeek');
        else if (view === '3day') {
            calendar.changeView('timeGrid', {
                type: 'timeGrid',
                duration: { days: 3 },
            });
        }
        updateDateLabel();
    });
});

function updateDateLabel() {
    const label = document.getElementById('date-label');
    if (calendar && label) {
        label.textContent = calendar.view.title;
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

// ---- Refresh calendar ----
async function refreshCalendar() {
    if (!calendar) return;
    const events = await loadEvents();
    calendar.removeAllEvents();
    toFullCalendar(events).forEach(ev => calendar.addEvent(ev));
    updateDateLabel();
}

// ============================================================
//   FullCalendar Initialization
// ============================================================

async function initCalendar() {
    const container = document.getElementById('cal-body');
    if (!container) return;
    container.innerHTML = '<div class="calendar-loading">Loading Calendar...</div>';

    // Load default hub
    try {
        const hubs = await api.getHubs();
        if (hubs.length > 0) defaultHubId = hubs[0].id;
    } catch (e) {
        console.error('Failed to load hubs:', e);
    }

    // Dynamic imports
    let FullCalendarLib, DayGridPlugin, TimeGridPlugin, InteractionPlugin;
    try {
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
    container.innerHTML = '';

    calendar = new FullCalendarLib.Calendar(container, {
        plugins: [DayGridPlugin, TimeGridPlugin, InteractionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: false,
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
                calendar.unselect();
                return;
            }
            try {
                await api.createCalendarEvent({
                    hub_id: defaultHubId,
                    title,
                    start_date: formatDate(info.start),
                    end_date: formatDate(info.end),
                    all_day: info.allDay ? 1 : 0,
                });
                calendar.unselect();
                await refreshCalendar();
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
                await refreshCalendar();
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
                await refreshCalendar();
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
                    await refreshCalendar();
                } catch (e) {
                    console.error('Failed to delete event:', e);
                }
            }
        },

        datesSet: () => updateDateLabel(),
    });

    calendar.render();
    updateDateLabel();
}

// ---- Initialize on load ----
requestAnimationFrame(() => initCalendar());

// ---- Window resize handler ----
window.addEventListener('resize', () => { if (calendar) calendar.updateSize(); });
