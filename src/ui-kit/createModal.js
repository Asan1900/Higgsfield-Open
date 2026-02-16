/**
 * Creates a modal dialog with overlay.
 * @param {Object} opts
 * @param {string} opts.title - Modal title
 * @param {HTMLElement|string} opts.content - Body content (DOM node or HTML string)
 * @param {Function} [opts.onClose] - Called when modal is dismissed
 * @param {{ label: string, className?: string, onClick: Function }[]} [opts.actions] - Footer buttons
 * @param {string} [opts.width] - CSS width (default '480px')
 * @returns {HTMLElement}
 */
export function createModal(opts) {
    const { title, content, onClose, actions = [], width = '480px' } = opts;

    const overlay = document.createElement('div');
    overlay.className = 'uikit-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'uikit-modal';
    modal.style.width = width;

    // Header
    const header = document.createElement('div');
    header.className = 'uikit-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'uikit-modal-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'uikit-modal-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => dismiss());
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'uikit-modal-body';
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }
    modal.appendChild(body);

    // Footer (actions)
    if (actions.length > 0) {
        const footer = document.createElement('div');
        footer.className = 'uikit-modal-footer';

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = action.className || 'uikit-modal-btn';
            btn.textContent = action.label;
            btn.addEventListener('click', () => {
                action.onClick?.();
                if (action.closeOnClick !== false) dismiss();
            });
            footer.appendChild(btn);
        });

        modal.appendChild(footer);
    }

    overlay.appendChild(modal);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) dismiss();
    });

    // Close on Escape
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', onKey);

    function dismiss() {
        document.removeEventListener('keydown', onKey);
        overlay.remove();
        onClose?.();
    }

    // Public API
    overlay.dismiss = dismiss;
    overlay.setContent = (newContent) => {
        body.innerHTML = '';
        if (typeof newContent === 'string') body.innerHTML = newContent;
        else if (newContent instanceof HTMLElement) body.appendChild(newContent);
    };

    return overlay;
}
