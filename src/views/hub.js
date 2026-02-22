import { api } from '../core/api.js';
import { events } from '../core/events.js';
import { router } from '../core/router.js';

const NODE_ICONS = {
    page: '&#128196;', database: '&#128202;', folder: '&#128193;',
    canvas: '&#127912;', calendar_event: '&#128197;', file: '&#128206;', record: '&#128221;'
};

export function hubView(params) {
    let el = null;
    let hubData = null;

    return {
        async render() {
            el = document.createElement('div');
            el.className = 'view-container';
            el.innerHTML = '<div class="view-body"><p style="color:var(--text-muted)">Loading...</p></div>';

            try {
                hubData = await api.getHub(params.id);
                _renderHub();
            } catch (e) {
                el.innerHTML = `<div class="view-body"><p style="color:var(--accent-danger)">Failed to load hub</p></div>`;
            }

            return el;
        },
        destroy() { el = null; }
    };

    function _renderHub() {
        const children = hubData.children || [];

        el.innerHTML = `
            <div class="view-header" style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h1 style="color: ${hubData.color}">${esc(hubData.name)}</h1>
                    <p>${children.length} item${children.length !== 1 ? 's' : ''}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-ghost btn-sm" id="hub-add-page">+ Page</button>
                    <button class="btn btn-ghost btn-sm" id="hub-add-db">+ Database</button>
                    <button class="btn btn-ghost btn-sm" id="hub-add-folder">+ Folder</button>
                </div>
            </div>
            <div class="view-body">
                ${children.length === 0
                    ? `<div class="empty-state">
                         <div class="empty-icon">&#128196;</div>
                         <h3>Empty hub</h3>
                         <p>Add pages, databases, or folders to start organizing.</p>
                       </div>`
                    : `<div class="card-grid" id="hub-items">
                         ${children.map(node => `
                             <div class="card" data-node-id="${node.id}" data-node-type="${node.node_type}">
                                 <div class="card-icon">${NODE_ICONS[node.node_type] || '&#128196;'}</div>
                                 <div class="card-title">${esc(node.title)}</div>
                                 <div class="card-meta">${node.node_type}</div>
                             </div>
                         `).join('')}
                       </div>`
                }
            </div>
        `;

        // Card clicks
        el.querySelector('#hub-items')?.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const type = card.dataset.nodeType;
                const id = card.dataset.nodeId;
                if (type === 'page') router.navigate(`/page/${id}`);
                else if (type === 'database') router.navigate(`/database/${id}`);
                else if (type === 'canvas') router.navigate(`/canvas/${id}`);
                else if (type === 'folder') router.navigate(`/folder/${id}`);
            }
        });

        // Add buttons
        el.querySelector('#hub-add-page')?.addEventListener('click', async () => {
            const node = await api.createNode({
                hub_id: hubData.id, node_type: 'page', title: 'Untitled Page'
            });
            events.emit('node:created', node);
            router.navigate(`/page/${node.id}`);
        });

        el.querySelector('#hub-add-db')?.addEventListener('click', async () => {
            const node = await api.createNode({
                hub_id: hubData.id, node_type: 'database', title: 'Untitled Database'
            });
            events.emit('node:created', node);
            router.navigate(`/database/${node.id}`);
        });

        el.querySelector('#hub-add-folder')?.addEventListener('click', async () => {
            const node = await api.createNode({
                hub_id: hubData.id, node_type: 'folder', title: 'New Folder'
            });
            events.emit('node:created', node);
            hubData.children.push(node);
            _renderHub();
        });
    }
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
