import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /api/v1/pages/:nodeId/content - Get page content
router.get('/:nodeId/content', (req, res) => {
    const db = getDb();
    const page = db.prepare('SELECT * FROM page_content WHERE node_id = ?').get(req.params.nodeId);
    if (!page) return res.status(404).json({ error: true, message: 'Page not found' });
    res.json({
        node_id: page.node_id,
        content: JSON.parse(page.content || '{}'),
        updated_at: page.updated_at
    });
});

// PUT /api/v1/pages/:nodeId/content - Save page content
router.put('/:nodeId/content', (req, res) => {
    const db = getDb();
    const { content, plain_text } = req.body;

    const page = db.prepare('SELECT * FROM page_content WHERE node_id = ?').get(req.params.nodeId);
    if (!page) return res.status(404).json({ error: true, message: 'Page not found' });

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    db.prepare(
        'UPDATE page_content SET content = ?, plain_text = ?, updated_at = datetime(\'now\') WHERE node_id = ?'
    ).run(contentStr, plain_text || '', req.params.nodeId);

    // Update node timestamp
    db.prepare('UPDATE nodes SET updated_at = datetime(\'now\') WHERE id = ?').run(req.params.nodeId);

    // Update search index
    db.prepare('UPDATE search_index SET content = ? WHERE node_id = ?')
        .run(plain_text || '', req.params.nodeId);

    res.json({ success: true });
});

export default router;
