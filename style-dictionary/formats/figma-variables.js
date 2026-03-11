import { parse, converter, formatHex } from 'culori';

export const figmaVariablesFormat = async ({ dictionary }) => {
    // Create an RGB converter
    const rgbConverter = converter('rgb');

    const formatToken = (token) => {
        if (token.type === 'color' || token.$type === 'color') {
            // Parse the LCH or Hex string from Style Dictionary
            const color = parse(token.$value);

            if (!color) {
                console.warn(`⚠️ Culori could not parse color at ${token.path.join('.')}: ${token.$value}`);
                return { "$type": "color", "$value": token.$value };
            }

            // Convert to sRGB space
            const srgb = rgbConverter(color);

            return {
                "$type": "color",
                "$description": token.$description || token.description || "",
                "$value": {
                    "colorSpace": "srgb",
                    "components": [
                        Math.max(0, Math.min(1, srgb.r)), // Clamp values between 0 and 1
                        Math.max(0, Math.min(1, srgb.g)),
                        Math.max(0, Math.min(1, srgb.b))
                    ],
                    "alpha": srgb.alpha ?? 1,
                    "hex": formatHex(srgb)
                }
            };
        }

        return {
            "$type": token.$type || token.type,
            "$value": token.value
        };
    };

    const result = {};
    dictionary.allTokens.forEach(token => {
        let current = result;
        token.path.forEach((key, index) => {
            if (index === token.path.length - 1) {
                current[key] = formatToken(token);
            } else {
                current[key] = current[key] || {};
                current = current[key];
            }
        });
    });

    return JSON.stringify(result, null, 2);
};