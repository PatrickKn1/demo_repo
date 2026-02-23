/* ============================================================
   Calendar Event Adapters
   Convert between backend format and each library's format.

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
    // Handle "YYYY-MM-DD HH:mm" format
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

/** Format a Date to ISO string for libraries that need it */
export function toISO(date) {
    if (typeof date === 'string') date = parseDate(date);
    if (!date) return '';
    return date.toISOString();
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

// ---- TOAST UI Calendar Adapter ----

export function toToastUI(events) {
    return events.map(ev => ({
        id: ev.id,
        calendarId: 'default',
        title: ev.text,
        start: parseDate(ev.start_date),
        end: parseDate(ev.end_date),
        backgroundColor: ev.color || '#6366f1',
        borderColor: ev.color || '#6366f1',
        color: '#ffffff',
        isAllday: !!ev.all_day,
        category: ev.all_day ? 'allday' : 'time',
        raw: {
            hub_id: ev.hub_id,
            node_id: ev.node_id,
            description: ev.description,
            source_type: ev.source_type,
        }
    }));
}

export function fromToastUI(tuiEvent) {
    const start = tuiEvent.start instanceof Date ? tuiEvent.start :
        tuiEvent.start?.toDate ? tuiEvent.start.toDate() : new Date(tuiEvent.start);
    const end = tuiEvent.end instanceof Date ? tuiEvent.end :
        tuiEvent.end?.toDate ? tuiEvent.end.toDate() : new Date(tuiEvent.end);
    return {
        title: tuiEvent.title,
        start_date: formatDate(start),
        end_date: formatDate(end),
        all_day: tuiEvent.isAllday ? 1 : 0,
        color: tuiEvent.backgroundColor || null,
        hub_id: tuiEvent.raw?.hub_id,
    };
}

// ---- DayPilot Adapter ----

export function toDayPilot(events) {
    return events.map(ev => ({
        id: ev.id,
        text: ev.text,
        start: parseDate(ev.start_date),
        end: parseDate(ev.end_date),
        backColor: ev.color || '#6366f1',
        barColor: ev.color || '#6366f1',
        hub_id: ev.hub_id,
        node_id: ev.node_id,
    }));
}

export function fromDayPilot(dpEvent) {
    const start = dpEvent.start?.value ? new Date(dpEvent.start.value) :
        dpEvent.start instanceof Date ? dpEvent.start : new Date(dpEvent.start);
    const end = dpEvent.end?.value ? new Date(dpEvent.end.value) :
        dpEvent.end instanceof Date ? dpEvent.end : new Date(dpEvent.end);
    return {
        title: dpEvent.text,
        start_date: formatDate(start),
        end_date: formatDate(end),
        color: dpEvent.backColor || null,
        hub_id: dpEvent.hub_id,
    };
}

// ---- DHTMLX Scheduler Adapter ----
// Backend already returns DHTMLX format, so these are pass-through

export function toDHMLX(events) {
    return events.map(ev => ({
        id: ev.id,
        text: ev.text,
        start_date: ev.start_date,
        end_date: ev.end_date,
        color: ev.color || '',
    }));
}

export function fromDHMLX(dhxEvent) {
    const fmtDate = (d) => {
        if (typeof d === 'string') return d;
        return formatDate(d);
    };
    return {
        title: dhxEvent.text,
        start_date: fmtDate(dhxEvent.start_date),
        end_date: fmtDate(dhxEvent.end_date),
        color: dhxEvent.color || null,
    };
}
