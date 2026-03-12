import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';
import { THEMES, LIBRARIES } from './config/settings.js';

await register(StyleDictionary);

StyleDictionary.registerTransform({
    name: 'attribute/library-prefix',
    type: 'attribute',
    filter: (token) => LIBRARIES.some(lib => lib.id === token.path[0]),
    transform: (token) => {
        const libraryId = token.path[0];
        const libraryConfig = LIBRARIES.find(lib => lib.id === libraryId);
        const prefix = libraryConfig ? libraryConfig.prefix : libraryId;
        token.path = [prefix, ...token.path.slice(1)];
        return {
            library: libraryId
        };
    }
});

const buildLibraryMappings = async (themeName, library) => {
    const sd = new StyleDictionary({
        source: [
            'style-dictionary/tokens/default/**/*.json',
            `style-dictionary/tokens/themes/${themeName}/**/*.json`,
            `style-dictionary/tokens/mappings/${library.id}/*.json`
        ],
        preprocessors: ['tokens-studio'],
        platforms: {
            scss: {
                transforms: [
                    'ts/descriptionToComment',
                    'ts/size/px',
                    'ts/color/modifiers',
                    'attribute/library-prefix',
                    'name/kebab',
                ],
                buildPath: `build/web/${themeName}/libraries/`,
                files: [
                    {
                        destination: `_${library.id}-overrides.scss`,
                        format: 'scss/variables',
                        filter: (token) => token.path[0] === library.prefix,
                        options: { outputReferences: true }
                    },
                    {
                        destination: `${library.id}-overrides.css`,
                        format: 'css/variables',
                        filter: (token) => token.path[0] === library.prefix,
                        options: { outputReferences: true }
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