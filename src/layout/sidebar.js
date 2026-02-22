import { api } from '../core/api.js';
import { events } from '../core/events.js';
import { router } from '../core/router.js';

const NODE_ICONS = {
    page: '&#128196;',
    database: '&#128202;',
    folder: '&#128193;',
    canvas: '&#127912;',
    calendar_event: '&#128197;',
    file: '&#128206;',
    record: '&#128221;'
};

export class Sidebar {
    constructor(container) {
        this.container = container;
        this.hubs = [];
        this.activeHubId = null;
        this.expandedNodes = new Set();
        this.activeNodeId = null;
    }

    async init() {
        this._render();
        await this.loadHubs();
        this._bindEvents();
    }

    _render() {
        this.container.innerHTML = `
            <div class="app-sidebar-header">
                <h2>Workspace</h2>
                <button class="toolbar-btn" id="sidebar-new-hub" title="New Hub">+</button>
            </div>
            <div class="app-sidebar-content" id="sidebar-hubs"></div>
        `;
    }

    async loadHubs() {
        this.hubs = await api.getHubs();
        this._renderHubs();
    }

    _renderHubs() {
        const container = this.container.querySelector('#sidebar-hubs');

        let html = '<div class="sidebar-section">';

        // Master Calendar link
        html += `
            <div class="sidebar-item" data-action="calendar">
                <span class="icon">&#128197;</span>
                <span class="label">Master Calendar</span>
            </div>
        `;

        html += '<div class="sidebar-section-title">Hubs</div>';

        for (const hub of this.hubs) {
            const isActive = hub.id === this.activeHubId;
            html += `
                <div class="hub-item ${isActive ? 'active' : ''}" data-hub-id="${hub.id}">
                    <div class="hub-icon" style="background: ${hub.color}20; color: ${hub.color}">
                        ${this._hubIconChar(hub.icon)}
                    </div>
                    <div class="hub-info">
                        <div class="hub-name">${this._esc(hub.name)}</div>
                    </div>
                </div>
                <div class="hub-children" id="hub-children-${hub.id}" style="display: ${isActive ? 'block' : 'none'}"></div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;

        // If a hub is active, load its children
        if (this.activeHubId) {
            this._loadHubChildren(this.activeHubId);
        }
    }

    async _loadHubChildren(hubId) {
        const container = this.container.querySelector(`#hub-children-${hubId}`);
        if (!container) return;

        try {
            const hub = await api.getHub(hubId);
            const children = hub.children || [];
            container.innerHTML = this._renderNodeTree(children, 0);
        } catch (e) {
            console.error('Failed to load hub children:', e);
        }
    }

    _renderNodeTree(nodes, depth) {
        if (!nodes.length) return '';

        let html = '';
        for (const node of nodes) {
            const isExpanded = this.expandedNodes.has(node.id);
            const isActive = node.id === this.activeNodeId;
            const hasChildren = ['database', 'folder'].includes(node.node_type);
            const icon = NODE_ICONS[node.node_type] || '&#128196;';

            html += `
                <div class="tree-item ${isActive ? 'active' : ''}"
                     data-node-id="${node.id}" data-node-type="${node.node_type}"
                     style="--depth: ${depth}">
                    <span class="tree-toggle" data-toggle="${node.id}" style="visibility: ${hasChildren ? 'visible' : 'hidden'}">
                        ${isExpanded ? '&#9660;' : '&#9654;'}
                    </span>
                    <span class="node-icon">${icon}</span>
                    <span class="node-title">${this._esc(node.title)}</span>
                </div>
                <div class="tree-children" id="node-children-${node.id}"
                     style="display: ${isExpanded ? 'block' : 'none'}"></div>
            `;
        }
        return html;
    }

    _bindEvents() {
        this.container.addEventListener('click', async (e) => {
            // New hub button
            if (e.target.closest('#sidebar-new-hub')) {
                events.emit('dialog:create-hub');
                return;
            }

            // Master Calendar
            const calItem = e.target.closest('[data-action="calendar"]');
            if (calItem) {
                this.activeNodeId = null;
                this._clearActive();
                calItem.classList.add('active');
                router.navigate('/calendar');
                return;
            }

            // Hub click
            const hubItem = e.target.closest('.hub-item');
            if (hubItem) {
                const hubId = hubItem.dataset.hubId;
                this._setActiveHub(hubId);
                router.navigate(`/hub/${hubId}`);
                return;
            }

            // Tree toggle
            const toggle = e.target.closest('.tree-toggle');
            if (toggle && toggle.dataset.toggle) {
                e.stopPropagation();
                await this._toggleNode(toggle.dataset.toggle);
                return;
            }

            // Tree item click
            const treeItem = e.target.closest('.tree-item');
            if (treeItem) {
                const nodeId = treeItem.dataset.nodeId;
                const nodeType = treeItem.dataset.nodeType;
                this._setActiveNode(nodeId);

                if (nodeType === 'page') {
                    router.navigate(`/page/${nodeId}`);
                } else if (nodeType === 'database') {
                    router.navigate(`/database/${nodeId}`);
                } else if (nodeType === 'canvas') {
                    router.navigate(`/canvas/${nodeId}`);
                }
                return;
            }
        });

        // Context menu on right click
        this.container.addEventListener('contextmenu', (e) => {
            const hubItem = e.target.closest('.hub-item');
            const treeItem = e.target.closest('.tree-item');
            if (hubItem || treeItem) {
                e.preventDefault();
                const id = hubItem ? hubItem.dataset.hubId : treeItem.dataset.nodeId;
                const type = hubItem ? 'hub' : treeItem.dataset.nodeType;
                events.emit('context-menu', { x: e.clientX, y: e.clientY, id, type });
            }
        });

        // Listen for data changes to refresh
        events.on('hub:created', () => this.loadHubs());
        events.on('hub:updated', () => this.loadHubs());
        events.on('hub:deleted', () => this.loadHubs());
        events.on('node:created', () => {
            if (this.activeHubId) this._loadHubChildren(this.activeHubId);
        });
        events.on('node:updated', () => {
            if (this.activeHubId) this._loadHubChildren(this.activeHubId);
        });
        events.on('node:deleted', () => {
            if (this.activeHubId) this._loadHubChildren(this.activeHubId);
        });
    }

    _setActiveHub(hubId) {
        this.activeHubId = hubId;
        this.activeNodeId = null;

        // Hide all hub children, show selected
        this.container.querySelectorAll('.hub-item').forEach(el => {
            el.classList.toggle('active', el.dataset.hubId === hubId);
        });
        this.container.querySelectorAll('.hub-children').forEach(el => {
            el.style.display = 'none';
        });
        const children = this.container.querySelector(`#hub-children-${hubId}`);
        if (children) {
            children.style.display = 'block';
            this._loadHubChildren(hubId);
        }
    }

    _setActiveNode(nodeId) {
        this.activeNodeId = nodeId;
        this.container.querySelectorAll('.tree-item').forEach(el => {
            el.classList.toggle('active', el.dataset.nodeId === nodeId);
        });
    }

    _clearActive() {
        this.container.querySelectorAll('.hub-item.active, .tree-item.active, .sidebar-item.active').forEach(el => {
            el.classList.remove('active');
        });
    }

    async _toggleNode(nodeId) {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
            const childContainer = this.container.querySelector(`#node-children-${nodeId}`);
            if (childContainer) childContainer.style.display = 'none';
            const toggle = this.container.querySelector(`[data-toggle="${nodeId}"]`);
            if (toggle) toggle.innerHTML = '&#9654;';
        } else {
            this.expandedNodes.add(nodeId);
            const childContainer = this.container.querySelector(`#node-children-${nodeId}`);
            if (childContainer) {
                childContainer.style.display = 'block';
                // Load children
                const children = await api.getChildren(nodeId);
                childContainer.innerHTML = this._renderNodeTree(children, this._getDepth(nodeId) + 1);
            }
            const toggle = this.container.querySelector(`[data-toggle="${nodeId}"]`);
            if (toggle) toggle.innerHTML = '&#9660;';
        }
    }

    _getDepth(nodeId) {
        const item = this.container.querySelector(`[data-node-id="${nodeId}"]`);
        if (item) {
            return parseInt(getComputedStyle(item).getPropertyValue('--depth') || '0');
        }
        return 0;
    }

    _hubIconChar(icon) {
        const icons = {
            user: '&#128100;',
            folder: '&#128193;',
            book: '&#128214;',
            briefcase: '&#128188;',
            star: '&#11088;',
            heart: '&#10084;',
            gear: '&#9881;',
            home: '&#127968;',
            graduation: '&#127891;',
            money: '&#128176;'
        };
        return icons[icon] || '&#128193;';
    }

    _esc(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
