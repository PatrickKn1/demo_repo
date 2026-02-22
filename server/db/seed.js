import crypto from 'crypto';
import { initDatabase, getDb } from './connection.js';

function uid() {
    return crypto.randomUUID().replace(/-/g, '');
}

function seed() {
    const db = initDatabase();

    const existingHubs = db.prepare('SELECT COUNT(*) as count FROM hubs').get();
    if (existingHubs.count > 0) {
        console.log('Database already seeded. Skipping.');
        return;
    }

    const personalId = uid();
    const insertHub = db.prepare(
        'INSERT INTO hubs (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)'
    );

    insertHub.run(personalId, 'Personal', 'user', '#6366f1', 0);

    // Create a welcome page inside Personal hub
    const welcomePageId = uid();
    const insertNode = db.prepare(
        'INSERT INTO nodes (id, hub_id, parent_id, node_type, title, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertNode.run(welcomePageId, personalId, null, 'page', 'Welcome', 0);

    const insertContent = db.prepare(
        'INSERT INTO page_content (node_id, content, plain_text) VALUES (?, ?, ?)'
    );
    const welcomeContent = JSON.stringify({
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: 'Welcome to Tool' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Your personal productivity workspace. Create hubs, pages, databases, and calendars to organize everything.' }]
            }
        ]
    });
    insertContent.run(welcomePageId, welcomeContent, 'Welcome to Tool. Your personal productivity workspace.');

    // Add to search index
    db.prepare('INSERT INTO search_index (node_id, title, content) VALUES (?, ?, ?)')
        .run(welcomePageId, 'Welcome', 'Welcome to Tool. Your personal productivity workspace.');

    // Insert default settings
    const insertSetting = db.prepare(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
    );
    insertSetting.run('theme', 'dark');
    insertSetting.run('sidebar_width', '280');

    console.log('Database seeded successfully.');
    console.log(`  - Personal hub: ${personalId}`);
    console.log(`  - Welcome page: ${welcomePageId}`);
}

seed();
