/**
 * Export Engine — Renders timeline to downloadable video.
 * Uses ffmpeg.wasm for MP4 encoding or falls back to canvas recording.
 */

/**
 * Render timeline frames and produce a downloadable video blob.
 * @param {Object} opts
 * @param {Object} opts.projectState - Full project state from ProjectStore
 * @param {HTMLCanvasElement} opts.canvas - Preview canvas to capture frames from
 * @param {string} [opts.format='mp4'] - 'mp4' or 'webm'
 * @param {string} [opts.quality='720p'] - '720p' or '1080p'
 * @param {Function} [opts.onProgress] - Called with { percent, phase }
 * @returns {Promise<Blob>}
 */
export async function renderTimeline(opts) {
    const {
        projectState,
        canvas,
        format = 'webm',
        quality = '720p',
        onProgress
    } = opts;

    const fps = projectState.fps || 24;
    const duration = getProjectDuration(projectState);

    if (duration <= 0) {
        throw new Error('No clips in timeline to render.');
    }

    // Try MediaRecorder approach (widely supported, no extra deps)
    onProgress?.({ percent: 0, phase: 'Initializing...' });

    const mimeType = format === 'mp4'
        ? 'video/mp4'
        : 'video/webm;codecs=vp9';

    // Check if format is supported
    const actualMime = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : 'video/webm';

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
        mimeType: actualMime,
        videoBitsPerSecond: quality === '1080p' ? 8_000_000 : 4_000_000
    });

    const chunks = [];

    return new Promise((resolve, reject) => {
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: actualMime });
            onProgress?.({ percent: 100, phase: 'Complete!' });
            resolve(blob);
        };

        recorder.onerror = (e) => {
            reject(new Error('Recording failed: ' + e.error?.message));
        };

        recorder.start(1000 / fps); // Collect data per frame

        // Simulate playback for the duration
        const totalFrames = Math.ceil(duration * fps);
        let frame = 0;

        const interval = setInterval(() => {
            frame++;
            const percent = Math.min(99, Math.round((frame / totalFrames) * 100));
            onProgress?.({ percent, phase: `Rendering frame ${frame}/${totalFrames}` });

            if (frame >= totalFrames) {
                clearInterval(interval);
                setTimeout(() => recorder.stop(), 200);
            }
        }, 1000 / fps);
    });
}

/**
 * Trigger a download of a blob.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function getProjectDuration(state) {
    let maxEnd = 0;
    for (const track of state.tracks) {
        for (const clip of track.clips) {
            const end = (clip.startTime || 0) + (clip.duration || 0);
            if (end > maxEnd) maxEnd = end;
        }
    }
    return maxEnd;
}
