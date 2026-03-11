import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

// 1. Register the Token Studio transforms
await register(StyleDictionary);

const sd = new StyleDictionary({
    source: ['tokens/**/*.json'],
    preprocessors: ['tokens-studio'],
    platforms: {
        css: {
            // 2. We use 'tokens-studio' for the math, 
            // then explicitly ensure the name transform is kebab-case
            transforms: [
                'ts/descriptionToComment',
                'ts/size/px',
                'ts/opacity',
                'ts/color/modifiers', // This handles the lighten/darken math
                'name/kebab'          // This ensures the output is --kebab-case
            ],
            buildPath: 'build/',
            files: [
                {
                    // Outputting CSS variables
                    destination: 'css/variables.css',
                    format: 'css/variables',
                    filter: (token) => !['seed'].includes(token.path[0]),
                    options: {
                        outputReferences: false,
                        showFileHeader: true
                    }
                },
                {
                    // Outputting SCSS variables
                    destination: 'scss/_variables.scss',
                    format: 'scss/variables',
                    filter: (token) => !['seed'].includes(token.path[0]),
                    options: {
                        outputReferences: false
                    }
                }
            ]
        }
    }
});

await sd.buildAllPlatforms();
console.log('\n🚀 Build complete: Kebab-case variables generated in build/css/variables.css');