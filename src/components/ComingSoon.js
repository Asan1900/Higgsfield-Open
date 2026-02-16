export function ComingSoon(title = 'Page') {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center h-full w-full bg-app-bg text-white';

    container.innerHTML = `
        <div class="text-center space-y-4 p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl animate-fade-in">
            <div class="text-6xl mb-4">🚀</div>
            <h1 class="text-3xl font-black tracking-tight">${title}</h1>
            <p class="text-white/50 max-w-md">
                We're working hard to bring this feature to life. 
                <br>Check back soon for updates!
            </p>
            <div class="pt-4">
                <button class="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors" onclick="history.back()">
                    Go Back
                </button>
            </div>
        </div>
    `;

    return container;
}
