import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/connection.js';

const router = Router();
const uid = () => crypto.randomUUID().replace(/-/g, '');

// GET /api/v1/databases/:nodeId/schema - Get database schema (columns)
router.get('/:nodeId/schema', (req, res) => {
    const db = getDb();
    const schema = db.prepare('SELECT * FROM database_schemas WHERE node_id = ?').get(req.params.nodeId);
    if (!schema) return res.status(404).json({ error: true, message: 'Database not found' });

    const columns = db.prepare(
        'SELECT * FROM database_columns WHERE database_id = ? ORDER BY sort_order'
    ).all(req.params.nodeId);

    res.json({
        ...schema,
        view_config: JSON.parse(schema.view_config || '{}'),
        columns
    });
});

// POST /api/v1/databases/:nodeId/columns - Add a column
router.post('/:nodeId/columns', (req, res) => {
    const db = getDb();
    const { name, column_type, config, is_required } = req.body;
    if (!name || !column_type) {
        return res.status(400).json({ error: true, message: 'name and column_type are required' });
    }

    const id = uid();
    const maxOrder = db.prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM database_columns WHERE database_id = ?'
    ).get(req.params.nodeId);

    db.prepare(
        'INSERT INTO database_columns (id, database_id, name, column_type, config, sort_order, is_required) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.nodeId, name, column_type, JSON.stringify(config || {}), maxOrder.next, is_required ? 1 : 0);

    const column = db.prepare('SELECT * FROM database_columns WHERE id = ?').get(id);
    res.status(201).json(column);
});

// PUT /api/v1/databases/:nodeId/columns/:colId - Update a column
router.put('/:nodeId/columns/:colId', (req, res) => {
    const db = getDb();
    const col = db.prepare('SELECT * FROM database_columns WHERE id = ?').get(req.params.colId);
    if (!col) return res.status(404).json({ error: true, message: 'Column not found' });

    const { name, column_type, config, sort_order, is_required } = req.body;
    db.prepare(
        'UPDATE database_columns SET name = ?, column_type = ?, config = ?, sort_order = ?, is_required = ? WHERE id = ?'
    ).run(
        name ?? col.name,
        column_type ?? col.column_type,
        config !== undefined ? JSON.stringify(config) : col.config,
        sort_order ?? col.sort_order,
        is_required !== undefined ? (is_required ? 1 : 0) : col.is_required,
        req.params.colId
    );

    const updated = db.prepare('SELECT * FROM database_columns WHERE id = ?').get(req.params.colId);
    res.json(updated);
});

// DELETE /api/v1/databases/:nodeId/columns/:colId - Delete a column
router.delete('/:nodeId/columns/:colId', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM record_values WHERE column_id = ?').run(req.params.colId);
    db.prepare('DELETE FROM database_columns WHERE id = ?').run(req.params.colId);
    res.json({ success: true });
});

// GET /api/v1/databases/:nodeId/records - List records with values
router.get('/:nodeId/records', (req, res) => {
    const db = getDb();

    const records = db.prepare(
        'SELECT * FROM nodes WHERE parent_id = ? AND node_type = \'record\' AND is_archived = 0 ORDER BY sort_order'
    ).all(req.params.nodeId);

    const columns = db.prepare(
        'SELECT * FROM database_columns WHERE database_id = ? ORDER BY sort_order'
    ).all(req.params.nodeId);

    const result = records.map(record => {
        const values = db.prepare(
            'SELECT * FROM record_values WHERE record_id = ?'
        ).all(record.id);

        const valueMap = {};
        for (const v of values) {
            const col = columns.find(c => c.id === v.column_id);
            if (col) {
                if (col.column_type === 'number') valueMap[col.id] = v.value_num;
                else if (col.column_type === 'date' || col.column_type === 'datetime') valueMap[col.id] = v.value_date;
                else if (['multi_select', 'relation'].includes(col.column_type)) valueMap[col.id] = JSON.parse(v.value_json || '[]');
                else valueMap[col.id] = v.value_text;
            }
        }

        return { ...record, values: valueMap };
    });

    res.json({ records: result, columns });
});

// POST /api/v1/databases/:nodeId/records - Create a record
router.post('/:nodeId/records', (req, res) => {
    const db = getDb();
    const { title, values } = req.body;

    // Get the database's hub_id
    const dbNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.nodeId);
    if (!dbNode) return res.status(404).json({ error: true, message: 'Database node not found' });

    const recordId = uid();
    const maxOrder = db.prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM nodes WHERE parent_id = ?'
    ).get(req.params.nodeId);

    // Create the record node
    db.prepare(
        'INSERT INTO nodes (id, hub_id, parent_id, node_type, title, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(recordId, dbNode.hub_id, req.params.nodeId, 'record', title || 'Untitled', maxOrder.next);

    // Insert values
    if (values && typeof values === 'object') {
        const columns = db.prepare('SELECT * FROM database_columns WHERE database_id = ?').all(req.params.nodeId);
        const insertValue = db.prepare(
            'INSERT INTO record_values (id, record_id, column_id, value_text, value_num, value_date, value_json) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        for (const [colId, value] of Object.entries(values)) {
            const col = columns.find(c => c.id === colId);
            if (!col) continue;

            const valId = uid();
            if (col.column_type === 'number') {
                insertValue.run(valId, recordId, colId, null, value, null, null);
            } else if (col.column_type === 'date' || col.column_type === 'datetime') {
                insertValue.run(valId, recordId, colId, null, null, value, null);
            } else if (['multi_select', 'relation'].includes(col.column_type)) {
                insertValue.run(valId, recordId, colId, null, null, null, JSON.stringify(value));
            } else {
                insertValue.run(valId, recordId, colId, String(value), null, null, null);
            }
        }
    }

    const record = db.prepare('SELECT * FROM nodes WHERE id = ?').get(recordId);
    res.status(201).json(record);
});

// PUT /api/v1/databases/:nodeId/records/:recId - Update record values
router.put('/:nodeId/records/:recId', (req, res) => {
    const db = getDb();
    const { title, values } = req.body;

    if (title !== undefined) {
        db.prepare('UPDATE nodes SET title = ?, updated_at = datetime(\'now\') WHERE id = ?')
            .run(title, req.params.recId);
    }

    if (values && typeof values === 'object') {
        const columns = db.prepare('SELECT * FROM database_columns WHERE database_id = ?').all(req.params.nodeId);
        const upsertValue = db.prepare(`
            INSERT INTO record_values (id, record_id, column_id, value_text, value_num, value_date, value_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(record_id, column_id) DO UPDATE SET
                value_text = excluded.value_text,
                value_num = excluded.value_num,
                value_date = excluded.value_date,
                value_json = excluded.value_json
        `);

        for (const [colId, value] of Object.entries(values)) {
            const col = columns.find(c => c.id === colId);
            if (!col) continue;

            const valId = uid();
            if (col.column_type === 'number') {
                upsertValue.run(valId, req.params.recId, colId, null, value, null, null);
            } else if (col.column_type === 'date' || col.column_type === 'datetime') {
                upsertValue.run(valId, req.params.recId, colId, null, null, value, null);
            } else if (['multi_select', 'relation'].includes(col.column_type)) {
                upsertValue.run(valId, req.params.recId, colId, null, null, null, JSON.stringify(value));
            } else {
                upsertValue.run(valId, req.params.recId, colId, String(value), null, null, null);
            }
        }
    }

    const record = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.recId);
    res.json(record);
});

// DELETE /api/v1/databases/:nodeId/records/:recId - Delete a record
router.delete('/:nodeId/records/:recId', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM nodes WHERE id = ?').run(req.params.recId);
    res.json({ success: true });
});

export default router;
