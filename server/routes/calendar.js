import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/connection.js';

const router = Router();
const uid = () => crypto.randomUUID().replace(/-/g, '');

// GET /api/v1/calendar/events - List events (Master Calendar or hub-scoped)
router.get('/events', (req, res) => {
    const db = getDb();
    const { hub_id, start, end } = req.query;

    let sql = 'SELECT * FROM calendar_events WHERE 1=1';
    const params = [];

    if (hub_id) {
        sql += ' AND hub_id = ?';
        params.push(hub_id);
    }
    if (start) {
        sql += ' AND (end_date >= ? OR (end_date IS NULL AND start_date >= ?))';
        params.push(start, start);
    }
    if (end) {
        sql += ' AND start_date <= ?';
        params.push(end);
    }

    sql += ' ORDER BY start_date';
    const events = db.prepare(sql).all(...params);

    // Format for DHTMLX Scheduler
    const formatted = events.map(e => ({
        id: e.id,
        text: e.title,
        start_date: e.start_date,
        end_date: e.end_date || e.start_date,
        color: e.color,
        hub_id: e.hub_id,
        node_id: e.node_id,
        description: e.description,
        all_day: e.all_day,
        source_type: e.source_type
    }));

    res.json(formatted);
});

// POST /api/v1/calendar/events - Create event
router.post('/events', (req, res) => {
    const db = getDb();
    const { hub_id, node_id, title, start_date, end_date, all_day, color, description, recurrence } = req.body;

    if (!hub_id || !title || !start_date) {
        return res.status(400).json({ error: true, message: 'hub_id, title, and start_date are required' });
    }

    const id = uid();
    db.prepare(`
        INSERT INTO calendar_events (id, node_id, hub_id, title, start_date, end_date, all_day, color, description, recurrence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, node_id || null, hub_id, title, start_date, end_date || null, all_day ? 1 : 0, color || null, description || '', recurrence || null);

    const event = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id);
    res.status(201).json(event);
});

// PUT /api/v1/calendar/events/:id - Update event
router.put('/events/:id', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: true, message: 'Event not found' });

    const { title, start_date, end_date, all_day, color, description, recurrence } = req.body;
    db.prepare(`
        UPDATE calendar_events SET
            title = ?, start_date = ?, end_date = ?, all_day = ?,
            color = ?, description = ?, recurrence = ?, updated_at = datetime('now')
        WHERE id = ?
    `).run(
        title ?? existing.title,
        start_date ?? existing.start_date,
        end_date !== undefined ? end_date : existing.end_date,
        all_day !== undefined ? (all_day ? 1 : 0) : existing.all_day,
        color !== undefined ? color : existing.color,
        description ?? existing.description,
        recurrence !== undefined ? recurrence : existing.recurrence,
        req.params.id
    );

    const updated = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(req.params.id);
    res.json(updated);
});

// DELETE /api/v1/calendar/events/:id - Delete event
router.delete('/events/:id', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM calendar_events WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

export default router;
