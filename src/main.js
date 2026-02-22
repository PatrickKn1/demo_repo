import './style.css';

/* ============================================================
   Tool - Main Application
   Two-sidebar layout with mode switching:
   Chat, Image, Planner — empty panels for now.
   ============================================================ */

const CONFIG_KEY = 'tool_config';
const DEFAULT_CONFIG = {
    activeMode: 'chat',
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
    chat: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>`,
    image: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`,
    planner: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    panelRight: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    moon: `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
};

const config = loadConfig();

// ---- Apply initial theme ----
if (config.theme === 'light') document.documentElement.setAttribute('data-theme', 'light');

// ---- Render Layout ----
document.getElementById('app').innerHTML = `
    <div class="top-bar">
        <div class="top-bar-left">
            <button class="icon-btn" id="toggle-left" title="Toggle left sidebar">${ICONS.sidebar}</button>
        </div>
        <div class="top-bar-center">
            <div class="mode-switcher">
                <button class="mode-btn ${config.activeMode === 'chat' ? 'active' : ''}" data-mode="chat">
                    ${ICONS.chat} Chat
                </button>
                <button class="mode-btn ${config.activeMode === 'image' ? 'active' : ''}" data-mode="image">
                    ${ICONS.image} Image
                </button>
                <button class="mode-btn ${config.activeMode === 'planner' ? 'active' : ''}" data-mode="planner">
                    ${ICONS.planner} Planner
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
            <!-- Chat Panel -->
            <div class="mode-panel ${config.activeMode === 'chat' ? 'active' : ''}" id="panel-chat">
                <div class="panel-placeholder">
                    <div class="placeholder-icon">${ICONS.chat}</div>
                    <h2>Chat</h2>
                </div>
            </div>

            <!-- Image Panel -->
            <div class="mode-panel ${config.activeMode === 'image' ? 'active' : ''}" id="panel-image">
                <div class="panel-placeholder">
                    <div class="placeholder-icon">${ICONS.image}</div>
                    <h2>Image</h2>
                </div>
            </div>

            <!-- Planner Panel -->
            <div class="mode-panel ${config.activeMode === 'planner' ? 'active' : ''}" id="panel-planner">
                <div class="panel-placeholder">
                    <div class="placeholder-icon">${ICONS.planner}</div>
                    <h2>Planner</h2>
                </div>
            </div>
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
    chat: document.getElementById('panel-chat'),
    image: document.getElementById('panel-image'),
    planner: document.getElementById('panel-planner'),
};

function setMode(mode) {
    config.activeMode = mode;
    saveConfig(config);
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    Object.entries(panels).forEach(([k, p]) => p.classList.toggle('active', k === mode));
}

modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

// ---- Sidebar Toggles ----
document.getElementById('toggle-left').addEventListener('click', () => {
    const sb = document.getElementById('sidebar-left');
    sb.classList.toggle('collapsed');
    config.leftSidebarOpen = !sb.classList.contains('collapsed');
    saveConfig(config);
});

document.getElementById('toggle-right').addEventListener('click', () => {
    const sb = document.getElementById('sidebar-right');
    sb.classList.toggle('collapsed');
    config.rightSidebarOpen = !sb.classList.contains('collapsed');
    saveConfig(config);
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
