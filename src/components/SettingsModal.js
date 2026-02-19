export function SettingsModal(onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[101] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6';

    const modal = document.createElement('div');
    modal.className = 'w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-3xl animate-fade-in-up glass';

    modal.innerHTML = `
        <div class="flex flex-col items-center text-center mb-8">
            <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-glow mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </div>
            <h2 class="text-2xl font-black text-white uppercase tracking-wider mb-2">Studio Settings</h2>
            <p class="text-secondary text-xs">Configure your API preferences and workspace defaults.</p>
        </div>

        <div class="space-y-6">
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Muapi API Key</label>
                <div class="relative group">
                    <input 
                        type="password" 
                        id="settings-key-input"
                        placeholder="sk-..." 
                        class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 pr-12 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                        value="${localStorage.getItem('muapi_key') || ''}"
                    >
                    <button id="toggle-settings-visibility" class="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                        <svg id="eye-icon-settings" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg id="eye-off-icon-settings" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hidden">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                    <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="cancel-settings-btn" class="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                    Cancel
                </button>
                <button id="save-settings-btn" class="flex-1 bg-primary text-black font-black py-4 rounded-2xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Save Changes
                </button>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector('#settings-key-input');
    const saveBtn = modal.querySelector('#save-settings-btn');
    const cancelBtn = modal.querySelector('#cancel-settings-btn');
    const toggleBtn = modal.querySelector('#toggle-settings-visibility');
    const eyeIcon = modal.querySelector('#eye-icon-settings');
    const eyeOffIcon = modal.querySelector('#eye-off-icon-settings');

    toggleBtn.onclick = () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        eyeIcon.classList.toggle('hidden', !isPassword);
        eyeOffIcon.classList.toggle('hidden', isPassword);
    };

    const close = () => {
        overlay.classList.add('opacity-0');
        modal.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
            if (onClose) onClose();
        }, 300);
    };

    saveBtn.onclick = () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('muapi_key', key);
            close();
        } else {
            input.classList.add('border-red-500/50');
            setTimeout(() => input.classList.remove('border-red-500/50'), 2000);
        }
    };

    cancelBtn.onclick = close;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    return overlay;
}
