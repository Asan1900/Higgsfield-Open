/**
 * Lightweight hyperscript helper for DOM creation.
 * @param {string} tag - The HTML tag name (e.g., 'div', 'span', 'button').
 * @param {Object} [props] - Optional attributes and event listeners.
 * @param {...(Node|string|null|undefined|boolean)} [children] - Optional children.
 * @returns {HTMLElement}
 */
export function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);

    // Apply props
    for (const [key, value] of Object.entries(props || {})) {
        if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.toLowerCase().slice(2);
            el.addEventListener(eventName, value);
        } else if (key === 'className' || key === 'class') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(el.dataset, value);
        } else {
            el.setAttribute(key, value);
        }
    }

    // Append children
    children.flat().forEach(child => {
        if (child === null || child === undefined || child === false) return;
        if (child instanceof Node) {
            el.appendChild(child);
        } else {
            el.appendChild(document.createTextNode(String(child)));
        }
    });

    return el;
}
