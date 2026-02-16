/**
 * Analyzes audio URLs and produces waveform amplitude data using Web Audio API.
 * Results are cached per URL.
 */

const cache = new Map();

/**
 * Synchronously get waveform from cache if available.
 */
export function getCachedWaveform(url, samples) {
    return cache.get(`${url}__${samples}`);
}

/**
 * Decode an audio URL and return normalized waveform data.
 * @param {string} url - Audio file URL
 * @param {number} [samples=100] - Number of waveform samples to return
 * @returns {Promise<Float32Array>} Normalized amplitudes (0..1)
 */
export async function analyzeAudioUrl(url, samples = 100) {
    const cacheKey = `${url}__${samples}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0); // first channel
        const blockSize = Math.floor(channelData.length / samples);
        const waveform = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            let sum = 0;
            const start = i * blockSize;
            for (let j = start; j < start + blockSize && j < channelData.length; j++) {
                sum += Math.abs(channelData[j]);
            }
            waveform[i] = sum / blockSize;
        }

        // Normalize to 0..1
        const max = Math.max(...waveform) || 1;
        for (let i = 0; i < samples; i++) {
            waveform[i] = waveform[i] / max;
        }

        cache.set(cacheKey, waveform);
        await ctx.close();
        return waveform;
    } catch (err) {
        console.warn('[AudioAnalyzer] Failed to analyze:', url, err);
        // Return random fallback
        const fallback = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            fallback[i] = 0.2 + Math.random() * 0.6;
        }
        return fallback;
    }
}

/**
 * Clear cache (useful when removing assets).
 * @param {string} [url] - Specific URL to clear, or all if omitted
 */
export function clearWaveformCache(url) {
    if (url) {
        for (const key of cache.keys()) {
            if (key.startsWith(url)) cache.delete(key);
        }
    } else {
        cache.clear();
    }
}
