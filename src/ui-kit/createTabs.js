/**
 * Creates a styled tab bar.
 * @param {Object} opts
 * @param {{ id: string, label: string, icon?: string }[]} opts.tabs - Tab definitions
 * @param {string} opts.activeId - Initially active tab ID
 * @param {string} [opts.className] - Additional root class
 * @param {Function} opts.onChange - Called with tab ID
 * @returns {HTMLElement}
 */
export function createTabs(opts) {
    const { tabs, activeId, className = '', onChange } = opts;

    let currentId = activeId;

    const root = document.createElement('div');
    root.className = `uikit-tabs ${className}`.trim();

    const tabEls = [];

    tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = `uikit-tab ${tab.id === currentId ? 'active' : ''}`;
        btn.dataset.tabId = tab.id;

        if (tab.icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'uikit-tab-icon';
            iconSpan.textContent = tab.icon;
            btn.appendChild(iconSpan);
        }

        const labelSpan = document.createElement('span');
        labelSpan.className = 'uikit-tab-label';
        labelSpan.textContent = tab.label;
        btn.appendChild(labelSpan);

        btn.addEventListener('click', () => {
            if (currentId === tab.id) return;
            currentId = tab.id;
            tabEls.forEach(el => el.classList.toggle('active', el.dataset.tabId === currentId));
            onChange?.(currentId);
        });

        tabEls.push(btn);
        root.appendChild(btn);
    });

    // Public API
    root.setActive = (id) => {
        currentId = id;
        tabEls.forEach(el => el.classList.toggle('active', el.dataset.tabId === id));
    };
    root.getActive = () => currentId;

    return root;
}
