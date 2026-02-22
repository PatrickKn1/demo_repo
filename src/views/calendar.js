import { api } from '../core/api.js';
import { events } from '../core/events.js';
import { Scheduler } from 'dhtmlx-scheduler';
import 'dhtmlx-scheduler/codebase/dhtmlxscheduler.css';

export function calendarView(params) {
    let el = null;
    let scheduler = null;

    return {
        async render() {
            el = document.createElement('div');
            el.className = 'view-container';

            const hubId = params?.id;
            const title = hubId ? 'Hub Calendar' : 'Master Calendar';

            el.innerHTML = `
                <div class="view-header" style="display:flex;align-items:center;justify-content:space-between;">
                    <div>
                        <h1>${title}</h1>
                        <p>${hubId ? 'Events for this hub' : 'All events across all hubs'}</p>
                    </div>
                </div>
                <div class="view-body" style="padding:0;height:100%;overflow:hidden;">
                    <div id="scheduler-container" class="calendar-container">
                        <div id="scheduler_here" class="dhx_cal_container" style="width:100%;height:100%;">
                            <div class="dhx_cal_navline">
                                <div class="dhx_cal_prev_button">&nbsp;</div>
                                <div class="dhx_cal_next_button">&nbsp;</div>
                                <div class="dhx_cal_today_button">Today</div>
                                <div class="dhx_cal_date"></div>
                                <div class="dhx_cal_tab" data-tab="day_tab"></div>
                                <div class="dhx_cal_tab" data-tab="week_tab"></div>
                                <div class="dhx_cal_tab" data-tab="month_tab"></div>
                            </div>
                            <div class="dhx_cal_header"></div>
                            <div class="dhx_cal_data"></div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize scheduler after DOM is ready
            requestAnimationFrame(() => _initScheduler(hubId));

            return el;
        },
        destroy() {
            if (scheduler) {
                scheduler.destructor();
                scheduler = null;
            }
            el = null;
        }
    };

    async function _initScheduler(hubId) {
        const container = el?.querySelector('#scheduler_here');
        if (!container) return;

        scheduler = Scheduler.getSchedulerInstance();

        scheduler.config.header = [
            'day', 'week', 'month',
            'date', 'prev', 'today', 'next'
        ];
        scheduler.config.multi_day = true;
        scheduler.config.xml_date = '%Y-%m-%d %H:%i';

        scheduler.init(container, new Date(), 'month');

        // Load events
        try {
            const queryParams = {};
            if (hubId) queryParams.hub_id = hubId;
            const calEvents = await api.getCalendarEvents(queryParams);

            scheduler.clearAll();
            scheduler.parse(calEvents.map(ev => ({
                id: ev.id,
                text: ev.text,
                start_date: ev.start_date,
                end_date: ev.end_date,
                color: ev.color || ''
            })));
        } catch (e) {
            console.error('Failed to load calendar events:', e);
        }

        // Handle event creation
        scheduler.attachEvent('onEventAdded', async (id, ev) => {
            try {
                const hubs = await api.getHubs();
                const defaultHub = hubs[0];
                if (!defaultHub) return;

                const result = await api.createCalendarEvent({
                    hub_id: hubId || defaultHub.id,
                    title: ev.text,
                    start_date: _formatDate(ev.start_date),
                    end_date: _formatDate(ev.end_date)
                });

                scheduler.changeEventId(id, result.id);
                events.emit('calendar:event-created', result);
            } catch (e) {
                console.error('Failed to create event:', e);
            }
        });

        // Handle event update
        scheduler.attachEvent('onEventChanged', async (id, ev) => {
            try {
                await api.updateCalendarEvent(id, {
                    title: ev.text,
                    start_date: _formatDate(ev.start_date),
                    end_date: _formatDate(ev.end_date)
                });
            } catch (e) {
                console.error('Failed to update event:', e);
            }
        });

        // Handle event deletion
        scheduler.attachEvent('onEventDeleted', async (id) => {
            try {
                await api.deleteCalendarEvent(id);
                events.emit('calendar:event-deleted', id);
            } catch (e) {
                console.error('Failed to delete event:', e);
            }
        });
    }

    function _formatDate(date) {
        if (typeof date === 'string') return date;
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
}
