import { eventBus } from './EventBus.js';

const STORAGE_KEY = 'higgsfield_project';
const ASSETS_KEY = 'higgsfield_assets';

/**
 * Centralized project state with localStorage persistence.
 * Replaces scattered state across closures and direct localStorage reads.
 */
class ProjectStore {
    constructor() {
        /** @type {Set<Function>} */
        this._subscribers = new Set();

        /** @type {Object} The full project state */
        this._state = this._loadState();

        /** @type {Array} Unified asset bin */
        this._assets = this._loadAssets();
    }

    // ─── State ────────────────────────────────────────────────

    /** Return a shallow copy of the state. */
    getState() {
        return { ...this._state };
    }

    /** Merge partial update into state, notify subscribers, persist. */
    setState(partial) {
        Object.assign(this._state, partial);
        this._persist();
        this._notify();
        eventBus.emit('project:changed', this.getState());
    }

    /** Subscribe to state changes. Returns unsubscribe function. */
    subscribe(callback) {
        this._subscribers.add(callback);
        return () => this._subscribers.delete(callback);
    }

    // ─── Assets ───────────────────────────────────────────────

    /**
     * Add an asset to the unified bin.
     * @param {{ url: string, type: string, name?: string, prompt?: string, createdAt?: number }} asset
     */
    addAsset(asset) {
        const entry = {
            id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            createdAt: Date.now(),
            ...asset
        };
        this._assets.unshift(entry);
        this._persistAssets();
        eventBus.emit('asset:created', entry);
        return entry;
    }

    /** Remove an asset by id. */
    removeAsset(id) {
        this._assets = this._assets.filter(a => a.id !== id);
        this._persistAssets();
        eventBus.emit('asset:deleted', { id });
    }

    /**
     * Get all assets, optionally filtered.
     * @param {{ type?: string, search?: string }} [filter]
     * @returns {Array}
     */
    getAssets(filter) {
        let list = [...this._assets];

        if (filter?.type && filter.type !== 'all') {
            list = list.filter(a => a.type === filter.type);
        }
        if (filter?.search) {
            const q = filter.search.toLowerCase();
            list = list.filter(a =>
                (a.name || '').toLowerCase().includes(q) ||
                (a.prompt || '').toLowerCase().includes(q)
            );
        }
        return list;
    }

    // ─── Default State ────────────────────────────────────────

    /** Return default project state for a fresh project. */
    static defaultState() {
        return {
            name: 'Untitled Project',
            fps: 24,
            playhead: 0,
            isPlaying: false,
            selectedClipId: null,
            selectedTrackIdx: null,
            tracks: [
                { name: 'Video 1', type: 'video', muted: false, solo: false, locked: false, volume: 100, pan: 0, clips: [] },
                { name: 'Video 2', type: 'video', muted: false, solo: false, locked: false, volume: 100, pan: 0, clips: [] },
                { name: 'Audio 1', type: 'audio', muted: false, solo: false, locked: false, volume: 100, pan: 0, clips: [] },
                { name: 'Audio 2', type: 'audio', muted: false, solo: false, locked: false, volume: 80, pan: 0, clips: [] },
                { name: 'FX / Titles', type: 'fx', muted: false, solo: false, locked: false, volume: 100, pan: 0, clips: [] },
            ]
        };
    }

    /** Reset to default state (new project). */
    reset() {
        this._state = ProjectStore.defaultState();
        this._persist();
        this._notify();
    }

    // ─── Persistence ──────────────────────────────────────────

    _loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('[ProjectStore] Failed to load state:', e);
        }
        return ProjectStore.defaultState();
    }

    _persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
        } catch (e) {
            console.warn('[ProjectStore] Failed to persist state:', e);
        }
    }

    _loadAssets() {
        try {
            const raw = localStorage.getItem(ASSETS_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('[ProjectStore] Failed to load assets:', e);
        }

        // Migrate existing cinema_history if present
        return this._migrateCinemaHistory();
    }

    _persistAssets() {
        try {
            localStorage.setItem(ASSETS_KEY, JSON.stringify(this._assets));
        } catch (e) {
            console.warn('[ProjectStore] Failed to persist assets:', e);
        }
    }

    /** Migrate legacy cinema_history data to the unified asset bin. */
    _migrateCinemaHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('cinema_history') || '[]');
            return history.map((item, i) => ({
                id: `migrated_${i}_${Date.now()}`,
                url: item.url || item.imageUrl || item.videoUrl,
                type: item.type || (item.videoUrl ? 'video' : 'image'),
                name: item.prompt?.slice(0, 40) || `Asset ${i + 1}`,
                prompt: item.prompt || '',
                createdAt: item.timestamp || Date.now() - (history.length - i) * 60000
            })).filter(a => a.url);
        } catch {
            return [];
        }
    }

    // ─── Internal ─────────────────────────────────────────────

    _notify() {
        this._subscribers.forEach(cb => {
            try { cb(this.getState()); }
            catch (err) { console.error('[ProjectStore] Subscriber error:', err); }
        });
    }
}

export const projectStore = new ProjectStore();
