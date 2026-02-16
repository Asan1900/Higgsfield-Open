import { projectStore } from './ProjectStore.js';
import { eventBus } from './EventBus.js';

/**
 * Undo/Redo system using the Command pattern.
 * Each command must have execute() and undo() methods.
 */
class CommandHistory {
    constructor(maxSize = 100) {
        /** @type {{ execute: Function, undo: Function, description: string }[]} */
        this._undoStack = [];
        /** @type {{ execute: Function, undo: Function, description: string }[]} */
        this._redoStack = [];
        this._maxSize = maxSize;
    }

    /** Execute a command and push it onto the undo stack. */
    execute(command) {
        command.execute();
        this._undoStack.push(command);
        if (this._undoStack.length > this._maxSize) this._undoStack.shift();
        this._redoStack = []; // Clear redo after new action
        eventBus.emit('history:changed', this.status());
    }

    /** Undo the last command. */
    undo() {
        const cmd = this._undoStack.pop();
        if (!cmd) return;
        cmd.undo();
        this._redoStack.push(cmd);
        eventBus.emit('history:changed', this.status());
    }

    /** Redo the last undone command. */
    redo() {
        const cmd = this._redoStack.pop();
        if (!cmd) return;
        cmd.execute();
        this._undoStack.push(cmd);
        eventBus.emit('history:changed', this.status());
    }

    get canUndo() { return this._undoStack.length > 0; }
    get canRedo() { return this._redoStack.length > 0; }

    status() {
        return {
            canUndo: this.canUndo,
            canRedo: this.canRedo,
            undoDescription: this._undoStack.at(-1)?.description || '',
            redoDescription: this._redoStack.at(-1)?.description || ''
        };
    }

    clear() {
        this._undoStack = [];
        this._redoStack = [];
        eventBus.emit('history:changed', this.status());
    }
}

export const commandHistory = new CommandHistory();

// ─── Command Factories ────────────────────────────────────────

/**
 * Move a clip to a new start time.
 * @param {number} trackIdx
 * @param {number} clipIdx
 * @param {number} oldStart
 * @param {number} newStart
 */
export function MoveClipCommand(trackIdx, clipIdx, oldStart, newStart) {
    return {
        description: `Move clip to ${newStart.toFixed(1)}s`,
        execute() {
            const state = projectStore.getState();
            state.tracks[trackIdx].clips[clipIdx].startTime = newStart;
            projectStore.setState({ tracks: state.tracks });
        },
        undo() {
            const state = projectStore.getState();
            state.tracks[trackIdx].clips[clipIdx].startTime = oldStart;
            projectStore.setState({ tracks: state.tracks });
        }
    };
}

/**
 * Delete a clip from a track.
 * @param {number} trackIdx
 * @param {number} clipIdx
 */
export function DeleteClipCommand(trackIdx, clipIdx) {
    let removedClip = null;
    return {
        description: `Delete clip`,
        execute() {
            const state = projectStore.getState();
            removedClip = state.tracks[trackIdx].clips.splice(clipIdx, 1)[0];
            projectStore.setState({ tracks: state.tracks });
        },
        undo() {
            const state = projectStore.getState();
            state.tracks[trackIdx].clips.splice(clipIdx, 0, removedClip);
            projectStore.setState({ tracks: state.tracks });
        }
    };
}

/**
 * Split a clip at a given time.
 * @param {number} trackIdx
 * @param {number} clipIdx
 * @param {number} splitTime - Absolute time to split at
 */
export function SplitClipCommand(trackIdx, clipIdx, splitTime) {
    let originalClip = null;
    return {
        description: `Split clip at ${splitTime.toFixed(1)}s`,
        execute() {
            const state = projectStore.getState();
            const clip = state.tracks[trackIdx].clips[clipIdx];
            originalClip = { ...clip };

            const relSplit = splitTime - clip.startTime;
            const secondHalf = {
                ...clip,
                id: `clip_${Date.now()}_split`,
                startTime: splitTime,
                duration: clip.duration - relSplit
            };
            clip.duration = relSplit;
            state.tracks[trackIdx].clips.splice(clipIdx + 1, 0, secondHalf);
            projectStore.setState({ tracks: state.tracks });
        },
        undo() {
            const state = projectStore.getState();
            state.tracks[trackIdx].clips.splice(clipIdx, 2, originalClip);
            projectStore.setState({ tracks: state.tracks });
        }
    };
}

/**
 * Add a clip to a track.
 * @param {number} trackIdx
 * @param {Object} clip
 */
export function AddClipCommand(trackIdx, clip) {
    return {
        description: `Add "${clip.name || 'clip'}"`,
        execute() {
            const state = projectStore.getState();
            state.tracks[trackIdx].clips.push(clip);
            projectStore.setState({ tracks: state.tracks });
        },
        undo() {
            const state = projectStore.getState();
            const idx = state.tracks[trackIdx].clips.findIndex(c => c.id === clip.id);
            if (idx >= 0) state.tracks[trackIdx].clips.splice(idx, 1);
            projectStore.setState({ tracks: state.tracks });
        }
    };
}

/**
 * Trim a clip (change startTime and/or duration).
 * @param {number} trackIdx
 * @param {number} clipIdx
 * @param {{ startTime?: number, duration?: number }} oldValues
 * @param {{ startTime?: number, duration?: number }} newValues
 */
export function TrimClipCommand(trackIdx, clipIdx, oldValues, newValues) {
    return {
        description: `Trim clip`,
        execute() {
            const state = projectStore.getState();
            const clip = state.tracks[trackIdx].clips[clipIdx];
            if (newValues.startTime != null) clip.startTime = newValues.startTime;
            if (newValues.duration != null) clip.duration = newValues.duration;
            projectStore.setState({ tracks: state.tracks });
        },
        undo() {
            const state = projectStore.getState();
            const clip = state.tracks[trackIdx].clips[clipIdx];
            if (oldValues.startTime != null) clip.startTime = oldValues.startTime;
            if (oldValues.duration != null) clip.duration = oldValues.duration;
            projectStore.setState({ tracks: state.tracks });
        }
    };
}
