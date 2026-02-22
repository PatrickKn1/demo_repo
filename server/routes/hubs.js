import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/connection.js';

const router = Router();
const uid = () => crypto.randomUUID().replace(/-/g, '');

// GET /api/v1/hubs - List all hubs
router.get('/', (req, res) => {
    const db = getDb();
    const hubs = db.prepare('SELECT * FROM hubs ORDER BY sort_order, name').all();
    res.json(hubs);
});

// POST /api/v1/hubs - Create a hub
router.post('/', (req, res) => {
    const db = getDb();
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ error: true, message: 'Name is required' });

    const id = uid();
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM hubs').get();
    db.prepare('INSERT INTO hubs (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)')
        .run(id, name, icon || 'folder', color || '#6366f1', maxOrder.next);

    const hub = db.prepare('SELECT * FROM hubs WHERE id = ?').get(id);
    res.status(201).json(hub);
});

// GET /api/v1/hubs/:id - Get hub with top-level children
router.get('/:id', (req, res) => {
    const db = getDb();
    const hub = db.prepare('SELECT * FROM hubs WHERE id = ?').get(req.params.id);
    if (!hub) return res.status(404).json({ error: true, message: 'Hub not found' });

    const children = db.prepare(
        'SELECT * FROM nodes WHERE hub_id = ? AND parent_id IS NULL AND is_archived = 0 ORDER BY sort_order, title'
    ).all(req.params.id);

    res.json({ ...hub, children });
});

// PUT /api/v1/hubs/:id - Update hub
router.put('/:id', (req, res) => {
    const db = getDb();
    const { name, icon, color, sort_order } = req.body;
    const hub = db.prepare('SELECT * FROM hubs WHERE id = ?').get(req.params.id);
    if (!hub) return res.status(404).json({ error: true, message: 'Hub not found' });

    db.prepare(
        'UPDATE hubs SET name = ?, icon = ?, color = ?, sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(
        name ?? hub.name,
        icon ?? hub.icon,
        color ?? hub.color,
        sort_order ?? hub.sort_order,
        req.params.id
    );

    const updated = db.prepare('SELECT * FROM hubs WHERE id = ?').get(req.params.id);
    res.json(updated);
});

// DELETE /api/v1/hubs/:id - Delete hub
router.delete('/:id', (req, res) => {
    const db = getDb();
    const hub = db.prepare('SELECT * FROM hubs WHERE id = ?').get(req.params.id);
    if (!hub) return res.status(404).json({ error: true, message: 'Hub not found' });

    db.prepare('DELETE FROM hubs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

export default router;
