import { Router } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb } from '../db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'data', 'vault', 'uploads');

const router = Router();
const uid = () => crypto.randomUUID().replace(/-/g, '');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uid()}${ext}`);
    }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

// POST /api/v1/files/upload - Upload file
router.post('/upload', upload.single('file'), (req, res) => {
    const db = getDb();
    const { node_id } = req.body;

    if (!req.file) return res.status(400).json({ error: true, message: 'No file uploaded' });

    const id = uid();
    db.prepare(`
        INSERT INTO files (id, node_id, filename, original_name, mime_type, size_bytes, storage_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        node_id || null,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        `uploads/${req.file.filename}`
    );

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    res.status(201).json(file);
});

// GET /api/v1/files/:id - Get file metadata
router.get('/:id', (req, res) => {
    const db = getDb();
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
    if (!file) return res.status(404).json({ error: true, message: 'File not found' });
    res.json(file);
});

// DELETE /api/v1/files/:id - Delete file
router.delete('/:id', (req, res) => {
    const db = getDb();
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
    if (!file) return res.status(404).json({ error: true, message: 'File not found' });

    // Delete from disk
    const filePath = path.join(__dirname, '..', '..', 'data', 'vault', file.storage_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

export default router;
