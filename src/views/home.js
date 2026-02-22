import { api } from '../core/api.js';
import { router } from '../core/router.js';

export function homeView() {
    return {
        async render() {
            const el = document.createElement('div');
            el.className = 'view-container';

            el.innerHTML = `
                <div class="view-body">
                    <div style="max-width: 600px; margin: 60px auto; text-align: center;">
                        <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">Tool</h1>
                        <p style="color: var(--text-secondary); margin-bottom: 40px;">
                            Your personal productivity workspace
                        </p>
                        <div class="card-grid" id="home-hubs"></div>
                    </div>
                </div>
            `;

            // Load hubs
            try {
                const hubs = await api.getHubs();
                const grid = el.querySelector('#home-hubs');
                if (hubs.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state" style="grid-column: 1 / -1;">
                            <div class="empty-icon">&#128193;</div>
                            <h3>No hubs yet</h3>
                            <p>Create your first hub to get started organizing your workspace.</p>
                        </div>
                    `;
                } else {
                    grid.innerHTML = hubs.map(hub => `
                        <div class="card" data-hub-id="${hub.id}">
                            <div class="card-icon" style="color: ${hub.color}">${getHubIcon(hub.icon)}</div>
                            <div class="card-title">${esc(hub.name)}</div>
                            <div class="card-meta">Hub</div>
                        </div>
                    `).join('');

                    grid.addEventListener('click', (e) => {
                        const card = e.target.closest('.card');
                        if (card) router.navigate(`/hub/${card.dataset.hubId}`);
                    });
                }
            } catch (e) {
                console.error('Failed to load hubs:', e);
            }

            return el;
        },
        destroy() {}
    };
}

function getHubIcon(icon) {
    const icons = {
        user: '&#128100;', folder: '&#128193;', book: '&#128214;',
        briefcase: '&#128188;', star: '&#11088;', heart: '&#10084;',
        gear: '&#9881;', home: '&#127968;', graduation: '&#127891;', money: '&#128176;'
    };
    return icons[icon] || '&#128193;';
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
