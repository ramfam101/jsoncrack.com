/**
 * Parse node path from format "{Root}.fruit.name" to ["fruit", "name"]
 */
export const parseNodePath = (path: string): string[] => {
  if (!path || path === "{Root}") return [];
  
  // Remove {Root}. prefix and split by dots
  const cleanPath = path.replace(/^\{Root\}\.?/, "");
  return cleanPath ? cleanPath.split(".") : [];
};

/**
 * Set value at specific path in object
 */
export const setValueAtPath = (obj: any, path: string[], value: any): any => {
  if (path.length === 0) return value;
  
  const result = JSON.parse(JSON.stringify(obj)); // Deep clone
  let current = result;
  
  // Navigate to parent of target
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  // Set the final value
  const finalKey = path[path.length - 1];
  current[finalKey] = value;
  
  return result;
};

/**
 * Parse and validate JSON value
 */
export const parseNodeValue = (value: string): any => {
  if (!value.trim()) return "";
  
  // Try to parse as JSON first
  try {
    return JSON.parse(value);
  } catch {
    // If not valid JSON, treat as string
    return value;
  }
};