/**
 * Global publish/subscribe event system.
 * Decouples studios so they can communicate without direct imports.
 *
 * Events:
 *  - asset:created   { url, type, name, prompt }
 *  - asset:deleted   { id }
 *  - playhead:changed { time }
 *  - clip:selected   { clipId, trackIdx }
 *  - project:changed { state }
 *  - studio:navigate { page, context }
 */
class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
        this._listeners.get(event)?.delete(callback);
    }

    /**
     * Publish an event.
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        this._listeners.get(event)?.forEach(cb => {
            try { cb(data); }
            catch (err) { console.error(`[EventBus] Error in "${event}" handler:`, err); }
        });
    }

    /**
     * Subscribe to an event once.
     * @param {string} event
     * @param {Function} callback
     */
    once(event, callback) {
        const unsub = this.on(event, (data) => {
            unsub();
            callback(data);
        });
        return unsub;
    }
}

export const eventBus = new EventBus();
