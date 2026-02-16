import { createModal } from '../ui-kit/index.js';
import { renderTimeline, downloadBlob } from '../lib/ExportEngine.js';
import { projectStore } from '../lib/ProjectStore.js';

/**
 * Export Dialog — modal with format/quality options and progress bar.
 * @param {Object} opts
 * @param {HTMLCanvasElement} opts.canvas - Preview canvas to capture from
 * @returns {HTMLElement} The modal overlay element
 */
export function ExportDialog({ canvas }) {
    const content = document.createElement('div');
    content.className = 'export-dialog-content';

    // Format
    content.innerHTML = `
        <div class="export-field">
            <label class="vfx-label">Format</label>
            <select id="export-format" class="vfx-select" style="width:100%">
                <option value="webm">WebM (VP9)</option>
                <option value="mp4">MP4 (if supported)</option>
            </select>
        </div>
        <div class="export-field">
            <label class="vfx-label">Quality</label>
            <select id="export-quality" class="vfx-select" style="width:100%">
                <option value="720p">720p (4 Mbps)</option>
                <option value="1080p">1080p (8 Mbps)</option>
            </select>
        </div>
        <div class="export-progress hidden" id="export-progress-area">
            <div class="export-progress-bar-bg">
                <div class="export-progress-bar-fill" id="export-progress-fill"></div>
            </div>
            <div class="export-progress-text" id="export-progress-text">Initializing...</div>
        </div>
    `;

    let isRendering = false;

    const modal = createModal({
        title: '🎬 Export Video',
        content,
        width: '400px',
        actions: [
            {
                label: 'Cancel',
                className: 'uikit-modal-btn secondary',
                closeOnClick: true,
                onClick: () => { }
            },
            {
                label: 'Export',
                className: 'uikit-modal-btn primary',
                closeOnClick: false,
                onClick: async () => {
                    if (isRendering) return;
                    isRendering = true;

                    const format = content.querySelector('#export-format').value;
                    const quality = content.querySelector('#export-quality').value;
                    const progressArea = content.querySelector('#export-progress-area');
                    const progressFill = content.querySelector('#export-progress-fill');
                    const progressText = content.querySelector('#export-progress-text');

                    progressArea.classList.remove('hidden');

                    try {
                        const blob = await renderTimeline({
                            projectState: projectStore.getState(),
                            canvas,
                            format,
                            quality,
                            onProgress: ({ percent, phase }) => {
                                progressFill.style.width = `${percent}%`;
                                progressText.textContent = phase;
                            }
                        });

                        const ext = format === 'mp4' ? 'mp4' : 'webm';
                        const name = `${projectStore.getState().name || 'export'}_${Date.now()}.${ext}`;
                        downloadBlob(blob, name);

                        progressText.textContent = '✅ Download started!';
                        setTimeout(() => modal.dismiss(), 2000);

                    } catch (err) {
                        progressText.textContent = `❌ ${err.message}`;
                        isRendering = false;
                    }
                }
            }
        ]
    });

    document.body.appendChild(modal);
    return modal;
}
