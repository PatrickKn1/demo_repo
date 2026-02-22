const BASE = '/api/v1';

async function request(method, path, body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}

export const api = {
    // Hubs
    getHubs: () => request('GET', '/hubs'),
    createHub: (data) => request('POST', '/hubs', data),
    getHub: (id) => request('GET', `/hubs/${id}`),
    updateHub: (id, data) => request('PUT', `/hubs/${id}`, data),
    deleteHub: (id) => request('DELETE', `/hubs/${id}`),

    // Nodes
    getNode: (id) => request('GET', `/nodes/${id}`),
    getChildren: (id) => request('GET', `/nodes/${id}/children`),
    getBreadcrumb: (id) => request('GET', `/nodes/${id}/breadcrumb`),
    createNode: (data) => request('POST', '/nodes', data),
    updateNode: (id, data) => request('PUT', `/nodes/${id}`, data),
    moveNode: (id, data) => request('PATCH', `/nodes/${id}/move`, data),
    deleteNode: (id) => request('DELETE', `/nodes/${id}`),

    // Pages
    getPageContent: (nodeId) => request('GET', `/pages/${nodeId}/content`),
    savePageContent: (nodeId, content, plainText) =>
        request('PUT', `/pages/${nodeId}/content`, { content, plain_text: plainText }),

    // Databases
    getDbSchema: (nodeId) => request('GET', `/databases/${nodeId}/schema`),
    addDbColumn: (nodeId, data) => request('POST', `/databases/${nodeId}/columns`, data),
    updateDbColumn: (nodeId, colId, data) => request('PUT', `/databases/${nodeId}/columns/${colId}`, data),
    deleteDbColumn: (nodeId, colId) => request('DELETE', `/databases/${nodeId}/columns/${colId}`),
    getDbRecords: (nodeId) => request('GET', `/databases/${nodeId}/records`),
    createDbRecord: (nodeId, data) => request('POST', `/databases/${nodeId}/records`, data),
    updateDbRecord: (nodeId, recId, data) => request('PUT', `/databases/${nodeId}/records/${recId}`, data),
    deleteDbRecord: (nodeId, recId) => request('DELETE', `/databases/${nodeId}/records/${recId}`),

    // Calendar
    getCalendarEvents: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request('GET', `/calendar/events?${qs}`);
    },
    createCalendarEvent: (data) => request('POST', '/calendar/events', data),
    updateCalendarEvent: (id, data) => request('PUT', `/calendar/events/${id}`, data),
    deleteCalendarEvent: (id) => request('DELETE', `/calendar/events/${id}`),

    // Search
    search: (q) => request('GET', `/search?q=${encodeURIComponent(q)}`),
};
