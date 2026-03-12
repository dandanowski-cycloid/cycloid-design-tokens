import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';
import { THEMES, LIBRARIES } from './config/settings.js';

await register(StyleDictionary);

// 2. Register a specialized transform for this build
StyleDictionary.registerTransform({
    name: 'name/library-prefix',
    type: 'name',
    filter: (token) => LIBRARIES.some(lib => lib.id === token.path[0]),
    transform: (token) => {
        const libraryId = token.path[0];
        const libraryConfig = LIBRARIES.find(lib => lib.id === libraryId);
        const prefix = libraryConfig ? libraryConfig.prefix : libraryId;
        // Remove the library ID from the path and join the rest
        const restOfPath = token.path.slice(1).join('-');
        return `${prefix}-${restOfPath}`;
    }
});

const buildLibraryMappings = async (themeName, library) => {
    const sd = new StyleDictionary({
        // We include the theme's semantic output as a source 
        // so we can resolve aliases like {color.ui.primary.500}
        source: [
            'style-dictionary/tokens/default/**/*.json',
            `style-dictionary/tokens/themes/${themeName}/**/*.json`, // Use the output from the core build
            `style-dictionary/tokens/mappings/${library.id}/*.json`
        ],
        preprocessors: ['tokens-studio'],
        platforms: {
            scss: {
                transforms: [
                    'ts/descriptionToComment',
                    'ts/size/px',
                    'ts/color/modifiers',
                    'name/kebab',
                    'name/library-prefix',
                ],
                buildPath: `build/web/${themeName}/libraries/`,
                files: [
                    {
                        destination: `_${library.id}-overrides.scss`,
                        format: 'scss/variables',
                        filter: (token) => token.path[0] === library.id,
                        options: {
                            // This will now point to the brand variable names 
                            // (e.g. $color-ui-primary-500) if they are in the same dictionary
                            outputReferences: true
                        }
                    },
                    {
                        destination: `${library.id}-overrides.css`,
                        format: 'css/variables',
                        filter: (token) => token.path[0] === library.id,
                        options: {
                            // This will now point to the brand variable names 
                            // (e.g. $color-ui-primary-500) if they are in the same dictionary
                            outputReferences: true
                        }
                    }
                ]
            }
        }
    });

    await sd.buildAllPlatforms();
};

console.log('🚀 Starting Independent Library Mapping Build...');

for (const theme of THEMES) {
    for (const library of LIBRARIES) {
        console.log(`  - Mapping [${library.id}] for theme [${theme}]`);
        await buildLibraryMappings(theme, library);
    }
}

console.log('\n✅ Library mappings complete.');