export const CAMERA_MAP = {
    "Modular 8K Digital": "modular 8K digital cinema camera",
    "Full-Frame Cine Digital": "full-frame digital cinema camera",
    "Grand Format 70mm Film": "grand format 70mm film camera",
    "Studio Digital S35": "Super 35 studio digital camera",
    "Classic 16mm Film": "classic 16mm film camera",
    "Premium Large Format Digital": "premium large-format digital cinema camera"
};

export const LENS_MAP = {
    "Creative Tilt Lens": "creative tilt lens effect",
    "Compact Anamorphic": "compact anamorphic lens",
    "Extreme Macro": "extreme macro lens",
    "70s Cinema Prime": "1970s cinema prime lens",
    "Classic Anamorphic": "classic anamorphic lens",
    "Premium Modern Prime": "premium modern prime lens",
    "Warm Cinema Prime": "warm-toned cinema prime lens",
    "Swirl Bokeh Portrait": "swirl bokeh portrait lens",
    "Vintage Prime": "vintage prime lens",
    "Halation Diffusion": "halation diffusion filter",
    "Clinical Sharp Prime": "ultra-sharp clinical prime lens"
};

export const FOCAL_PERSPECTIVE = {
    8: "ultra-wide perspective",
    14: "wide-angle perspective",
    24: "wide-angle dynamic perspective",
    35: "natural cinematic perspective",
    50: "standard portrait perspective",
    85: "classic portrait perspective"
};

export const APERTURE_EFFECT = {
    "f/1.4": "shallow depth of field, creamy bokeh",
    "f/4": "balanced depth of field",
    "f/11": "deep focus clarity, sharp foreground to background"
};

/**
 * Compiles a cinematic prompt based on camera settings.
 * @param {string} basePrompt 
 * @param {string} camera 
 * @param {string} lens 
 * @param {number} focalLength 
 * @param {string} aperture 
 * @returns {string} The compiled prompt
 */
export function buildNanoBananaPrompt(basePrompt, camera, lens, focalLength, aperture) {
    const cameraDesc = CAMERA_MAP[camera] || camera;
    const lensDesc = LENS_MAP[lens] || lens;
    const perspective = FOCAL_PERSPECTIVE[focalLength] || "";
    const depthEffect = APERTURE_EFFECT[aperture] || "";

    const qualityTags = [
        "professional photography",
        "ultra-detailed",
        "8K resolution"
    ];

    const parts = [
        basePrompt,
        `shot on a ${cameraDesc}`,
        `using a ${lensDesc} at ${focalLength}mm ${perspective ? `(${perspective})` : ''}`,
        `aperture ${aperture}`,
        depthEffect,
        "cinematic lighting",
        "natural color science",
        "high dynamic range",
        qualityTags.join(", ")
    ];

    // Filter out empty strings and join
    return parts.filter(p => p && p.trim() !== "").join(", ");
}

// ==========================================
// MOTION CONTROL MAPS (for Video Mode)
// ==========================================

/**
 * Describes camera motion intensity.
 * Slider range: -100 (strong negative) to +100 (strong positive), 0 = static.
 */
const describeMotion = (value, negLabel, posLabel) => {
    const abs = Math.abs(value);
    if (abs < 10) return ''; // Dead zone
    const intensity = abs < 35 ? 'subtle' : abs < 65 ? 'smooth' : 'dramatic';
    const direction = value < 0 ? negLabel : posLabel;
    return `${intensity} ${direction}`;
};

/**
 * Lens → default motion presets.
 * Each lens has a characteristic "feel" that maps to default slider positions.
 */
export const LENS_MOTION_PRESET = {
    "Creative Tilt Lens": { pan: 0, tilt: -20, zoom: 0, dolly: 15 },
    "Compact Anamorphic": { pan: 40, tilt: 0, zoom: 0, dolly: 0 },
    "Extreme Macro": { pan: 0, tilt: 0, zoom: 0, dolly: 30 },
    "70s Cinema Prime": { pan: 25, tilt: 0, zoom: 0, dolly: 0 },
    "Classic Anamorphic": { pan: 50, tilt: 0, zoom: 0, dolly: 0 },
    "Premium Modern Prime": { pan: 0, tilt: 0, zoom: 20, dolly: 0 },
    "Warm Cinema Prime": { pan: 15, tilt: 0, zoom: 0, dolly: 10 },
    "Swirl Bokeh Portrait": { pan: 0, tilt: 0, zoom: 30, dolly: 0 },
    "Vintage Prime": { pan: 20, tilt: 0, zoom: 0, dolly: 0 },
    "Halation Diffusion": { pan: 0, tilt: 10, zoom: 0, dolly: 15 },
    "Clinical Sharp Prime": { pan: 0, tilt: 0, zoom: 0, dolly: 25 }
};

/**
 * Builds a cinematic prompt for VIDEO generation.
 * Extends the image prompt with directed camera motion language.
 *
 * @param {string} basePrompt
 * @param {string} camera
 * @param {string} lens
 * @param {number} focalLength
 * @param {string} aperture
 * @param {{ pan: number, tilt: number, zoom: number, dolly: number }} motion
 * @returns {string}
 */
export function buildCinemaVideoPrompt(basePrompt, camera, lens, focalLength, aperture, motion) {
    const cameraDesc = CAMERA_MAP[camera] || camera;
    const lensDesc = LENS_MAP[lens] || lens;
    const perspective = FOCAL_PERSPECTIVE[focalLength] || "";
    const depthEffect = APERTURE_EFFECT[aperture] || "";

    // Build motion descriptions
    const motionParts = [
        describeMotion(motion.pan, 'pan right-to-left', 'pan left-to-right'),
        describeMotion(motion.tilt, 'tilt downward', 'tilt upward'),
        describeMotion(motion.zoom, 'zoom out', 'zoom in'),
        describeMotion(motion.dolly, 'dolly pull back', 'dolly push forward')
    ].filter(Boolean);

    const motionString = motionParts.length > 0
        ? `camera movement: ${motionParts.join(', ')}`
        : 'static camera, locked-off shot';

    const parts = [
        basePrompt,
        `shot on a ${cameraDesc}`,
        `using a ${lensDesc} at ${focalLength}mm ${perspective ? `(${perspective})` : ''}`,
        `aperture ${aperture}`,
        depthEffect,
        motionString,
        "cinematic lighting",
        "natural color science",
        "high dynamic range",
        "professional cinematography"
    ];

    return parts.filter(p => p && p.trim() !== "").join(", ");
}
