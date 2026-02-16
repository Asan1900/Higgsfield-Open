import { getModelById } from './models.js';

export class MuapiClient {
    constructor() {
        // Ideally user provides this in settings
        this.baseUrl = import.meta.env.DEV ? '' : 'https://api.muapi.ai';
    }

    getKey() {
        const key = localStorage.getItem('muapi_key');
        if (!key) throw new Error('API Key missing. Please set it in Settings.');
        return key;
    }

    /**
     * Generates an image (Text-to-Image or Image-to-Image)
     * @param {Object} params
     * @param {string} params.model
     * @param {string} params.prompt
     * @param {string} params.negative_prompt
     * @param {string} params.aspect_ratio
     * @param {number} params.steps
     * @param {number} params.guidance_scale
     * @param {number} params.seed
     * @param {string} [params.image_url] - If present, treats as Image-to-Image
     */
    async generateImage(params) {
        const key = this.getKey();

        // Resolve endpoint from model definition
        const modelInfo = getModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        // Build payload matching the API's expected format
        const finalPayload = {
            prompt: params.prompt,
        };

        // Aspect ratio (send as string, the API handles it)
        if (params.aspect_ratio) {
            finalPayload.aspect_ratio = params.aspect_ratio;
        }

        // Resolution
        if (params.resolution) {
            finalPayload.resolution = params.resolution;
        }

        // Image-to-Image
        if (params.image_url) {
            finalPayload.image_url = params.image_url;
            finalPayload.strength = params.strength || 0.6;
        } else {
            finalPayload.image_url = null;
        }

        // Optional params if supported by model
        if (params.seed && params.seed !== -1) {
            finalPayload.seed = params.seed;
        }

        console.log('[Muapi] Requesting:', url);
        console.log('[Muapi] Payload:', finalPayload);

        try {
            // Step 1: Submit the task
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Muapi] API Error Body:', errText);
                throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            console.log('[Muapi] Submit Response:', submitData);

            // Extract request_id for polling
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) {
                // Some endpoints return the result directly
                return submitData;
            }

            // Step 2: Poll for results
            console.log('[Muapi] Polling for results, request_id:', requestId);
            const result = await this.pollForResult(requestId, key);

            // Normalize: extract image URL from outputs array
            const imageUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Image URL:', imageUrl);
            return { ...result, url: imageUrl };

        } catch (error) {
            console.error("Muapi Client Error:", error);
            throw error;
        }
    }

    /**
     * Generates a video (Text-to-Video or Image-to-Video)
     * @param {Object} params
     * @param {string} params.model
     * @param {string} params.prompt
     * @param {string} params.aspect_ratio
     * @param {string} [params.image_url] - If present, treats as Image-to-Video
     */
    async generateVideo(params) {
        const key = this.getKey();

        // Resolve endpoint from model definition
        const modelInfo = getModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        // Build payload
        const finalPayload = {
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio || '16:9'
        };

        if (params.image_url) {
            finalPayload.image_url = params.image_url;
        }

        console.log('[Muapi] Requesting Video:', url);
        console.log('[Muapi] Video Payload:', finalPayload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Video API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;

            if (!requestId) return submitData;

            console.log('[Muapi] Polling for video, request_id:', requestId);
            // Videos take longer, so we increase maxAttempts
            const result = await this.pollForResult(requestId, key, 150, 2000);

            // Normalize: extract video URL
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Video URL:', videoUrl);
            return { ...result, url: videoUrl };

        } catch (error) {
            console.error("Muapi Video Error:", error);
            throw error;
        }
    }

    /**
     * Polls the predictions endpoint until the result is ready.
     * @param {string} requestId - The request ID from the submit response
     * @param {string} key - The API key
     * @param {number} maxAttempts - Maximum polling attempts (default 60 = ~2 min)
     * @param {number} interval - Polling interval in ms (default 2000)
     */
    async pollForResult(requestId, key, maxAttempts = 60, interval = 2000) {
        const pollUrl = `${this.baseUrl}/api/v1/predictions/${requestId}/result`;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));

            console.log(`[Muapi] Polling attempt ${attempt}/${maxAttempts}...`);

            try {
                const response = await fetch(pollUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': key
                    }
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`[Muapi] Poll error (${response.status}):`, errText);
                    // Continue polling on non-fatal errors
                    if (response.status >= 500) continue;
                    throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
                }

                const data = await response.json();
                console.log('[Muapi] Poll Response:', data);

                const status = data.status?.toLowerCase();

                if (status === 'completed' || status === 'succeeded' || status === 'success') {
                    return data;
                }

                if (status === 'failed' || status === 'error') {
                    throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
                }

                // Otherwise (processing, pending, etc.) keep polling
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                console.warn('[Muapi] Poll attempt failed, retrying...', error.message);
            }
        }

        throw new Error('Generation timed out after polling.');
    }

    /**
     * Generates ambient audio from a text prompt (mmaudio-v2-text-to-audio)
     * @param {Object} params
     * @param {string} params.prompt - e.g. "Forest wind with distant thunder"
     * @param {number} [params.duration] - Duration in seconds (default 8)
     */
    async generateAudio(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/mmaudio-v2-text-to-audio`;

        const payload = {
            prompt: params.prompt,
            duration: params.duration || 8
        };

        console.log('[Muapi] Requesting Audio:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Audio API Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            const result = await this.pollForResult(requestId, key, 90, 2000);
            const audioUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Audio URL:', audioUrl);
            return { ...result, url: audioUrl };
        } catch (error) {
            console.error('Muapi Audio Error:', error);
            throw error;
        }
    }

    /**
     * Generates speech from text (minimax-speech-2.6-hd)
     * @param {Object} params
     * @param {string} params.text - The dialogue text
     * @param {string} [params.voice] - Voice style/ID
     */
    async generateSpeech(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/minimax-speech-2.6-hd`;

        const payload = {
            text: params.text,
            voice: params.voice || 'default'
        };

        console.log('[Muapi] Requesting Speech:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Speech API Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            const result = await this.pollForResult(requestId, key, 60, 2000);
            const speechUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Speech URL:', speechUrl);
            return { ...result, url: speechUrl };
        } catch (error) {
            console.error('Muapi Speech Error:', error);
            throw error;
        }
    }

    /**
     * Generates music from a text prompt (suno-create-music)
     * @param {Object} params
     * @param {string} params.prompt - e.g. "Epic cinematic orchestral score"
     * @param {number} [params.duration] - Duration in seconds
     */
    async generateMusic(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/suno-create-music`;

        const payload = {
            prompt: params.prompt,
            duration: params.duration || 15
        };

        console.log('[Muapi] Requesting Music:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Music API Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            const result = await this.pollForResult(requestId, key, 120, 3000);
            const musicUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Music URL:', musicUrl);
            return { ...result, url: musicUrl };
        } catch (error) {
            console.error('Muapi Music Error:', error);
            throw error;
        }
    }

    /**
     * Lip-syncs a video to an audio file (sync-lipsync)
     * @param {Object} params
     * @param {string} params.video_url - URL of the video to lip-sync
     * @param {string} params.audio_url - URL of the audio to sync to
     */
    async lipSync(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/sync-lipsync`;

        const payload = {
            video_url: params.video_url,
            audio_url: params.audio_url
        };

        console.log('[Muapi] Requesting Lip-Sync:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Lip-Sync API Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            const result = await this.pollForResult(requestId, key, 150, 2000);
            const syncedUrl = result.outputs?.[0] || result.url || result.output?.url;
            console.log('[Muapi] Lip-Synced Video URL:', syncedUrl);
            return { ...result, url: syncedUrl };
        } catch (error) {
            console.error('Muapi Lip-Sync Error:', error);
            throw error;
        }
    }

    getDimensionsFromAR(ar) {
        // Base unit 1024 (Flux standard)
        switch (ar) {
            case '1:1': return [1024, 1024];
            case '16:9': return [1280, 720]; // 1024*1024 area approx
            case '9:16': return [720, 1280];
            case '4:3': return [1152, 864];
            case '3:2': return [1216, 832];
            case '21:9': return [1536, 640];
            default: return [1024, 1024];
        }
    }
}

export const muapi = new MuapiClient();
