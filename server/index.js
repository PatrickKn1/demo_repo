import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/connection.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Serve uploaded files
app.use('/vault', express.static(path.join(__dirname, '..', 'data', 'vault')));

// In production, serve the Vite build
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
}

// Error handling
app.use(errorHandler);

// Initialize DB and start server
initDatabase();
app.listen(PORT, () => {
    console.log(`Tool server running at http://localhost:${PORT}`);
});
