import { api } from '../core/api.js';
import { events } from '../core/events.js';

const TYPE_LABELS = {
    text: 'Text', number: 'Number', date: 'Date', datetime: 'Date/Time',
    checkbox: 'Checkbox', select: 'Select', multi_select: 'Multi Select',
    url: 'URL', email: 'Email', phone: 'Phone', relation: 'Relation',
    formula: 'Formula', file: 'File', rich_text: 'Rich Text'
};

export function databaseView(params) {
    let el = null;
    let schema = null;
    let recordsData = null;

    return {
        async render() {
            el = document.createElement('div');
            el.className = 'view-container';
            el.innerHTML = '<div class="view-body"><p style="color:var(--text-muted)">Loading...</p></div>';

            try {
                schema = await api.getDbSchema(params.id);
                recordsData = await api.getDbRecords(params.id);
                _renderDatabase();
            } catch (e) {
                el.innerHTML = `<div class="view-body"><p style="color:var(--accent-danger)">Failed to load database: ${e.message}</p></div>`;
            }

            return el;
        },
        destroy() { el = null; }
    };

    function _renderDatabase() {
        const columns = recordsData.columns || [];
        const records = recordsData.records || [];
        const node = schema;

        el.innerHTML = `
            <div class="view-header" style="display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <h1>&#128202; Database</h1>
                    <p>${columns.length} columns, ${records.length} records</p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-ghost btn-sm" id="db-add-col">+ Column</button>
                    <button class="btn btn-primary btn-sm" id="db-add-row">+ Record</button>
                </div>
            </div>
            <div class="view-body" style="overflow:auto;">
                <div class="grid-container">
                    ${_renderTable(columns, records)}
                </div>
            </div>
        `;

        _bindActions();
    }

    function _renderTable(columns, records) {
        if (columns.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">&#128202;</div>
                    <h3>No columns defined</h3>
                    <p>Add columns to define your database structure, then add records.</p>
                </div>
            `;
        }

        let html = `
            <table style="width:100%;border-collapse:collapse;font-size:var(--font-size-sm);">
                <thead>
                    <tr style="border-bottom:2px solid var(--border-color);">
                        <th style="padding:8px 12px;text-align:left;color:var(--text-secondary);font-weight:600;white-space:nowrap;">Title</th>
                        ${columns.map(col => `
                            <th style="padding:8px 12px;text-align:left;color:var(--text-secondary);font-weight:600;white-space:nowrap;">
                                ${esc(col.name)}
                                <span style="font-size:var(--font-size-xs);color:var(--text-muted);font-weight:400;margin-left:4px;">${TYPE_LABELS[col.column_type] || col.column_type}</span>
                            </th>
                        `).join('')}
                        <th style="width:40px;"></th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (records.length === 0) {
            html += `
                <tr>
                    <td colspan="${columns.length + 2}" style="padding:24px;text-align:center;color:var(--text-muted);">
                        No records yet. Click "+ Record" to add one.
                    </td>
                </tr>
            `;
        } else {
            for (const record of records) {
                html += `
                    <tr style="border-bottom:1px solid var(--border-color);transition:background var(--transition-fast);"
                        onmouseover="this.style.background='var(--bg-hover)'"
                        onmouseout="this.style.background=''">
                        <td style="padding:8px 12px;">
                            <span style="color:var(--text-primary);font-weight:500;">${esc(record.title)}</span>
                        </td>
                        ${columns.map(col => {
                            const val = record.values[col.id];
                            return `<td style="padding:8px 12px;color:var(--text-secondary);">${formatValue(val, col.column_type)}</td>`;
                        }).join('')}
                        <td style="padding:8px 12px;">
                            <button class="toolbar-btn btn-sm" data-delete-record="${record.id}" title="Delete">&#128465;</button>
                        </td>
                    </tr>
                `;
            }
        }

        html += '</tbody></table>';
        return html;
    }

    function _bindActions() {
        // Add column
        el.querySelector('#db-add-col')?.addEventListener('click', () => {
            _showAddColumnDialog();
        });

        // Add record
        el.querySelector('#db-add-row')?.addEventListener('click', async () => {
            try {
                const record = await api.createDbRecord(params.id, { title: 'New Record' });
                events.emit('node:created', record);
                recordsData = await api.getDbRecords(params.id);
                _renderDatabase();
            } catch (e) {
                console.error('Failed to create record:', e);
            }
        });

        // Delete record
        el.querySelectorAll('[data-delete-record]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const recId = e.currentTarget.dataset.deleteRecord;
                try {
                    await api.deleteDbRecord(params.id, recId);
                    events.emit('node:deleted', { id: recId });
                    recordsData = await api.getDbRecords(params.id);
                    _renderDatabase();
                } catch (err) {
                    console.error('Failed to delete record:', err);
                }
            });
        });
    }

    function _showAddColumnDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog">
                <h3>Add Column</h3>
                <div class="dialog-field">
                    <label>Column Name</label>
                    <input type="text" id="col-name" placeholder="e.g., Due Date" />
                </div>
                <div class="dialog-field">
                    <label>Type</label>
                    <select id="col-type">
                        ${Object.entries(TYPE_LABELS).map(([k, v]) =>
                            `<option value="${k}">${v}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="dialog-actions">
                    <button class="btn btn-ghost" id="col-cancel">Cancel</button>
                    <button class="btn btn-primary" id="col-save">Add Column</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#col-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#col-save').addEventListener('click', async () => {
            const name = overlay.querySelector('#col-name').value.trim();
            const colType = overlay.querySelector('#col-type').value;
            if (!name) return;

            try {
                await api.addDbColumn(params.id, { name, column_type: colType });
                overlay.remove();
                schema = await api.getDbSchema(params.id);
                recordsData = await api.getDbRecords(params.id);
                _renderDatabase();
            } catch (e) {
                console.error('Failed to add column:', e);
            }
        });

        // Focus name input
        requestAnimationFrame(() => overlay.querySelector('#col-name')?.focus());
    }
}

function formatValue(val, type) {
    if (val === null || val === undefined || val === '') return '<span style="color:var(--text-muted)">-</span>';
    if (type === 'checkbox') return val ? '&#9745;' : '&#9744;';
    if (type === 'url') return `<a href="${esc(String(val))}" style="color:var(--accent-info);">${esc(String(val))}</a>`;
    return esc(String(val));
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
