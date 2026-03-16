import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';
import { figmaVariablesFormat } from './formats/figma-variables.js';
import { THEMES } from './config/settings.js';

// 1. Register Token Studio transforms
await register(StyleDictionary);

// 2. Register the imported custom format
StyleDictionary.registerFormat({
    name: 'json/figma-variables',
    format: figmaVariablesFormat
});

StyleDictionary.registerFormat({
    name: 'json/nested-tokens-studio',
    format: function ({ dictionary }) {
        return JSON.stringify(dictionary.tokens, null, 2);
    }
});

const buildTheme = async (theme) => {

    console.log(`\n🎨 Building Theme: ${theme}`);

    const sd = new StyleDictionary({
        source: [
            'style-dictionary/tokens/default/**/*.json',
            `style-dictionary/tokens/themes/${theme}/**/*.json`,
        ],
        preprocessors: ['tokens-studio'],
        platforms: {
            web: {
                transforms: [
                    'ts/descriptionToComment',
                    'ts/size/px',
                    'ts/color/modifiers',
                    'name/kebab'
                ],
                buildPath: `build/web/${theme}/`,
                files: [
                    {
                        destination: 'vars-core.css',
                        format: 'css/variables',
                        filter: (token) => ['core'].includes(token.path[0]),
                        options: { outputReferences: false }
                    },
                    {
                        destination: 'vars-semantic.css',
                        format: 'css/variables',
                        filter: (token) => ['semantic'].includes(token.path[0]),
                        options: { outputReferences: false }
                    },
                    {
                        destination: '_vars-core.scss',
                        format: 'scss/variables',
                        filter: (token) => ['core'].includes(token.path[0]),
                        options: { outputReferences: false }
                    },
                    {
                        destination: '_vars-semantic.scss',
                        format: 'scss/variables',
                        filter: (token) => ['semantic'].includes(token.path[0]),
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
                        destination: `core/${theme}.tokens.json`,
                        format: 'json/figma-variables',
                        filter: (token) => ['core'].includes(token.path[0]),
                        options: { outputReferences: true }
                    },
                    {
                        destination: `semantic/${theme}.tokens.json`,
                        format: 'json/figma-variables',
                        filter: (token) => ['semantic'].includes(token.path[0]),
                        options: { outputReferences: true }
                    }
                ]
            },
            tokensStudio: {
                transforms: [
                    'ts/descriptionToComment',
                    'ts/size/px',
                    'ts/color/modifiers',
                    'name/kebab'
                ],
                buildPath: 'build/tokens-studio/',
                files: [
                    {
                        destination: `core/${theme}.tokens.json`,
                        format: 'json/nested-tokens-studio',
                        filter: (token) => ['core'].includes(token.path[0]),
                        options: { outputReferences: true }
                    },
                    {
                        destination: `semantic/${theme}.tokens.json`,
                        format: 'json/nested-tokens-studio',
                        filter: (token) => ['semantic'].includes(token.path[0]),
                        options: { outputReferences: true }
                    }
                ]
            }
        }
    });
    await sd.buildAllPlatforms();
}

// Run the loop
for (const theme of THEMES) {
    await buildTheme(theme);
}