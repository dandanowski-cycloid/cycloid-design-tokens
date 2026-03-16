/**
 * Helper: Converts Hex to Figma's 0-1 RGB/RGBA format.
 */
function parseColor(hex: string): RGB | RGBA {
  hex = hex.replace(/^#/, '');
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

  if (hex.length === 8) {
    const a = Number.parseInt(hex.substring(6, 8), 16) / 255;
    return { r, g, b, a };
  }
  return { r, g, b };
}

/**
 * Helper: Flattens DT JSON Spec respecting $value.
 */
function flattenTokens(obj: any, prefix = ''): Record<string, { value: any, type?: string }> {
  let flattened: Record<string, { value: any, type?: string }> = {};
  const keys = Object.keys(obj);

  for (const key of keys) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && '$value' in value) {
      flattened[newKey] = { value: value.$value, type: value.$type };
    }
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenTokens(value, newKey));
    }
  }
  return flattened;
}

/**
 * Main reconciliation logic with Collection AND Mode selection
 */
async function runSync(nestedTokens: any, collectionName: string, modeName: string) {
  try {
    const tokens = flattenTokens(nestedTokens);

    // 1. Get or Create Collection
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find(c => c.name === collectionName);

    if (!collection) {
      collection = figma.variables.createVariableCollection(collectionName);
    }

    // 2. Get or Create Mode
    // Check if a mode with the target name exists, otherwise rename the first mode or create a new one
    let targetMode = collection.modes.find(m => m.name === modeName);

    if (!targetMode) {
      // If there's only one mode and it's the default "Mode 1", let's just rename it
      if (collection.modes.length === 1 && collection.modes[0].name.startsWith("Mode")) {
        collection.renameMode(collection.modes[0].modeId, modeName);
        targetMode = collection.modes[0];
      } else {
        // Create a new mode (Note: standard Figma plans have limits on number of modes)
        try {
          const newModeId = collection.addMode(modeName);
          targetMode = collection.modes.find(m => m.modeId === newModeId);
        } catch (e) {
          figma.notify("Could not add mode. You may have hit the Figma plan limit.", { error: true });
          return;
        }
      }
    }

    const modeId = targetMode!.modeId;

    // 3. Map existing variables
    const existingVars = await figma.variables.getLocalVariablesAsync();
    const varMap = new Map();
    for (const v of existingVars) {
      if (v.variableCollectionId === collection.id) {
        varMap.set(v.name, v);
      }
    }

    const tokenPaths = Object.keys(tokens);
    let updatedCount = 0;
    let createdCount = 0;

    // 4. Reconcile
    for (const path of tokenPaths) {
      const token = tokens[path];
      const figmaName = path.replace(/\./g, '/');

      let resolvedValue: any = token.value;
      let varType: VariableResolvedDataType = "FLOAT";

      if (typeof token.value.hex === 'string' && token.value.hex.startsWith('#')) {
        resolvedValue = parseColor(token.value.hex);
        varType = "COLOR";
      } else if (typeof token.value === 'number') {
        varType = "FLOAT";
      } else if (typeof token.value === 'string' && (token.value.endsWith('px') || token.value.endsWith('rem'))) {
        resolvedValue = parseFloat(token.value);
        varType = "FLOAT";
      }

      if (varMap.has(figmaName)) {
        const variable = varMap.get(figmaName);
        variable.setValueForMode(modeId, resolvedValue);
        updatedCount++;
      } else {
        const newVar = figma.variables.createVariable(figmaName, collection, varType);
        newVar.setValueForMode(modeId, resolvedValue);
        createdCount++;
      }
    }

    figma.notify(`✅ Sync [${modeName}]: Updated ${updatedCount}, Created ${createdCount}`);
  } catch (error) {
    console.error(error);
    figma.notify("Sync failed. Check console.", { error: true });
  }
}

figma.ui.onmessage = (msg) => {
  if (msg.type === 'sync-tokens') {
    runSync(msg.data, msg.collectionName, msg.modeName);
  }
};

figma.showUI(__html__, { width: 600, height: 640, themeColors: true });