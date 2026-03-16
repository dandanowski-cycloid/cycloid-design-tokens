export const discoveryFormat = async ({ dictionary }) => {
    console.log('🔎 Discovery Format:', Object.keys(dictionary));

    const result = {};

    dictionary.allTokens.forEach(token => {
        console.log('👉 Token (token.name):', token.name, ' \n (token.original):', token.original);
        result[token.name] = token.value;
    });

    return JSON.stringify(result, null, 2);
};