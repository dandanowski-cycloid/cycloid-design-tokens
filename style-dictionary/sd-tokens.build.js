import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';
import { figmaVariablesFormat } from './formats/figma-variables.js';

// 1. Register Token Studio transforms
await register(StyleDictionary);

// 2. Register the imported custom format
StyleDictionary.registerFormat({
    name: 'json/figma-variables',
    format: figmaVariablesFormat
});

const sd = new StyleDictionary({
    source: ['style-dictionary/tokens/**/*.json'],
    preprocessors: ['tokens-studio'],
    platforms: {
        web: {
            transforms: [
                'ts/descriptionToComment',
                'ts/size/px',
                'ts/color/modifiers',
                'name/kebab'
            ],
            buildPath: 'build/',
            files: [
                {
                    destination: 'css/variables.css',
                    format: 'css/variables',
                    filter: (token) => !['seed', 'core'].includes(token.path[0]),
                    options: { outputReferences: false }
                },
                {
                    destination: 'scss/_variables.scss',
                    format: 'scss/variables',
                    filter: (token) => !['seed', 'core'].includes(token.path[0]),
                    options: { outputReferences: false }
                }
            ]
        },
        figma: {
            transforms: [
                'ts/descriptionToComment',
                'ts/size/px',
                'ts/color/modifiers',
                'name/kebab'
            ],
            buildPath: 'build/figma/',
            files: [
                {
                    destination: 'cycloid/Light.tokens.json',
                    format: 'json/figma-variables'
                }
            ]
        }
    }
});

// Get the platform from the command line argument (e.g., node build.js figma)
const args = process.argv.slice(2);
const targetPlatform = args[0];

if (targetPlatform) {
    console.log(`\nStarting build for: ${targetPlatform}...`);
    await sd.buildPlatform(targetPlatform);
} else {
    console.log('\nNo platform specified, building all...');
    await sd.buildAllPlatforms();
}