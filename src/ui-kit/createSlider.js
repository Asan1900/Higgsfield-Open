/**
 * Creates a styled slider control with label, value display, and optional reset.
 * @param {Object} opts
 * @param {string} opts.label - Label text
 * @param {number} opts.min - Minimum value
 * @param {number} opts.max - Maximum value
 * @param {number} opts.value - Initial value
 * @param {number} [opts.step] - Step increment (default 1)
 * @param {string} [opts.unit] - Unit suffix (e.g. '%', 'px')
 * @param {string} [opts.icon] - Optional icon/emoji before label
 * @param {string} [opts.className] - Additional class for the slider input
 * @param {Function} opts.onChange - Called with numeric value on input
 * @param {boolean} [opts.showValue=true] - Whether to show the value display
 * @returns {HTMLElement}
 */
export function createSlider(opts) {
    const {
        label, min = 0, max = 100, value = 50, step = 1,
        unit = '', icon = '', className = '', onChange,
        showValue = true
    } = opts;

    const root = document.createElement('div');
    root.className = 'uikit-slider';

    // Label row
    const labelRow = document.createElement('div');
    labelRow.className = 'uikit-slider-label-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'uikit-slider-label';
    labelEl.textContent = icon ? `${icon} ${label}` : label;
    labelRow.appendChild(labelEl);

    let valueEl;
    if (showValue) {
        valueEl = document.createElement('span');
        valueEl.className = 'uikit-slider-value';
        valueEl.textContent = `${value}${unit}`;
        labelRow.appendChild(valueEl);
    }

    root.appendChild(labelRow);

    // Slider input
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.className = `uikit-slider-input ${className}`.trim();

    input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        if (valueEl) valueEl.textContent = `${v}${unit}`;
        onChange?.(v);
    });

    // Double-click to reset
    input.addEventListener('dblclick', () => {
        input.value = value;
        if (valueEl) valueEl.textContent = `${value}${unit}`;
        onChange?.(value);
    });

    root.appendChild(input);

    // Public API
    root.setValue = (v) => {
        input.value = v;
        if (valueEl) valueEl.textContent = `${v}${unit}`;
    };
    root.getValue = () => parseFloat(input.value);

    return root;
}
