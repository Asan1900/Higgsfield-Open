/**
 * Creates a styled toggle button.
 * @param {Object} opts
 * @param {string} opts.label - Button label text
 * @param {string} [opts.icon] - Optional icon/emoji
 * @param {boolean} [opts.active] - Initial active state
 * @param {string} [opts.activeClass] - CSS class when active (default 'active')
 * @param {Function} opts.onChange - Called with boolean
 * @returns {HTMLElement}
 */
export function createToggle(opts) {
    const {
        label, icon = '', active = false,
        activeClass = 'active', onChange
    } = opts;

    let isActive = active;

    const btn = document.createElement('button');
    btn.className = `uikit-toggle ${isActive ? activeClass : ''}`;
    btn.textContent = icon ? `${icon} ${label}` : label;

    btn.addEventListener('click', () => {
        isActive = !isActive;
        btn.classList.toggle(activeClass, isActive);
        onChange?.(isActive);
    });

    // Public API
    btn.setActive = (v) => {
        isActive = v;
        btn.classList.toggle(activeClass, isActive);
    };
    btn.getActive = () => isActive;

    return btn;
}
