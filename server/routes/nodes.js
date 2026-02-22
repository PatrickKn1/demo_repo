import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/connection.js';

const router = Router();
const uid = () => crypto.randomUUID().replace(/-/g, '');

// GET /api/v1/nodes/:id - Get a node by ID
router.get('/:id', (req, res) => {
    const db = getDb();
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    if (!node) return res.status(404).json({ error: true, message: 'Node not found' });
    res.json(node);
});

// GET /api/v1/nodes/:id/children - Get children of a node
router.get('/:id/children', (req, res) => {
    const db = getDb();
    const children = db.prepare(
        'SELECT * FROM nodes WHERE parent_id = ? AND is_archived = 0 ORDER BY sort_order, title'
    ).all(req.params.id);
    res.json(children);
});

// GET /api/v1/nodes/:id/breadcrumb - Get ancestor chain
router.get('/:id/breadcrumb', (req, res) => {
    const db = getDb();
    const breadcrumb = [];
    let current = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);

    while (current) {
        breadcrumb.unshift({ id: current.id, title: current.title, node_type: current.node_type });
        if (current.parent_id) {
            current = db.prepare('SELECT * FROM nodes WHERE id = ?').get(current.parent_id);
        } else {
            break;
        }
    }

    // Prepend the hub
    if (breadcrumb.length > 0) {
        const firstNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
        if (firstNode) {
            const hub = db.prepare('SELECT * FROM hubs WHERE id = ?').get(firstNode.hub_id);
            if (hub) {
                breadcrumb.unshift({ id: hub.id, title: hub.name, node_type: 'hub' });
            }
        }
    }

    res.json(breadcrumb);
});

// POST /api/v1/nodes - Create a node
router.post('/', (req, res) => {
    const db = getDb();
    const { hub_id, parent_id, node_type, title, icon } = req.body;

    if (!hub_id) return res.status(400).json({ error: true, message: 'hub_id is required' });
    if (!node_type) return res.status(400).json({ error: true, message: 'node_type is required' });

    const id = uid();
    const maxOrder = db.prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM nodes WHERE hub_id = ? AND parent_id IS ?'
    ).get(hub_id, parent_id || null);

    db.prepare(
        'INSERT INTO nodes (id, hub_id, parent_id, node_type, title, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, hub_id, parent_id || null, node_type, title || 'Untitled', icon || null, maxOrder.next);

    // Auto-create associated records based on type
    if (node_type === 'page') {
        db.prepare('INSERT INTO page_content (node_id, content, plain_text) VALUES (?, ?, ?)')
            .run(id, '{}', '');
    } else if (node_type === 'database') {
        db.prepare('INSERT INTO database_schemas (node_id, description, view_config) VALUES (?, ?, ?)')
            .run(id, '', '{}');
    }

    // Add to search index
    db.prepare('INSERT INTO search_index (node_id, title, content) VALUES (?, ?, ?)')
        .run(id, title || 'Untitled', '');

    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
    res.status(201).json(node);
});

// PUT /api/v1/nodes/:id - Update node metadata
router.put('/:id', (req, res) => {
    const db = getDb();
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    if (!node) return res.status(404).json({ error: true, message: 'Node not found' });

    const { title, icon, sort_order, is_archived } = req.body;
    db.prepare(
        'UPDATE nodes SET title = ?, icon = ?, sort_order = ?, is_archived = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(
        title ?? node.title,
        icon ?? node.icon,
        sort_order ?? node.sort_order,
        is_archived ?? node.is_archived,
        req.params.id
    );

    // Update search index
    if (title !== undefined) {
        db.prepare('UPDATE search_index SET title = ? WHERE node_id = ?').run(title, req.params.id);
    }

    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    res.json(updated);
});

// PATCH /api/v1/nodes/:id/move - Re-parent a node (drag-and-drop)
router.patch('/:id/move', (req, res) => {
    const db = getDb();
    const { parent_id, hub_id, sort_order } = req.body;
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    if (!node) return res.status(404).json({ error: true, message: 'Node not found' });

    db.prepare(
        'UPDATE nodes SET parent_id = ?, hub_id = ?, sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(
        parent_id !== undefined ? parent_id : node.parent_id,
        hub_id || node.hub_id,
        sort_order ?? node.sort_order,
        req.params.id
    );

    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    res.json(updated);
});

// DELETE /api/v1/nodes/:id - Delete node (cascades)
router.delete('/:id', (req, res) => {
    const db = getDb();
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
    if (!node) return res.status(404).json({ error: true, message: 'Node not found' });

    // Remove from search index
    db.prepare('DELETE FROM search_index WHERE node_id = ?').run(req.params.id);

    db.prepare('DELETE FROM nodes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

export default router;
