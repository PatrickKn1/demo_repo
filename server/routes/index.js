import { Router } from 'express';
import hubsRouter from './hubs.js';
import nodesRouter from './nodes.js';
import pagesRouter from './pages.js';
import databasesRouter from './databases.js';
import calendarRouter from './calendar.js';
import filesRouter from './files.js';
import { getDb } from '../db/connection.js';

const router = Router();

router.use('/v1/hubs', hubsRouter);
router.use('/v1/nodes', nodesRouter);
router.use('/v1/pages', pagesRouter);
router.use('/v1/databases', databasesRouter);
router.use('/v1/calendar', calendarRouter);
router.use('/v1/files', filesRouter);
// GET /api/v1/search?q=term - Full-text search
router.get('/v1/search', (req, res) => {
    const db = getDb();
    const { q } = req.query;
    if (!q) return res.json([]);

    const results = db.prepare(`
        SELECT s.node_id, s.title, snippet(search_index, 2, '<mark>', '</mark>', '...', 32) as snippet,
               n.node_type, n.hub_id
        FROM search_index s
        JOIN nodes n ON n.id = s.node_id
        WHERE search_index MATCH ?
        ORDER BY rank
        LIMIT 50
    `).all(q);

    res.json(results);
});

export default router;
