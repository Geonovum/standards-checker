import spectralFormats from '@stoplight/spectral-formats';
const namespace = spectralFormats ?? {};
const detectedOas3_0 = namespace.oas3_0;
if (typeof detectedOas3_0 !== 'function') {
    throw new Error("Format 'oas3_0' is not available from @stoplight/spectral-formats.");
}
export const oas3_0 = detectedOas3_0;
