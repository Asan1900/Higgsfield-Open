/**
 * VideoStudio.js — Full NLE (Non-Linear Editor) workspace.
 * Orchestrates MediaLibrary, Timeline, AudioMixer, VFX panels,
 * Preview Monitor, and Inspector into a professional editing suite.
 */

import { Timeline } from './Timeline.js';
import { MediaLibrary } from './MediaLibrary.js';
import { AudioMixer } from './AudioMixer.js';
import { ChromaKey } from './ChromaKey.js';
import { TextOverlay } from './TextOverlay.js';
import { ColorGrading } from './ColorGrading.js';
import { projectStore } from '../lib/ProjectStore.js';
import { commandHistory, AddClipCommand } from '../lib/CommandHistory.js';
import { eventBus } from '../lib/EventBus.js';

export function VideoStudio() {
    // Use centralized ProjectStore (persisted to localStorage)
    const projectState = projectStore.getState();
    let playbackInterval = null;
    let activeEffectsTab = 'color'; // 'color' | 'chroma' | 'text' | 'mixer'

    const container = document.createElement('div');
    container.className = 'video-studio';

    // ==========================================
    // 1. LEFT PANEL — Media Library
    // ==========================================
    const leftPanel = document.createElement('div');
    leftPanel.className = 'vs-left-panel';

    const mediaLibrary = MediaLibrary({
        onAddToTimeline: (item) => {
            // Find first matching track
            const targetTrackIdx = item.type === 'audio'
                ? projectState.tracks.findIndex(t => t.type === 'audio')
                : projectState.tracks.findIndex(t => t.type === 'video');
            if (targetTrackIdx >= 0) {
                const track = projectState.tracks[targetTrackIdx];
                const lastEnd = track.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
                const newClip = {
                    id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    name: item.name || 'Clip',
                    type: item.type || 'video',
                    url: item.url || '',
                    thumbnail: item.thumbnail || '',
                    startTime: lastEnd,
                    duration: item.duration || 4,
                    volume: 100,
                    opacity: 100,
                    filters: {}
                };
                commandHistory.execute(AddClipCommand(targetTrackIdx, newClip));
                timeline.render();
            }
        }
    });
    leftPanel.appendChild(mediaLibrary);
    container.appendChild(leftPanel);

    // ==========================================
    // 2. CENTER COLUMN
    // ==========================================
    const centerCol = document.createElement('div');
    centerCol.className = 'vs-center-col';

    // --- PREVIEW MONITOR ---
    const monitorPanel = document.createElement('div');
    monitorPanel.className = 'vs-monitor';

    // Canvas Preview
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'vs-preview-wrapper';

    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 854;
    previewCanvas.height = 480;
    previewCanvas.className = 'vs-preview-canvas';
    previewWrapper.appendChild(previewCanvas);

    // Empty state overlay
    const emptyOverlay = document.createElement('div');
    emptyOverlay.className = 'vs-empty-overlay';
    emptyOverlay.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-white/10 mb-3">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        <span class="text-[11px] font-bold text-white/20">Drag media to the timeline to start editing</span>
        <span class="text-[9px] text-white/10 mt-1">Drop clips from the Media Library onto the tracks below</span>
    `;
    previewWrapper.appendChild(emptyOverlay);

    monitorPanel.appendChild(previewWrapper);

    // --- TRANSPORT CONTROLS ---
    const transport = document.createElement('div');
    transport.className = 'vs-transport';

    const transportLeft = document.createElement('div');
    transportLeft.className = 'vs-transport-info';
    const tcDisplay = document.createElement('span');
    tcDisplay.className = 'vs-tc-display';
    tcDisplay.textContent = '00:00:00:00';
    transportLeft.appendChild(tcDisplay);

    const transportCenter = document.createElement('div');
    transportCenter.className = 'vs-transport-buttons';

    const transportBtns = [
        { icon: '⏮', action: 'start', label: 'Go to start' },
        { icon: '⏪', action: 'back', label: 'Step back' },
        { icon: '▶', action: 'play', label: 'Play/Pause', primary: true },
        { icon: '⏩', action: 'forward', label: 'Step forward' },
        { icon: '⏭', action: 'end', label: 'Go to end' }
    ];

    const playBtn = { el: null };

    transportBtns.forEach(t => {
        const btn = document.createElement('button');
        btn.className = `vs-transport-btn ${t.primary ? 'primary' : ''}`;
        btn.innerHTML = t.icon;
        btn.title = t.label;
        btn.onclick = () => handleTransport(t.action);
        if (t.action === 'play') playBtn.el = btn;
        transportCenter.appendChild(btn);
    });

    // Undo/Redo buttons
    const undoBtn = document.createElement('button');
    undoBtn.className = 'vs-transport-btn';
    undoBtn.innerHTML = '↩';
    undoBtn.title = 'Undo (Ctrl+Z)';
    undoBtn.onclick = () => { commandHistory.undo(); timeline.render(); renderPreview(); };
    transportCenter.appendChild(undoBtn);

    const redoBtn = document.createElement('button');
    redoBtn.className = 'vs-transport-btn';
    redoBtn.innerHTML = '↪';
    redoBtn.title = 'Redo (Ctrl+Shift+Z)';
    redoBtn.onclick = () => { commandHistory.redo(); timeline.render(); renderPreview(); };
    transportCenter.appendChild(redoBtn);

    const transportRight = document.createElement('div');
    transportRight.className = 'vs-transport-info';
    transportRight.style.gap = '6px';
    const durDisplay = document.createElement('span');
    durDisplay.className = 'vs-dur-display';
    durDisplay.textContent = '/ 00:00';
    transportRight.appendChild(durDisplay);

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'vs-transport-btn';
    exportBtn.style.cssText = 'background:rgba(217,255,0,0.15);color:#d9ff00;font-size:9px;font-weight:800;padding:4px 10px;border-radius:6px;';
    exportBtn.textContent = '⬇ EXPORT';
    exportBtn.onclick = () => {
        import('./ExportDialog.js').then(({ ExportDialog }) => {
            ExportDialog({ canvas: previewCanvas });
        });
    };
    transportRight.appendChild(exportBtn);

    transport.appendChild(transportLeft);
    transport.appendChild(transportCenter);
    transport.appendChild(transportRight);
    monitorPanel.appendChild(transport);

    centerCol.appendChild(monitorPanel);

    // --- TIMELINE ---
    const timelinePanel = document.createElement('div');
    timelinePanel.className = 'vs-timeline-panel';

    const timeline = Timeline({
        projectState,
        onStateChange: (state) => {
            renderPreview();
            updateInspector();
            audioMixer.render();
        },
        onPlayheadChange: (time) => {
            updateTimecode(time);
            renderPreview();
            audioMixer.applySmartDucking();
        }
    });
    timelinePanel.appendChild(timeline);
    centerCol.appendChild(timelinePanel);

    container.appendChild(centerCol);

    // ==========================================
    // 3. RIGHT PANEL — Inspector / Effects
    // ==========================================
    const rightPanel = document.createElement('div');
    rightPanel.className = 'vs-right-panel';

    // Effects tab bar
    const effectsTabBar = document.createElement('div');
    effectsTabBar.className = 'vs-effects-tabs';

    const effectsTabs = [
        { id: 'inspector', icon: 'ℹ️', label: 'Inspector' },
        { id: 'color', icon: '🎨', label: 'Color' },
        { id: 'chroma', icon: '🟩', label: 'Key' },
        { id: 'text', icon: '✏️', label: 'Text' },
        { id: 'mixer', icon: '🎚', label: 'Audio' }
    ];

    effectsTabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = `vs-effect-tab ${activeEffectsTab === tab.id ? 'active' : ''}`;
        btn.innerHTML = `<span class="text-[10px]">${tab.icon}</span><span class="text-[8px]">${tab.label}</span>`;
        btn.onclick = () => {
            activeEffectsTab = tab.id;
            effectsTabBar.querySelectorAll('.vs-effect-tab').forEach((b, i) => {
                b.classList.toggle('active', effectsTabs[i].id === tab.id);
            });
            renderEffectsPanel();
        };
        effectsTabBar.appendChild(btn);
    });
    rightPanel.appendChild(effectsTabBar);

    // Effects content area
    const effectsContent = document.createElement('div');
    effectsContent.className = 'vs-effects-content';
    rightPanel.appendChild(effectsContent);

    // Create VFX components
    const colorGrading = ColorGrading({
        onApply: () => renderPreview()
    });

    const chromaKey = ChromaKey({
        onApply: () => renderPreview()
    });

    const textOverlay = TextOverlay({
        onApply: () => renderPreview(),
        onAddToTimeline: (item) => {
            const fxTrack = projectState.tracks.find(t => t.type === 'fx');
            if (fxTrack) {
                const lastEnd = fxTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
                fxTrack.clips.push({
                    id: Date.now() + Math.random(),
                    name: item.name || 'Title',
                    type: 'text',
                    startTime: Math.max(projectState.playhead, lastEnd),
                    duration: item.duration || 3,
                    settings: item.settings,
                    volume: 100,
                    opacity: 100
                });
                timeline.render();
            }
        }
    });

    const audioMixer = AudioMixer({
        projectState,
        onStateChange: () => {
            timeline.render();
        }
    });

    // Inspector panel
    const inspectorPanel = document.createElement('div');
    inspectorPanel.className = 'vs-inspector';

    function renderEffectsPanel() {
        effectsContent.innerHTML = '';
        switch (activeEffectsTab) {
            case 'inspector':
                updateInspector();
                effectsContent.appendChild(inspectorPanel);
                break;
            case 'color':
                effectsContent.appendChild(colorGrading);
                break;
            case 'chroma':
                effectsContent.appendChild(chromaKey);
                break;
            case 'text':
                effectsContent.appendChild(textOverlay);
                break;
            case 'mixer':
                audioMixer.expand();
                effectsContent.appendChild(audioMixer);
                break;
        }
    }

    function updateInspector() {
        inspectorPanel.innerHTML = '';
        const sel = projectState.selectedClip;

        if (!sel) {
            inspectorPanel.innerHTML = `
                <div class="vs-inspector-empty">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-white/10 mb-2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    <span class="text-[10px] text-white/20 font-medium">Select a clip to edit properties</span>
                </div>
            `;
            return;
        }

        const clip = sel.clip;

        // Title
        const title = document.createElement('div');
        title.className = 'vs-insp-title';
        title.innerHTML = `<span class="text-[10px] font-black text-white/50 uppercase tracking-widest">Clip Properties</span>`;
        inspectorPanel.appendChild(title);

        // Name
        const nameGroup = createInspectorField('Name', clip.name || 'Untitled', (val) => { clip.name = val; timeline.render(); });
        inspectorPanel.appendChild(nameGroup);

        // Start Time
        const startGroup = createInspectorField('Start', clip.startTime.toFixed(2) + 's', (val) => {
            clip.startTime = Math.max(0, parseFloat(val) || 0);
            timeline.render();
        });
        inspectorPanel.appendChild(startGroup);

        // Duration
        const durGroup = createInspectorField('Duration', clip.duration.toFixed(2) + 's', (val) => {
            clip.duration = Math.max(0.1, parseFloat(val) || 1);
            timeline.render();
        });
        inspectorPanel.appendChild(durGroup);

        // Opacity
        const opacityGroup = createInspectorSlider('Opacity', 0, 100, clip.opacity ?? 100, '%', (val) => {
            clip.opacity = val;
            renderPreview();
        });
        inspectorPanel.appendChild(opacityGroup);

        // Volume (for audio clips)
        if (sel.clip.type === 'audio' || projectState.tracks[sel.trackIdx]?.type === 'audio') {
            const volGroup = createInspectorSlider('Volume', 0, 100, clip.volume ?? 100, '%', (val) => {
                clip.volume = val;
            });
            inspectorPanel.appendChild(volGroup);
        }
    }

    function createInspectorField(label, value, onChange) {
        const group = document.createElement('div');
        group.className = 'vs-insp-field';
        const lbl = document.createElement('label');
        lbl.className = 'vs-insp-label';
        lbl.textContent = label;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = value;
        inp.className = 'vs-insp-input';
        inp.onchange = () => onChange(inp.value);
        group.appendChild(lbl);
        group.appendChild(inp);
        return group;
    }

    function createInspectorSlider(label, min, max, value, unit, onChange) {
        const group = document.createElement('div');
        group.className = 'vs-insp-field';
        const row = document.createElement('div');
        row.className = 'flex justify-between items-center w-full';
        row.innerHTML = `<label class="vs-insp-label">${label}</label><span class="text-[9px] text-white/30 font-mono">${value}${unit}</span>`;
        group.appendChild(row);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.className = 'vfx-slider';
        slider.oninput = () => {
            const val = parseInt(slider.value);
            row.querySelector('span').textContent = val + unit;
            onChange(val);
        };
        group.appendChild(slider);
        return group;
    }

    container.appendChild(rightPanel);

    // ==========================================
    // TRANSPORT CONTROLS
    // ==========================================
    function handleTransport(action) {
        switch (action) {
            case 'start':
                projectState.playhead = 0;
                break;
            case 'back':
                projectState.playhead = Math.max(0, projectState.playhead - 1 / 24);
                break;
            case 'play':
                togglePlayback();
                return;
            case 'forward':
                projectState.playhead += 1 / 24;
                break;
            case 'end':
                projectState.playhead = timeline.getProjectDuration();
                break;
        }
        timeline.setPlayhead(projectState.playhead);
        updateTimecode(projectState.playhead);
        renderPreview();
    }

    function togglePlayback() {
        projectState.isPlaying = !projectState.isPlaying;

        if (projectState.isPlaying) {
            playBtn.el.innerHTML = '⏸';
            playBtn.el.classList.add('playing');
            const FPS = 24;
            const frameDur = 1 / FPS;
            playbackInterval = setInterval(() => {
                projectState.playhead += frameDur;
                const totalDuration = timeline.getProjectDuration();
                if (projectState.playhead >= totalDuration && totalDuration > 0) {
                    projectState.playhead = 0; // Loop
                }
                timeline.setPlayhead(projectState.playhead);
                updateTimecode(projectState.playhead);
                renderPreview();
                audioMixer.applySmartDucking();
            }, 1000 / FPS);
        } else {
            playBtn.el.innerHTML = '▶';
            playBtn.el.classList.remove('playing');
            clearInterval(playbackInterval);
            playbackInterval = null;
        }
    }

    function updateTimecode(time) {
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        const f = Math.floor((time % 1) * 24);
        tcDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
        const dur = timeline.getProjectDuration();
        durDisplay.textContent = `/ ${Math.floor(dur / 60)}:${pad(Math.floor(dur % 60))}`;
    }

    function pad(n) { return n.toString().padStart(2, '0'); }

    // ==========================================
    // PREVIEW RENDERING
    // ==========================================
    function renderPreview() {
        const ctx = previewCanvas.getContext('2d');
        const w = previewCanvas.width;
        const h = previewCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        const time = projectState.playhead;
        let hasVisibleContent = false;

        // Render video tracks (bottom-up for layering)
        const videoTracks = projectState.tracks.filter(t => t.type === 'video' && !t.muted);
        videoTracks.reverse().forEach(track => {
            track.clips.forEach(clip => {
                if (time >= clip.startTime && time < clip.startTime + clip.duration) {
                    hasVisibleContent = true;
                    // Draw placeholder for clip
                    const progress = (time - clip.startTime) / clip.duration;
                    const alpha = (clip.opacity ?? 100) / 100;
                    ctx.globalAlpha = alpha;

                    // Gradient background representing the clip
                    const grad = ctx.createLinearGradient(0, 0, w, h);
                    const hue = (clip.id * 37) % 360;
                    grad.addColorStop(0, `hsla(${hue}, 40%, 20%, 1)`);
                    grad.addColorStop(1, `hsla(${(hue + 60) % 360}, 40%, 15%, 1)`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, w, h);

                    // If we have a thumbnail/URL, try to draw it
                    if (clip.thumbnail || clip.url) {
                        drawImageToCanvas(ctx, clip.thumbnail || clip.url, w, h);
                    }

                    // Clip name overlay
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, h - 30, w, 30);
                    ctx.globalAlpha = 1;
                    ctx.font = 'bold 11px Inter';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${clip.name} — ${(progress * 100).toFixed(0)}%`, 12, h - 11);

                    ctx.globalAlpha = 1;
                }
            });
        });

        // Render FX/Text tracks
        const fxTracks = projectState.tracks.filter(t => t.type === 'fx' && !t.muted);
        fxTracks.forEach(track => {
            track.clips.forEach(clip => {
                if (clip.type === 'text' && clip.settings && time >= clip.startTime && time < clip.startTime + clip.duration) {
                    hasVisibleContent = true;
                    const progress = Math.min(1, (time - clip.startTime) / Math.min(1, clip.duration));
                    textOverlay.renderToCanvas(ctx, w, h, progress);
                }
            });
        });

        // Show/hide empty overlay
        emptyOverlay.style.display = hasVisibleContent ? 'none' : 'flex';

        // Playhead indicator on preview
        if (hasVisibleContent) {
            const dur = timeline.getProjectDuration();
            if (dur > 0) {
                const px = (time / dur) * w;
                ctx.fillStyle = '#d9ff00';
                ctx.fillRect(px - 1, 0, 2, 3);
            }
        }
    }

    // Image cache
    const imageCache = {};
    function drawImageToCanvas(ctx, url, w, h) {
        if (!url) return;
        if (imageCache[url]) {
            ctx.drawImage(imageCache[url], 0, 0, w, h);
        } else {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            img.onload = () => {
                imageCache[url] = img;
                renderPreview(); // Re-render when image loads
            };
        }
    }

    // ==========================================
    // INIT
    // ==========================================
    renderEffectsPanel();
    updateTimecode(0);

    // Keyboard shortcuts (with undo/redo)
    const handleKeydown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayback();
        } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyZ') {
            e.preventDefault();
            commandHistory.redo();
            timeline.render();
            renderPreview();
        } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
            e.preventDefault();
            commandHistory.undo();
            timeline.render();
            renderPreview();
        } else if (e.code === 'Delete' || e.code === 'Backspace') {
            handleTransport('delete');
        } else if (e.code === 'ArrowLeft') {
            handleTransport('back');
        } else if (e.code === 'ArrowRight') {
            handleTransport('forward');
        } else if (e.code === 'Home') {
            handleTransport('start');
        } else if (e.code === 'End') {
            handleTransport('end');
        }
    };
    document.addEventListener('keydown', handleKeydown);

    // Save state on changes
    const saveUnsub = eventBus.on('project:changed', () => {
        projectStore.setState(projectState);
    });

    // Cleanup interval when navigating away
    const cleanup = () => {
        if (playbackInterval) clearInterval(playbackInterval);
        document.removeEventListener('keydown', handleKeydown);
        saveUnsub();
        projectStore.setState(projectState); // Final save
    };
    container._cleanup = cleanup;

    return container;
}
