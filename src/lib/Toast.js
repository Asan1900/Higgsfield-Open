/**
 * Lightweight Toast Notification System
 * Usage: toast.success('Message') or toast.error('Error')
 */
class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');

        // Colors/Icons based on type
        const configs = {
            success: {
                bg: 'bg-[#111]/90',
                border: 'border-primary/30',
                text: 'text-primary',
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>'
            },
            error: {
                bg: 'bg-[#111]/90',
                border: 'border-red-500/30',
                text: 'text-red-500',
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>'
            },
            info: {
                bg: 'bg-[#111]/90',
                border: 'border-white/10',
                text: 'text-white',
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
            }
        };

        const config = configs[type] || configs.info;

        toast.className = `flex items-center gap-3 px-6 py-4 rounded-2xl border ${config.border} ${config.bg} backdrop-blur-xl shadow-2xl transition-all duration-500 translate-y-10 opacity-0 pointer-events-auto cursor-pointer`;

        toast.innerHTML = `
            <div class="${config.text}">${config.icon}</div>
            <span class="text-xs font-black uppercase tracking-widest text-white/90">${message}</span>
        `;

        this.container.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        const close = () => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-[-20px]', 'opacity-0');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 500);
        };

        toast.onclick = close;

        if (duration > 0) {
            setTimeout(close, duration);
        }
    }

    success(msg, dur) { this.show(msg, 'success', dur); }
    error(msg, dur) { this.show(msg, 'error', dur); }
    info(msg, dur) { this.show(msg, 'info', dur); }
}

export const toast = new ToastManager();
