/* ============================================================
   Calendar Event Adapters
   Convert between backend format and FullCalendar's format.

   Backend format (from API):
     { id, text, start_date, end_date, color, hub_id, node_id,
       description, all_day, source_type }

   start_date / end_date are strings: "YYYY-MM-DD HH:mm"
   ============================================================ */

// ---- Date Helpers ----

/** Parse "YYYY-MM-DD HH:mm" into a Date object */
export function parseDate(str) {
    if (!str) return null;
    if (str instanceof Date) return str;
    const [datePart, timePart] = str.split(' ');
    const [y, m, d] = datePart.split('-').map(Number);
    if (timePart) {
        const [h, min] = timePart.split(':').map(Number);
        return new Date(y, m - 1, d, h, min);
    }
    return new Date(y, m - 1, d);
}

/** Format a Date to "YYYY-MM-DD HH:mm" */
export function formatDate(date) {
    if (typeof date === 'string') return date;
    if (!date) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ---- FullCalendar Adapter ----

export function toFullCalendar(events) {
    return events.map(ev => ({
        id: ev.id,
        title: ev.text,
        start: parseDate(ev.start_date),
        end: parseDate(ev.end_date),
        backgroundColor: ev.color || '',
        borderColor: ev.color || '',
        allDay: !!ev.all_day,
        extendedProps: {
            hub_id: ev.hub_id,
            node_id: ev.node_id,
            description: ev.description,
            source_type: ev.source_type,
        }
    }));
}

export function fromFullCalendar(fcEvent) {
    return {
        title: fcEvent.title,
        start_date: formatDate(fcEvent.start),
        end_date: formatDate(fcEvent.end || fcEvent.start),
        all_day: fcEvent.allDay ? 1 : 0,
        color: fcEvent.backgroundColor || null,
        hub_id: fcEvent.extendedProps?.hub_id,
    };
}
