import { events } from './events.js';

class Router {
    constructor() {
        this._routes = [];
        this._currentView = null;
        this._mainContainer = null;
    }

    setContainer(el) {
        this._mainContainer = el;
    }

    register(pattern, viewFactory) {
        this._routes.push({ pattern, factory: viewFactory });
    }

    init() {
        window.addEventListener('hashchange', () => this._resolve());
        this._resolve();
    }

    navigate(path) {
        window.location.hash = path;
    }

    getCurrentPath() {
        return window.location.hash.slice(1) || '/';
    }

    _resolve() {
        const hash = this.getCurrentPath();

        for (const route of this._routes) {
            const match = this._match(route.pattern, hash);
            if (match) {
                this._load(route.factory, match);
                return;
            }
        }

        // Fallback to home
        if (hash !== '/') {
            this.navigate('/');
        }
    }

    _match(pattern, path) {
        const pParts = pattern.split('/').filter(Boolean);
        const hParts = path.split('/').filter(Boolean);

        if (pParts.length !== hParts.length) return null;

        const params = {};
        for (let i = 0; i < pParts.length; i++) {
            if (pParts[i].startsWith(':')) {
                params[pParts[i].slice(1)] = hParts[i];
            } else if (pParts[i] !== hParts[i]) {
                return null;
            }
        }
        return params;
    }

    async _load(factory, params) {
        if (!this._mainContainer) return;

        // Destroy previous view
        if (this._currentView && this._currentView.destroy) {
            this._currentView.destroy();
        }

        // Clear container
        this._mainContainer.innerHTML = '';

        // Create new view
        this._currentView = factory(params);
        if (this._currentView.render) {
            const el = await this._currentView.render();
            if (el) {
                this._mainContainer.appendChild(el);
            }
        }

        events.emit('route:changed', { path: this.getCurrentPath(), params });
    }
}

export const router = new Router();
