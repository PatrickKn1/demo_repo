import { api } from '../core/api.js';
import { events } from '../core/events.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export function pageView(params) {
    let el = null;
    let editor = null;
    let saveTimeout = null;
    let nodeData = null;

    return {
        async render() {
            el = document.createElement('div');
            el.className = 'view-container';
            el.innerHTML = '<div class="view-body"><p style="color:var(--text-muted)">Loading...</p></div>';

            try {
                nodeData = await api.getNode(params.id);
                const pageData = await api.getPageContent(params.id);
                _renderEditor(pageData.content);
            } catch (e) {
                el.innerHTML = `<div class="view-body"><p style="color:var(--accent-danger)">Failed to load page: ${e.message}</p></div>`;
            }

            return el;
        },
        destroy() {
            if (saveTimeout) clearTimeout(saveTimeout);
            if (editor) {
                // Final save
                _save();
                editor.destroy();
                editor = null;
            }
            el = null;
        }
    };

    function _renderEditor(content) {
        el.innerHTML = `
            <div class="breadcrumb" id="page-breadcrumb"></div>
            <div class="tiptap-editor">
                <div id="editor-status" style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
                    <span class="status-dot saved" id="save-indicator"></span>
                    <span style="font-size:var(--font-size-xs);color:var(--text-muted)" id="save-text">Saved</span>
                </div>
                <div id="editor-container"></div>
            </div>
        `;

        // Load breadcrumb
        _loadBreadcrumb();

        // Initialize TipTap editor
        editor = new Editor({
            element: el.querySelector('#editor-container'),
            extensions: [StarterKit],
            content: content && content.type ? content : {
                type: 'doc',
                content: [{ type: 'paragraph' }]
            },
            editorProps: {
                attributes: {
                    'data-placeholder': 'Start typing...'
                }
            },
            onUpdate: () => {
                _markDirty();
                _scheduleSave();
            }
        });
    }

    async function _loadBreadcrumb() {
        try {
            const crumbs = await api.getBreadcrumb(params.id);
            const container = el.querySelector('#page-breadcrumb');
            if (container) {
                container.innerHTML = crumbs.map((c, i) => {
                    const isLast = i === crumbs.length - 1;
                    return `
                        ${i > 0 ? '<span class="breadcrumb-separator">&#9654;</span>' : ''}
                        <span class="breadcrumb-item ${isLast ? 'current' : ''}"
                              data-id="${c.id}" data-type="${c.node_type}">
                            ${esc(c.title)}
                        </span>
                    `;
                }).join('');
            }
        } catch (e) {
            console.error('Failed to load breadcrumb:', e);
        }
    }

    function _markDirty() {
        const dot = el?.querySelector('#save-indicator');
        const text = el?.querySelector('#save-text');
        if (dot) dot.className = 'status-dot saving';
        if (text) text.textContent = 'Unsaved';
    }

    function _markSaved() {
        const dot = el?.querySelector('#save-indicator');
        const text = el?.querySelector('#save-text');
        if (dot) dot.className = 'status-dot saved';
        if (text) text.textContent = 'Saved';
    }

    function _scheduleSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => _save(), 1000);
    }

    async function _save() {
        if (!editor) return;
        try {
            const content = editor.getJSON();
            const plainText = editor.getText();
            await api.savePageContent(params.id, content, plainText);
            _markSaved();
        } catch (e) {
            console.error('Failed to save:', e);
            const dot = el?.querySelector('#save-indicator');
            const text = el?.querySelector('#save-text');
            if (dot) dot.className = 'status-dot error';
            if (text) text.textContent = 'Save failed';
        }
    }
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
