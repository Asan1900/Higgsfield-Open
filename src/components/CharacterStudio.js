
export function CharacterStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg text-white p-6 overflow-y-auto custom-scrollbar';

    // State
    const uploadedImages = [];
    let isTraining = false;

    // Header
    const header = document.createElement('div');
    header.className = 'text-center mb-10 animate-fade-in-up';
    header.innerHTML = `
        <h1 class="text-4xl md:text-6xl font-black tracking-tighter mb-2">CHARACTER <span class="text-primary">STUDIO</span></h1>
        <p class="text-secondary text-sm font-medium tracking-wide opacity-60">Train consistent AI characters for your films</p>
    `;
    container.appendChild(header);

    // Main Content (Split View)
    const content = document.createElement('div');
    content.className = 'w-full max-w-6xl flex flex-col md:flex-row gap-8 animate-fade-in-up';
    content.style.animationDelay = '0.1s';

    // --- LEFT: Training Data ---
    const leftPanel = document.createElement('div');
    leftPanel.className = 'flex-1 bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col';

    const leftHeader = document.createElement('div');
    leftHeader.className = 'flex justify-between items-center mb-4';
    leftHeader.innerHTML = `
        <h2 class="text-lg font-bold uppercase tracking-wider">Training Data</h2>
        <span class="text-xs text-secondary bg-white/5 px-2 py-1 rounded">10-20 images required</span>
    `;
    leftPanel.appendChild(leftHeader);

    const uploadGrid = document.createElement('div');
    uploadGrid.className = 'grid grid-cols-3 sm:grid-cols-4 gap-3 flex-1 min-h-[300px] content-start';

    // Add upload button as first item
    const uploadBtn = document.createElement('div');
    uploadBtn.className = 'aspect-square bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group';
    uploadBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-secondary group-hover:text-white transition-colors"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <span class="text-[10px] uppercase font-bold text-secondary group-hover:text-white">Upload</span>
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden';
    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (uploadedImages.length < 20) {
                const url = URL.createObjectURL(file);
                uploadedImages.push(url);
                renderGrid();
            }
        });
        updateTrainButton();
    };

    uploadGrid.appendChild(uploadBtn);
    leftPanel.appendChild(uploadGrid);

    const renderGrid = () => {
        // Clear all except upload button
        while (uploadGrid.lastChild !== uploadBtn) {
            uploadGrid.removeChild(uploadGrid.lastChild);
        }

        uploadedImages.forEach((url, idx) => {
            const imgItem = document.createElement('div');
            imgItem.className = 'aspect-square relative group rounded-xl overflow-hidden border border-white/10';
            imgItem.innerHTML = `
                <img src="${url}" class="w-full h-full object-cover">
                <button class="absolute top-1 right-1 bg-black/50 hover:bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all text-xs" data-idx="${idx}">✕</button>
            `;
            imgItem.querySelector('button').onclick = (e) => {
                e.preventDefault();
                uploadedImages.splice(idx, 1);
                renderGrid();
                updateTrainButton();
            };
            // Insert before upload button? No, upload button is first.
            // Items should be after upload button?
            // Actually usually upload is first.
            // Let's restructure: uploadBtn is always first.
        });

        // Re-append items after upload button
        uploadedImages.forEach((url, idx) => {
            const imgItem = document.createElement('div');
            imgItem.className = 'aspect-square relative group rounded-xl overflow-hidden border border-white/10 animate-fade-in';
            imgItem.innerHTML = `
                <img src="${url}" class="w-full h-full object-cover">
                <button class="absolute top-1 right-1 bg-black/50 hover:bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
            `;
            imgItem.querySelector('button').onclick = () => {
                uploadedImages.splice(idx, 1);
                renderGrid();
                updateTrainButton();
            };
            uploadGrid.appendChild(imgItem);
        });
    };

    // --- RIGHT: Profile & Status ---
    const rightPanel = document.createElement('div');
    rightPanel.className = 'w-full md:w-[350px] bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col gap-6';

    rightPanel.innerHTML = `
        <div>
            <label class="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Character Name</label>
            <input type="text" id="char-name" placeholder="e.g. Agent Smith" class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors">
        </div>
        
        <div>
            <label class="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Trigger Word</label>
            <div class="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-primary font-mono text-sm opacity-50 cursor-not-allowed" id="trigger-preview">@agent_smith</div>
            <p class="text-[10px] text-white/40 mt-1">Use this in your prompts to summon the character.</p>
        </div>

        <div class="h-px bg-white/5 my-2"></div>

        <div id="training-status" class="hidden">
            <div class="flex justify-between text-xs font-bold mb-2">
                <span class="text-white">Training LoRA...</span>
                <span id="progress-text" class="text-primary">0%</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div id="progress-bar" class="bg-primary h-full w-0 transition-all duration-300"></div>
            </div>
            <p class="text-[10px] text-white/40 mt-2">Estimated time: <span id="time-left">20m</span></p>
        </div>

        <button id="train-btn" class="w-full bg-white/5 text-white/40 font-black uppercase py-4 rounded-xl cursor-not-allowed transition-all mt-auto" disabled>
            Start Training
        </button>
    `;

    content.appendChild(leftPanel);
    content.appendChild(rightPanel);
    container.appendChild(content);

    // Event Listeners
    const nameInput = rightPanel.querySelector('#char-name');
    const triggerPreview = rightPanel.querySelector('#trigger-preview');
    const trainBtn = rightPanel.querySelector('#train-btn');
    const statusDiv = rightPanel.querySelector('#training-status');
    const progressBar = rightPanel.querySelector('#progress-bar');
    const progressText = rightPanel.querySelector('#progress-text');
    const timeLeft = rightPanel.querySelector('#time-left');

    nameInput.oninput = (e) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        triggerPreview.textContent = val ? `@${val}` : '@...';
        updateTrainButton();
    };

    function updateTrainButton() {
        // Need at least 5 images and a name
        const hasImages = uploadedImages.length >= 5;
        const hasName = nameInput.value.trim().length > 0;

        if (hasImages && hasName && !isTraining) {
            trainBtn.disabled = false;
            trainBtn.className = 'w-full bg-primary text-black font-black uppercase py-4 rounded-xl hover:shadow-glow hover:scale-105 active:scale-95 transition-all mt-auto shadow-lg';
        } else {
            trainBtn.disabled = true;
            trainBtn.className = 'w-full bg-white/5 text-white/40 font-black uppercase py-4 rounded-xl cursor-not-allowed transition-all mt-auto';
        }
    }

    trainBtn.onclick = () => {
        isTraining = true;
        trainBtn.disabled = true;
        trainBtn.textContent = 'Initializing...';
        statusDiv.classList.remove('hidden');

        // Mock Training Process
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress > 100) progress = 100;

            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.floor(progress)}%`;

            const remaining = Math.ceil((100 - progress) / 5);
            timeLeft.textContent = `${remaining}s`; // sped up for demo

            if (progress === 100) {
                clearInterval(interval);
                finishTraining();
            }
        }, 200);
    };

    function finishTraining() {
        isTraining = false;
        trainBtn.textContent = 'Training Complete! ✅';
        trainBtn.className = 'w-full bg-[#d9ff00] text-black font-black uppercase py-4 rounded-xl mt-auto';

        // Save Character
        const character = {
            id: Date.now(),
            name: nameInput.value,
            trigger: triggerPreview.textContent,
            thumbnail: uploadedImages[0],
            images: uploadedImages
        };

        const existing = JSON.parse(localStorage.getItem('trained_characters') || '[]');
        existing.push(character);
        localStorage.setItem('trained_characters', JSON.stringify(existing));

        // Redirect after delay?
        setTimeout(() => {
            alert(`Character ${character.name} saved! You can now use ${character.trigger} in Cinema Studio.`);
            // Maybe navigate to Cinema Studio?
            // window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'cinema' } }));
            // Reset for now
            trainBtn.textContent = 'Start Training';
            uploadedImages.length = 0;
            renderGrid();
            nameInput.value = '';
            triggerPreview.textContent = '@...';
            statusDiv.classList.add('hidden');
            updateTrainButton();
        }, 1500);
    }

    // Pre-fill with some demo images if empty? No, keep clean.

    return container;
}
