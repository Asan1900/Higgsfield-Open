/**
 * Timeline.js — Multi-track NLE Timeline with interactive playhead,
 * clip blocks, drag-and-drop, trim handles, and transport controls.
 */

const TRACK_HEIGHT = 64;
const PIXELS_PER_SECOND_DEFAULT = 40;
const RULER_HEIGHT = 28;
const HEADER_WIDTH = 140;
const SNAP_THRESHOLD = 8;
import { analyzeAudioUrl, getCachedWaveform } from '../lib/AudioAnalyzer.js';

export function Timeline({ projectState, onStateChange, onPlayheadChange }) {
    let pixelsPerSecond = PIXELS_PER_SECOND_DEFAULT;
    let isDraggingPlayhead = false;
    let isDraggingClip = false;
    let dragClipInfo = null;
    let trimInfo = null;
    let isTrimming = false;
    const fetchingItems = new Set(); // Track items currently being analyzed

    const root = document.createElement('div');
    root.className = 'timeline-root';

    // ==========================================
    // TOOLBAR
    // ==========================================
    const toolbar = document.createElement('div');
    toolbar.className = 'timeline-toolbar';

    // Left: Track tools
    const leftTools = document.createElement('div');
    leftTools.className = 'flex items-center gap-1';

    const toolButtons = [
        { icon: '✂', label: 'Split', action: 'split' },
        { icon: '🗑', label: 'Delete', action: 'delete' },
        { icon: '⎘', label: 'Duplicate', action: 'duplicate' }
    ];
    toolButtons.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'tl-tool-btn';
        btn.innerHTML = `<span class="text-[10px]">${t.icon}</span><span>${t.label}</span>`;
        btn.title = t.label;
        btn.onclick = () => handleToolAction(t.action);
        leftTools.appendChild(btn);
    });
    toolbar.appendChild(leftTools);

    // Center: Timecode
    const timecodeDisplay = document.createElement('div');
    timecodeDisplay.className = 'tl-timecode';
    timecodeDisplay.textContent = '00:00:00:00';
    toolbar.appendChild(timecodeDisplay);

    // Right: Zoom
    const zoomControls = document.createElement('div');
    zoomControls.className = 'flex items-center gap-2';

    const zoomOut = document.createElement('button');
    zoomOut.className = 'tl-zoom-btn';
    zoomOut.textContent = '−';
    zoomOut.onclick = () => {
        pixelsPerSecond = Math.max(10, pixelsPerSecond - 10);
        renderTracks();
    };

    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'text-[9px] text-white/30 font-mono w-8 text-center';
    zoomLabel.textContent = '1x';

    const zoomIn = document.createElement('button');
    zoomIn.className = 'tl-zoom-btn';
    zoomIn.textContent = '+';
    zoomIn.onclick = () => {
        pixelsPerSecond = Math.min(200, pixelsPerSecond + 10);
        renderTracks();
    };

    const fitBtn = document.createElement('button');
    fitBtn.className = 'tl-zoom-btn text-[9px]';
    fitBtn.textContent = 'FIT';
    fitBtn.onclick = () => {
        const dur = getProjectDuration();
        if (dur > 0 && tracksViewport) {
            pixelsPerSecond = Math.max(10, (tracksViewport.clientWidth - HEADER_WIDTH) / dur);
        }
        renderTracks();
    };

    zoomControls.appendChild(zoomOut);
    zoomControls.appendChild(zoomLabel);
    zoomControls.appendChild(zoomIn);
    zoomControls.appendChild(fitBtn);
    toolbar.appendChild(zoomControls);

    root.appendChild(toolbar);

    // ==========================================
    // RULER + TRACKS VIEWPORT
    // ==========================================
    const viewportContainer = document.createElement('div');
    viewportContainer.className = 'timeline-viewport-container';

    // Time ruler
    const ruler = document.createElement('div');
    ruler.className = 'timeline-ruler';
    ruler.style.height = RULER_HEIGHT + 'px';
    ruler.style.paddingLeft = HEADER_WIDTH + 'px';

    const rulerCanvas = document.createElement('canvas');
    rulerCanvas.className = 'timeline-ruler-canvas';
    rulerCanvas.height = RULER_HEIGHT;
    ruler.appendChild(rulerCanvas);
    viewportContainer.appendChild(ruler);

    // Tracks scrollable area
    const tracksViewport = document.createElement('div');
    tracksViewport.className = 'timeline-tracks-viewport';

    viewportContainer.appendChild(tracksViewport);

    // Playhead line (overlays everything)
    const playheadLine = document.createElement('div');
    playheadLine.className = 'timeline-playhead';
    playheadLine.style.left = HEADER_WIDTH + 'px';

    const playheadHandle = document.createElement('div');
    playheadHandle.className = 'timeline-playhead-handle';
    playheadHandle.innerHTML = '▼';
    playheadLine.appendChild(playheadHandle);
    viewportContainer.appendChild(playheadLine);

    root.appendChild(viewportContainer);

    // ==========================================
    // RULER INTERACTION — click/drag to scrub
    // ==========================================
    ruler.addEventListener('mousedown', (e) => {
        isDraggingPlayhead = true;
        updatePlayheadFromMouse(e);
        document.addEventListener('mousemove', onPlayheadDrag);
        document.addEventListener('mouseup', onPlayheadUp);
    });

    function onPlayheadDrag(e) {
        if (isDraggingPlayhead) updatePlayheadFromMouse(e);
    }
    function onPlayheadUp() {
        isDraggingPlayhead = false;
        document.removeEventListener('mousemove', onPlayheadDrag);
        document.removeEventListener('mouseup', onPlayheadUp);
    }

    function updatePlayheadFromMouse(e) {
        const rect = ruler.getBoundingClientRect();
        const x = e.clientX - rect.left - HEADER_WIDTH + tracksViewport.scrollLeft;
        const time = Math.max(0, x / pixelsPerSecond);
        projectState.playhead = time;
        updatePlayheadPosition();
        updateTimecodeDisplay();
        if (onPlayheadChange) onPlayheadChange(time);
    }

    // ==========================================
    // RENDER
    // ==========================================
    function renderTracks() {
        tracksViewport.innerHTML = '';
        const duration = Math.max(getProjectDuration() + 10, 30);
        const totalWidth = HEADER_WIDTH + duration * pixelsPerSecond;

        // Update ruler
        rulerCanvas.width = totalWidth - HEADER_WIDTH;
        drawRuler(rulerCanvas, duration);

        // Update zoom label
        const ratio = pixelsPerSecond / PIXELS_PER_SECOND_DEFAULT;
        zoomLabel.textContent = ratio.toFixed(1) + 'x';

        projectState.tracks.forEach((track, trackIdx) => {
            const trackRow = document.createElement('div');
            trackRow.className = 'timeline-track-row';
            trackRow.style.height = TRACK_HEIGHT + 'px';
            trackRow.dataset.trackIdx = trackIdx;

            // Track Header
            const header = document.createElement('div');
            header.className = 'timeline-track-header';
            header.style.width = HEADER_WIDTH + 'px';
            header.style.minWidth = HEADER_WIDTH + 'px';

            const trackIcon = getTrackIcon(track.type);
            const nameRow = document.createElement('div');
            nameRow.className = 'flex items-center gap-1.5';
            nameRow.innerHTML = `<span class="text-[10px]">${trackIcon}</span><span class="text-[10px] font-bold text-white/70 truncate">${track.name}</span>`;
            header.appendChild(nameRow);

            const controlsRow = document.createElement('div');
            controlsRow.className = 'flex items-center gap-1 mt-1';

            // Mute
            const muteBtn = document.createElement('button');
            muteBtn.className = `tl-track-ctrl ${track.muted ? 'active' : ''}`;
            muteBtn.textContent = 'M';
            muteBtn.title = 'Mute';
            muteBtn.onclick = () => {
                track.muted = !track.muted;
                renderTracks();
                if (onStateChange) onStateChange(projectState);
            };

            // Solo
            const soloBtn = document.createElement('button');
            soloBtn.className = `tl-track-ctrl ${track.solo ? 'active-solo' : ''}`;
            soloBtn.textContent = 'S';
            soloBtn.title = 'Solo';
            soloBtn.onclick = () => {
                track.solo = !track.solo;
                renderTracks();
                if (onStateChange) onStateChange(projectState);
            };

            // Lock
            const lockBtn = document.createElement('button');
            lockBtn.className = `tl-track-ctrl ${track.locked ? 'active-lock' : ''}`;
            lockBtn.textContent = '🔒';
            lockBtn.title = 'Lock';
            lockBtn.onclick = () => {
                track.locked = !track.locked;
                renderTracks();
                if (onStateChange) onStateChange(projectState);
            };

            controlsRow.appendChild(muteBtn);
            controlsRow.appendChild(soloBtn);
            controlsRow.appendChild(lockBtn);
            header.appendChild(controlsRow);

            trackRow.appendChild(header);

            // Track Lane
            const lane = document.createElement('div');
            lane.className = `timeline-track-lane ${track.muted ? 'muted' : ''} ${track.locked ? 'locked' : ''}`;
            lane.style.width = (totalWidth - HEADER_WIDTH) + 'px';

            // Drop target
            lane.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                lane.classList.add('drag-over');
            });
            lane.addEventListener('dragleave', () => lane.classList.remove('drag-over'));
            lane.addEventListener('drop', (e) => {
                e.preventDefault();
                lane.classList.remove('drag-over');
                handleDrop(e, trackIdx, lane);
            });

            // Render clips
            if (track.clips) {
                track.clips.forEach((clip, clipIdx) => {
                    const clipEl = createClipElement(clip, clipIdx, trackIdx, track);
                    lane.appendChild(clipEl);
                });
            }

            trackRow.appendChild(lane);
            tracksViewport.appendChild(trackRow);
        });

        updatePlayheadPosition();
    }

    function createClipElement(clip, clipIdx, trackIdx, track) {
        const el = document.createElement('div');
        const left = clip.startTime * pixelsPerSecond;
        const width = Math.max(clip.duration * pixelsPerSecond, 20);

        el.className = `timeline-clip ${clip.type || track.type} ${projectState.selectedClip?.trackIdx === trackIdx && projectState.selectedClip?.clipIdx === clipIdx ? 'selected' : ''}`;
        el.style.left = left + 'px';
        el.style.width = width + 'px';

        // Clip content
        const label = document.createElement('span');
        label.className = 'timeline-clip-label';
        label.textContent = clip.name || `Clip ${clipIdx + 1}`;
        el.appendChild(label);

        // Duration badge
        const durBadge = document.createElement('span');
        durBadge.className = 'timeline-clip-dur';
        durBadge.textContent = formatTime(clip.duration);
        el.appendChild(durBadge);

        // Waveform hint for audio clips
        // Waveform hint for audio clips
        if (track.type === 'audio' || clip.type === 'audio') {
            const waveform = document.createElement('div');
            waveform.className = 'timeline-clip-waveform';

            const samples = Math.floor(width / 3);
            const data = getCachedWaveform(clip.url, samples);

            if (data) {
                // Draw real waveform
                for (let i = 0; i < samples; i++) {
                    const bar = document.createElement('div');
                    const h = data[i] * 100; // 0..1 to %
                    bar.style.height = Math.max(4, h) + '%';
                    bar.style.width = '2px';
                    bar.style.backgroundColor = 'rgba(0,0,0,0.4)';
                    waveform.appendChild(bar);
                }
            } else {
                // Trigger analysis
                const cacheKey = `${clip.url}__${samples}`;
                if (!fetchingItems.has(cacheKey) && clip.url) {
                    fetchingItems.add(cacheKey);
                    analyzeAudioUrl(clip.url, samples).then(() => {
                        fetchingItems.delete(cacheKey);
                        renderTracks();
                    });
                }

                // Loading / Fallback
                waveform.innerHTML = '<span style="font-size:9px;opacity:0.5;padding:4px">Analyzing...</span>';
                // Keep pseudo-random as subtle background? No, just text is cleaner
            }
            el.appendChild(waveform);
        }

        // Thumbnail strip for video clips
        if ((track.type === 'video' || clip.type === 'video') && clip.thumbnail) {
            const thumbStrip = document.createElement('div');
            thumbStrip.className = 'timeline-clip-thumbs';
            const numThumbs = Math.max(1, Math.floor(width / 50));
            for (let i = 0; i < numThumbs; i++) {
                const img = document.createElement('div');
                img.className = 'timeline-clip-thumb';
                img.style.backgroundImage = `url(${clip.thumbnail})`;
                thumbStrip.appendChild(img);
            }
            el.appendChild(thumbStrip);
        }

        // Trim handles
        const trimLeft = document.createElement('div');
        trimLeft.className = 'timeline-trim-handle left';
        trimLeft.addEventListener('mousedown', (e) => startTrim(e, clip, clipIdx, trackIdx, 'left'));
        el.appendChild(trimLeft);

        const trimRight = document.createElement('div');
        trimRight.className = 'timeline-trim-handle right';
        trimRight.addEventListener('mousedown', (e) => startTrim(e, clip, clipIdx, trackIdx, 'right'));
        el.appendChild(trimRight);

        // Click to select
        el.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('timeline-trim-handle')) return;
            e.stopPropagation();
            projectState.selectedClip = { trackIdx, clipIdx, clip };
            renderTracks();
            if (onStateChange) onStateChange(projectState);

            // Start drag
            if (!track.locked) {
                isDraggingClip = true;
                const rect = el.parentElement.getBoundingClientRect();
                dragClipInfo = {
                    clip, clipIdx, trackIdx,
                    startX: e.clientX,
                    originalStartTime: clip.startTime
                };
                document.addEventListener('mousemove', onClipDrag);
                document.addEventListener('mouseup', onClipDragEnd);
            }
        });

        return el;
    }

    // ==========================================
    // CLIP DRAG
    // ==========================================
    function onClipDrag(e) {
        if (!isDraggingClip || !dragClipInfo) return;
        const dx = e.clientX - dragClipInfo.startX;
        const dt = dx / pixelsPerSecond;
        dragClipInfo.clip.startTime = Math.max(0, dragClipInfo.originalStartTime + dt);
        renderTracks();
    }

    function onClipDragEnd() {
        isDraggingClip = false;
        // Snap to nearest clip edge
        if (dragClipInfo) {
            snapClip(dragClipInfo.clip, dragClipInfo.trackIdx);
            dragClipInfo = null;
            renderTracks();
            if (onStateChange) onStateChange(projectState);
        }
        document.removeEventListener('mousemove', onClipDrag);
        document.removeEventListener('mouseup', onClipDragEnd);
    }

    // ==========================================
    // TRIM
    // ==========================================
    function startTrim(e, clip, clipIdx, trackIdx, side) {
        e.stopPropagation();
        e.preventDefault();
        isTrimming = true;
        trimInfo = {
            clip, clipIdx, trackIdx, side,
            startX: e.clientX,
            originalStart: clip.startTime,
            originalDuration: clip.duration
        };
        document.addEventListener('mousemove', onTrim);
        document.addEventListener('mouseup', onTrimEnd);
    }

    function onTrim(e) {
        if (!isTrimming || !trimInfo) return;
        const dx = e.clientX - trimInfo.startX;
        const dt = dx / pixelsPerSecond;

        if (trimInfo.side === 'left') {
            const newStart = Math.max(0, trimInfo.originalStart + dt);
            const diff = newStart - trimInfo.originalStart;
            trimInfo.clip.startTime = newStart;
            trimInfo.clip.duration = Math.max(0.5, trimInfo.originalDuration - diff);
        } else {
            trimInfo.clip.duration = Math.max(0.5, trimInfo.originalDuration + dt);
        }
        renderTracks();
    }

    function onTrimEnd() {
        isTrimming = false;
        trimInfo = null;
        document.removeEventListener('mousemove', onTrim);
        document.removeEventListener('mouseup', onTrimEnd);
        if (onStateChange) onStateChange(projectState);
    }

    // ==========================================
    // DROP FROM MEDIA LIBRARY
    // ==========================================
    function handleDrop(e, trackIdx, lane) {
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (!data) return;

            const rect = lane.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const startTime = Math.max(0, x / pixelsPerSecond);

            const track = projectState.tracks[trackIdx];
            if (track.locked) return;

            // Check type compatibility
            const isAudioTrack = track.type === 'audio';
            const isVideoTrack = track.type === 'video';
            const isFxTrack = track.type === 'fx';
            const clipType = data.type || 'video';

            if (isAudioTrack && clipType === 'video') return; // Can't put video on audio track
            if (isFxTrack && clipType !== 'fx' && clipType !== 'text') return;

            const newClip = {
                id: Date.now() + Math.random(),
                name: data.name || data.label || `Clip ${track.clips.length + 1}`,
                type: clipType,
                url: data.url || '',
                thumbnail: data.thumbnail || data.url || '',
                startTime: startTime,
                duration: data.duration || 4,
                volume: 100,
                opacity: 100,
                filters: {}
            };

            track.clips.push(newClip);
            snapClip(newClip, trackIdx);
            renderTracks();
            if (onStateChange) onStateChange(projectState);
        } catch (err) {
            console.warn('Drop parse error:', err);
        }
    }

    // ==========================================
    // TOOL ACTIONS
    // ==========================================
    function handleToolAction(action) {
        const sel = projectState.selectedClip;
        if (!sel) return;

        const track = projectState.tracks[sel.trackIdx];
        if (!track || track.locked) return;

        if (action === 'delete') {
            track.clips.splice(sel.clipIdx, 1);
            projectState.selectedClip = null;
        } else if (action === 'duplicate') {
            const orig = track.clips[sel.clipIdx];
            const dup = { ...orig, id: Date.now() + Math.random(), startTime: orig.startTime + orig.duration + 0.2 };
            track.clips.push(dup);
        } else if (action === 'split') {
            const clip = track.clips[sel.clipIdx];
            const splitPoint = projectState.playhead;
            if (splitPoint > clip.startTime && splitPoint < clip.startTime + clip.duration) {
                const leftDur = splitPoint - clip.startTime;
                const rightDur = clip.duration - leftDur;
                clip.duration = leftDur;
                const rightClip = { ...clip, id: Date.now() + Math.random(), startTime: splitPoint, duration: rightDur, name: clip.name + ' (R)' };
                track.clips.push(rightClip);
            }
        }
        renderTracks();
        if (onStateChange) onStateChange(projectState);
    }

    // ==========================================
    // HELPERS
    // ==========================================
    function getProjectDuration() {
        let max = 0;
        projectState.tracks.forEach(t => {
            t.clips.forEach(c => {
                const end = c.startTime + c.duration;
                if (end > max) max = end;
            });
        });
        return max;
    }

    function snapClip(clip, trackIdx) {
        const track = projectState.tracks[trackIdx];
        const threshold = SNAP_THRESHOLD / pixelsPerSecond;
        track.clips.forEach(other => {
            if (other === clip) return;
            const otherEnd = other.startTime + other.duration;
            // Snap left edge to other's right edge
            if (Math.abs(clip.startTime - otherEnd) < threshold) {
                clip.startTime = otherEnd;
            }
            // Snap right edge to other's left edge
            const clipEnd = clip.startTime + clip.duration;
            if (Math.abs(clipEnd - other.startTime) < threshold) {
                clip.startTime = other.startTime - clip.duration;
            }
        });
    }

    function drawRuler(canvas, duration) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '9px "Inter", monospace';
        ctx.textAlign = 'center';

        const step = pixelsPerSecond >= 60 ? 1 : pixelsPerSecond >= 30 ? 2 : 5;
        for (let s = 0; s <= duration; s += step) {
            const x = s * pixelsPerSecond;
            // Major tick
            ctx.fillStyle = '#555';
            ctx.fillRect(x, RULER_HEIGHT - 10, 1, 10);
            // Label
            ctx.fillStyle = '#666';
            ctx.fillText(formatTimeShort(s), x, 10);
            // Minor ticks
            if (step === 1) {
                for (let f = 1; f < 4; f++) {
                    const fx = x + (f / 4) * pixelsPerSecond;
                    ctx.fillStyle = '#333';
                    ctx.fillRect(fx, RULER_HEIGHT - 5, 1, 5);
                }
            }
        }
    }

    function updatePlayheadPosition() {
        const x = HEADER_WIDTH + projectState.playhead * pixelsPerSecond - tracksViewport.scrollLeft;
        playheadLine.style.left = x + 'px';
    }

    function updateTimecodeDisplay() {
        timecodeDisplay.textContent = formatTimecode(projectState.playhead);
    }

    function formatTimecode(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const f = Math.floor((seconds % 1) * 24);
        return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${pad(s)}`;
    }

    function formatTimeShort(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m > 0 ? `${m}:${pad(s)}` : `${s}s`;
    }

    function pad(n) { return n.toString().padStart(2, '0'); }

    function getTrackIcon(type) {
        if (type === 'video') return '🎬';
        if (type === 'audio') return '🔊';
        if (type === 'fx') return '✨';
        return '📁';
    }

    // Scroll sync for playhead
    tracksViewport.addEventListener('scroll', () => {
        ruler.scrollLeft = tracksViewport.scrollLeft;
        updatePlayheadPosition();
    });

    // Public API
    root.render = renderTracks;
    root.setPlayhead = (time) => {
        projectState.playhead = time;
        updatePlayheadPosition();
        updateTimecodeDisplay();
    };
    root.getProjectDuration = getProjectDuration;

    // Initial render
    renderTracks();

    return root;
}
