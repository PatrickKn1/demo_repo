import { events } from '../core/events.js';
import { api } from '../core/api.js';
import { Sidebar } from './sidebar.js';
import { Toolbar } from './toolbar.js';

export class AppLayout {
    constructor() {
        this.sidebar = null;
        this.toolbar = null;
        this.sidebarEl = null;
        this.mainContentEl = null;
    }

    async init() {
        const app = document.getElementById('app');

        // Build the layout structure
        app.innerHTML = `
            <div class="app-toolbar" id="toolbar-container"></div>
            <div class="app-body">
                <div class="app-sidebar" id="sidebar-container"></div>
                <div class="resize-handle" id="resize-handle"></div>
                <div class="app-main" id="main-container">
                    <div class="app-main-content" id="main-content"></div>
                </div>
            </div>
        `;

        this.sidebarEl = app.querySelector('#sidebar-container');
        this.mainContentEl = app.querySelector('#main-content');

        // Initialize toolbar
        this.toolbar = new Toolbar(app.querySelector('#toolbar-container'));
        this.toolbar.init();

        // Initialize sidebar
        this.sidebar = new Sidebar(this.sidebarEl);
        await this.sidebar.init();

        // Sidebar toggle
        events.on('sidebar:toggle', () => {
            this.sidebarEl.classList.toggle('collapsed');
        });

        // Resize handle
        this._initResize(app.querySelector('#resize-handle'));

        // Dialog handlers
        this._initDialogs();

        return this.mainContentEl;
    }

    _initResize(handle) {
        let startX, startWidth;

        const onMouseMove = (e) => {
            const newWidth = startWidth + (e.clientX - startX);
            if (newWidth >= 200 && newWidth <= 400) {
                this.sidebarEl.style.width = `${newWidth}px`;
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        handle.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startWidth = this.sidebarEl.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    _initDialogs() {
        // Create Hub dialog
        events.on('dialog:create-hub', () => {
            this._showDialog('Create Hub', [
                { id: 'name', label: 'Hub Name', type: 'text', placeholder: 'e.g., Academic, Finance' },
                { id: 'color', label: 'Color', type: 'color', value: '#6366f1' }
            ], async (values) => {
                const hub = await api.createHub({ name: values.name, color: values.color });
                events.emit('hub:created', hub);
            });
        });

        // Create Node dialog
        events.on('dialog:create-node', ({ nodeType }) => {
            const labels = {
                page: 'Page', database: 'Database', folder: 'Folder',
                canvas: 'Canvas', calendar_event: 'Calendar Event'
            };

            // Need to know which hub to add to
            const hubId = this.sidebar?.activeHubId;
            if (!hubId && nodeType !== 'calendar_event') {
                alert('Please select a hub first.');
                return;
            }

            if (nodeType === 'calendar_event') {
                this._showDialog(`Create ${labels[nodeType] || nodeType}`, [
                    { id: 'title', label: 'Event Title', type: 'text', placeholder: 'Event name' },
                    { id: 'start_date', label: 'Start Date', type: 'datetime-local' },
                    { id: 'end_date', label: 'End Date', type: 'datetime-local' }
                ], async (values) => {
                    const hubs = await api.getHubs();
                    const hub = hubs[0];
                    if (!hub) return;

                    const event = await api.createCalendarEvent({
                        hub_id: hubId || hub.id,
                        title: values.title,
                        start_date: values.start_date?.replace('T', ' ') || new Date().toISOString().slice(0, 16).replace('T', ' '),
                        end_date: values.end_date?.replace('T', ' ') || null
                    });
                    events.emit('calendar:event-created', event);
                });
            } else {
                this._showDialog(`Create ${labels[nodeType] || nodeType}`, [
                    { id: 'title', label: 'Title', type: 'text', placeholder: `${labels[nodeType]} name` }
                ], async (values) => {
                    const node = await api.createNode({
                        hub_id: hubId,
                        node_type: nodeType,
                        title: values.title || `Untitled ${labels[nodeType]}`
                    });
                    events.emit('node:created', node);
                });
            }
        });

        // Context menu
        events.on('context-menu', ({ x, y, id, type }) => {
            this._showContextMenu(x, y, id, type);
        });
    }

    _showDialog(title, fields, onSubmit) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog">
                <h3>${title}</h3>
                ${fields.map(f => `
                    <div class="dialog-field">
                        <label>${f.label}</label>
                        <input type="${f.type || 'text'}" id="dialog-${f.id}"
                               placeholder="${f.placeholder || ''}"
                               value="${f.value || ''}" />
                    </div>
                `).join('')}
                <div class="dialog-actions">
                    <button class="btn btn-ghost" id="dialog-cancel">Cancel</button>
                    <button class="btn btn-primary" id="dialog-submit">Create</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        overlay.querySelector('#dialog-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#dialog-submit').addEventListener('click', async () => {
            const values = {};
            for (const f of fields) {
                values[f.id] = overlay.querySelector(`#dialog-${f.id}`).value;
            }
            try {
                await onSubmit(values);
                overlay.remove();
            } catch (e) {
                console.error('Dialog submit error:', e);
                alert('Error: ' + e.message);
            }
        });

        // Enter key submits
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') overlay.querySelector('#dialog-submit')?.click();
            if (e.key === 'Escape') overlay.remove();
        });

        // Focus first input
        requestAnimationFrame(() => {
            const firstInput = overlay.querySelector('input');
            if (firstInput) firstInput.focus();
        });
    }

    _showContextMenu(x, y, id, type) {
        document.querySelectorAll('.context-menu').forEach(m => m.remove());

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.top = `${y}px`;
        menu.style.left = `${x}px`;

        let items = '';
        if (type === 'hub') {
            items = `
                <div class="context-menu-item" data-action="rename">&#9998; Rename</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="delete" style="color:var(--accent-danger)">&#128465; Delete Hub</div>
            `;
        } else {
            items = `
                <div class="context-menu-item" data-action="rename">&#9998; Rename</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="delete" style="color:var(--accent-danger)">&#128465; Delete</div>
            `;
        }

        menu.innerHTML = items;
        document.body.appendChild(menu);

        // Keep menu in viewport
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 8}px`;
        if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 8}px`;

        menu.addEventListener('click', async (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (!action) return;

            if (action === 'rename') {
                const newName = prompt('Enter new name:');
                if (newName) {
                    try {
                        if (type === 'hub') {
                            await api.updateHub(id, { name: newName });
                            events.emit('hub:updated');
                        } else {
                            await api.updateNode(id, { title: newName });
                            events.emit('node:updated');
                        }
                    } catch (err) {
                        console.error('Rename failed:', err);
                    }
                }
            } else if (action === 'delete') {
                if (confirm('Are you sure you want to delete this?')) {
                    try {
                        if (type === 'hub') {
                            await api.deleteHub(id);
                            events.emit('hub:deleted');
                        } else {
                            await api.deleteNode(id);
                            events.emit('node:deleted');
                        }
                    } catch (err) {
                        console.error('Delete failed:', err);
                    }
                }
            }

            menu.remove();
        });

        const close = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }
}
