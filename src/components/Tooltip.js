import { h } from '../lib/domUtils.js';

let tooltipEl = null;

/**
 * Custom Tooltip Component
 * 
 * Usage:
 * Add `data-tooltip="My Tooltip Text"` to any element.
 * Call `initTooltips()` once at app startup.
 */
export const Tooltip = {
    init() {
        if (tooltipEl) return;

        tooltipEl = h('div', {
            class: 'fixed z-[99999] pointer-events-none opacity-0 transition-all duration-200 translate-y-1'
        }, h('div', {
            class: 'glass px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-2xl border border-white/10'
        }, ''));

        document.body.appendChild(tooltipEl);

        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.show(target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.hide();
            }
        });

        // Hide on scroll too
        document.addEventListener('scroll', () => this.hide(), true);
    },

    show(target) {
        if (!tooltipEl) return;

        const text = target.getAttribute('data-tooltip');
        const content = tooltipEl.firstChild;
        content.textContent = text;

        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 8;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // Boundary checks
        if (top < 8) top = rect.bottom + 8;
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
        tooltipEl.classList.remove('opacity-0', 'translate-y-1');
        tooltipEl.classList.add('opacity-100', 'translate-y-0');
    },

    hide() {
        if (!tooltipEl) return;
        tooltipEl.classList.add('opacity-0', 'translate-y-1');
        tooltipEl.classList.remove('opacity-100', 'translate-y-0');
    }
};
