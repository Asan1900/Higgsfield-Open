export function setupUploader(config) {
    const {
        fileInput,
        dropzone,
        preview,
        previewImg,
        clearBtn,
        urlInput,
        onImageSet // callback(url)
    } = config;

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            onImageSet(e.target.result);
            if (previewImg) previewImg.src = e.target.result;
            if (dropzone) dropzone.classList.add('hidden');
            if (preview) preview.classList.remove('hidden');
            if (urlInput) urlInput.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleUrl = () => {
        if (urlInput?.value?.trim()) {
            const url = urlInput.value.trim();
            onImageSet(url);
            if (previewImg) previewImg.src = url;
            if (dropzone) dropzone.classList.add('hidden');
            if (preview) preview.classList.remove('hidden');
        }
    };

    const handleClear = () => {
        onImageSet('');
        if (dropzone) dropzone.classList.remove('hidden');
        if (preview) preview.classList.add('hidden');
    };

    if (fileInput) {
        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    }

    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            // Use a generic highlight class or standard tailwind classes
            dropzone.classList.add('border-primary/60');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('border-primary/60');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-primary/60');
            handleFile(e.dataTransfer.files[0]);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', handleClear);
    }

    if (urlInput) {
        urlInput.addEventListener('change', handleUrl);
    }
}

export function setupButtonGroup(buttons, config) {
    const {
        activeClasses,
        inactiveClasses,
        onSelect // callback(datasetValue)
    } = config;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Remove active classes from all buttons
            buttons.forEach(b => {
                b.classList.remove(...activeClasses);
                b.classList.add(...inactiveClasses);
            });

            // 2. Add active classes to clicked button
            btn.classList.remove(...inactiveClasses);
            btn.classList.add(...activeClasses);

            // 3. Trigger callback with dataset values
            onSelect(btn.dataset);
        });
    });
}

export function downloadMedia(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}
