/**
 * utils/timeline.js
 * Frame recorder for forward/backward stepping and replay.
 * Every algorithm frame is stored as a snapshot so the user
 * can scrub through the entire execution history.
 */

export class Timeline {
    constructor() {
        this._frames = [];   // Array of frame snapshots
        this._cursor = -1;   // Current playback position
        this._maxSize = 4000; // Prevent unbounded memory growth
    }

    /** Push a new frame snapshot. Trims oldest if over limit. */
    record(frame) {
        // If we scrubbed backwards, truncate forward history
        if (this._cursor < this._frames.length - 1) {
            this._frames = this._frames.slice(0, this._cursor + 1);
        }
        this._frames.push(frame);
        if (this._frames.length > this._maxSize) this._frames.shift();
        this._cursor = this._frames.length - 1;
    }

    /** Step to the next frame. Returns the frame or null. */
    forward() {
        if (this._cursor < this._frames.length - 1) {
            this._cursor++;
            return this.current();
        }
        return null;
    }

    /** Step to the previous frame. Returns the frame or null. */
    back() {
        if (this._cursor > 0) {
            this._cursor--;
            return this.current();
        }
        return null;
    }

    /** Seek to a specific frame by index. */
    seek(index) {
        const i = Math.max(0, Math.min(index, this._frames.length - 1));
        this._cursor = i;
        return this.current();
    }

    /** Current frame at cursor position. */
    current() {
        return this._frames[this._cursor] ?? null;
    }

    /** Reset all state. */
    clear() {
        this._frames = [];
        this._cursor = -1;
    }

    get length() { return this._frames.length; }
    get cursor() { return this._cursor; }
    get atStart() { return this._cursor <= 0; }
    get atEnd() { return this._cursor >= this._frames.length - 1; }
    get progress() { return this._frames.length > 1 ? this._cursor / (this._frames.length - 1) : 0; }
}

/**
 * Execution controller — drives async algorithm step-by-step
 * with support for pause/resume, step mode, and speed control.
 */
export class ExecutionController {
    constructor(getDelay) {
        this._getDelay = getDelay;
        this._stopped = false;
        this._paused = false;
        this._stepMode = false;
        this._resolveStep = null;
    }

    get paused() { return this._paused; }
    get stopped() { return this._stopped; }

    setStepMode(v) { this._stepMode = v; }

    stop() {
        this._stopped = true;
        this._paused = false;
        this._resolveStep?.();
        this._resolveStep = null;
    }

    togglePause() {
        this._paused = !this._paused;
        if (!this._paused) {
            this._resolveStep?.();
            this._resolveStep = null;
        }
    }

    nextStep() {
        this._resolveStep?.();
        this._resolveStep = null;
    }

    /** Await this after each visual frame. Handles all timing modes. */
    async tick() {
        if (this._stopped) throw new Error('Execution stopped');
        if (this._stepMode || this._paused) {
            await new Promise(r => { this._resolveStep = r; });
            if (this._stopped) throw new Error('Execution stopped');
            return;
        }
        const d = this._getDelay();
        if (d > 0) await new Promise(r => setTimeout(r, d));
        if (this._stopped) throw new Error('Execution stopped');
    }
}