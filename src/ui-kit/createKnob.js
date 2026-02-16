/**
 * Creates a rotary knob control (rendered as a mini horizontal slider for simplicity).
 * @param {Object} opts
 * @param {string} opts.label - Knob label
 * @param {number} [opts.min] - Min value (default -100)
 * @param {number} [opts.max] - Max value (default 100)
 * @param {number} [opts.value] - Initial value (default 0)
 * @param {string} [opts.unit] - Unit suffix (e.g. 'L/R')
 * @param {Function} opts.onChange - Called with numeric value
 * @returns {HTMLElement}
 */
export function createKnob(opts) {
    const {
        label, min = -100, max = 100, value = 0,
        unit = '', onChange
    } = opts;

    const root = document.createElement('div');
    root.className = 'uikit-knob';

    if (label) {
        const labelEl = document.createElement('span');
        labelEl.className = 'uikit-knob-label';
        labelEl.textContent = label;
        root.appendChild(labelEl);
    }

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.value = value;
    input.className = 'uikit-knob-input';

    input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        onChange?.(v);
    });

    input.addEventListener('dblclick', () => {
        const center = Math.round((max + min) / 2);
        input.value = center;
        onChange?.(center);
    });

    root.appendChild(input);

    // Public API
    root.setValue = (v) => { input.value = v; };
    root.getValue = () => parseFloat(input.value);

    return root;
}
