import { events } from '../core/events.js';
import { router } from '../core/router.js';
import { api } from '../core/api.js';

export class Toolbar {
    constructor(container) {
        this.container = container;
        this._searchTimeout = null;
    }

    init() {
        this._render();
        this._bindEvents();
    }

    _render() {
        this.container.innerHTML = `
            <button class="toolbar-btn" id="toolbar-menu-toggle" title="Toggle Sidebar">&#9776;</button>
            <input type="text" class="toolbar-search" id="toolbar-search" placeholder="Search..." />
            <div class="toolbar-spacer"></div>
            <div class="toolbar-label" id="toolbar-calendar" title="Master Calendar">
                <span>&#128197;</span>
                <span>Calendar</span>
            </div>
            <div class="toolbar-label" id="toolbar-new" title="Create New">
                <span>&#10010;</span>
                <span>New</span>
            </div>
        `;
    }

    _bindEvents() {
        // Toggle sidebar
        this.container.querySelector('#toolbar-menu-toggle').addEventListener('click', () => {
            events.emit('sidebar:toggle');
        });

        // Calendar button
        this.container.querySelector('#toolbar-calendar').addEventListener('click', () => {
            router.navigate('/calendar');
        });

        // New button
        this.container.querySelector('#toolbar-new').addEventListener('click', (e) => {
            this._showNewMenu(e);
        });

        // Search
        this.container.querySelector('#toolbar-search').addEventListener('input', (e) => {
            clearTimeout(this._searchTimeout);
            this._searchTimeout = setTimeout(() => {
                const q = e.target.value.trim();
                if (q.length >= 2) {
                    events.emit('search:query', q);
                } else {
                    events.emit('search:clear');
                }
            }, 300);
        });
    }

    _showNewMenu(e) {
        // Remove existing menu
        document.querySelectorAll('.context-menu').forEach(m => m.remove());

        const rect = e.currentTarget.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
        menu.innerHTML = `
            <div class="context-menu-item" data-create="hub">
                <span>&#128193;</span> New Hub
            </div>
            <div class="context-menu-item" data-create="page">
                <span>&#128196;</span> New Page
            </div>
            <div class="context-menu-item" data-create="database">
                <span>&#128202;</span> New Database
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-create="calendar_event">
                <span>&#128197;</span> New Event
            </div>
        `;

        menu.addEventListener('click', (ev) => {
            const item = ev.target.closest('.context-menu-item');
            if (item) {
                const type = item.dataset.create;
                if (type === 'hub') {
                    events.emit('dialog:create-hub');
                } else {
                    events.emit('dialog:create-node', { nodeType: type });
                }
                menu.remove();
            }
        });

        document.body.appendChild(menu);

        // Close on click outside
        const close = (ev) => {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }
}
