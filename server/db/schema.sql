-- ============================================================
-- TOOL - Database Schema
-- "Everything is a database" personal productivity system
-- ============================================================

-- Hubs: top-level organizational containers
CREATE TABLE IF NOT EXISTS hubs (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT DEFAULT 'folder',
    color       TEXT DEFAULT '#6366f1',
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- UNIVERSAL NODE TABLE
-- Every entity is a node: pages, databases, records,
-- calendar events, files, folders, canvases.
-- Nodes form an arbitrarily deep tree via parent_id.
-- ============================================================

CREATE TABLE IF NOT EXISTS nodes (
    id          TEXT PRIMARY KEY,
    hub_id      TEXT NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    parent_id   TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    node_type   TEXT NOT NULL CHECK (node_type IN (
                    'page', 'database', 'record', 'calendar_event',
                    'file', 'folder', 'canvas'
                )),
    title       TEXT NOT NULL DEFAULT 'Untitled',
    icon        TEXT DEFAULT NULL,
    sort_order  INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nodes_hub ON nodes(hub_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);

-- ============================================================
-- PAGE CONTENT (for node_type = 'page')
-- Stores the TipTap/ProseMirror JSON document
-- ============================================================

CREATE TABLE IF NOT EXISTS page_content (
    node_id     TEXT PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
    content     TEXT DEFAULT '{}',
    plain_text  TEXT DEFAULT '',
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- DATABASE DEFINITIONS (for node_type = 'database')
-- ============================================================

CREATE TABLE IF NOT EXISTS database_schemas (
    node_id     TEXT PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    view_config TEXT DEFAULT '{}',
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- Columns within a user-defined database
CREATE TABLE IF NOT EXISTS database_columns (
    id          TEXT PRIMARY KEY,
    database_id TEXT NOT NULL REFERENCES database_schemas(node_id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    column_type TEXT NOT NULL CHECK (column_type IN (
                    'text', 'number', 'date', 'datetime', 'checkbox',
                    'select', 'multi_select', 'url', 'email', 'phone',
                    'relation', 'formula', 'file', 'rich_text'
                )),
    config      TEXT DEFAULT '{}',
    sort_order  INTEGER DEFAULT 0,
    is_required INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dbcols_database ON database_columns(database_id);

-- ============================================================
-- RECORD VALUES (EAV pattern for node_type = 'record')
-- ============================================================

CREATE TABLE IF NOT EXISTS record_values (
    id          TEXT PRIMARY KEY,
    record_id   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    column_id   TEXT NOT NULL REFERENCES database_columns(id) ON DELETE CASCADE,
    value_text  TEXT,
    value_num   REAL,
    value_date  TEXT,
    value_json  TEXT,
    UNIQUE(record_id, column_id)
);

CREATE INDEX IF NOT EXISTS idx_recvals_record ON record_values(record_id);
CREATE INDEX IF NOT EXISTS idx_recvals_column ON record_values(column_id);

-- ============================================================
-- CALENDAR EVENTS
-- Events propagate up through hubs to Master Calendar
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id          TEXT PRIMARY KEY,
    node_id     TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    hub_id      TEXT NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT,
    all_day     INTEGER DEFAULT 0,
    recurrence  TEXT DEFAULT NULL,
    color       TEXT DEFAULT NULL,
    description TEXT DEFAULT '',
    source_type TEXT DEFAULT 'manual',
    source_id   TEXT DEFAULT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cal_hub ON calendar_events(hub_id);
CREATE INDEX IF NOT EXISTS idx_cal_dates ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_cal_node ON calendar_events(node_id);

-- ============================================================
-- FILE METADATA
-- ============================================================

CREATE TABLE IF NOT EXISTS files (
    id          TEXT PRIMARY KEY,
    node_id     TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type   TEXT NOT NULL,
    size_bytes  INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INTER-DATABASE RELATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS database_relations (
    id              TEXT PRIMARY KEY,
    source_db_id    TEXT NOT NULL REFERENCES database_schemas(node_id) ON DELETE CASCADE,
    source_col_id   TEXT NOT NULL REFERENCES database_columns(id) ON DELETE CASCADE,
    target_db_id    TEXT NOT NULL REFERENCES database_schemas(node_id) ON DELETE CASCADE,
    relation_type   TEXT DEFAULT 'one_to_many' CHECK (relation_type IN (
                        'one_to_one', 'one_to_many', 'many_to_many'
                    )),
    created_at      TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- FULL-TEXT SEARCH (FTS5)
-- ============================================================

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    node_id UNINDEXED,
    title,
    content
);
