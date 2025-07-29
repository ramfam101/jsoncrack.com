import { JSONPath } from "jsonpath-plus";

/**
 * Update a value in a JSON object using JSONPath syntax
 * @param json - The JSON object to update
 * @param path - JSONPath expression for the location to update
 * @param newValue - The new value to set
 * @returns The updated JSON object
 */
export const updateJsonValueAtPath = (json: object, path: string, newValue: any): object => {
  try {
    // Clone the JSON to avoid mutations
    const clonedJson = JSON.parse(JSON.stringify(json));
    
    // Convert the graph path format to property path
    let propertyPath = path;
    
    // Handle the special format from graph nodes: "{Root}.property[0].subproperty"
    if (path.startsWith('{Root}')) {
      propertyPath = path.replace('{Root}', '');
      if (propertyPath.startsWith('.')) {
        propertyPath = propertyPath.substring(1);
      }
    }
    
    // Handle root array format: "Root[0].property"
    if (path.startsWith('Root[')) {
      // Extract array index and rest of path
      const match = path.match(/^Root\[(\d+)\](.*)$/);
      if (match) {
        const [, index, remainingPath] = match;
        if (Array.isArray(clonedJson)) {
          if (remainingPath && remainingPath.startsWith('.')) {
            // Update nested property in array element
            const nestedPath = remainingPath.substring(1);
            const segments = parsePathSegments(nestedPath);
            updateAtPath(clonedJson[parseInt(index)], segments, newValue);
          } else {
            // Update array element directly
            clonedJson[parseInt(index)] = newValue;
          }
          return clonedJson;
        }
      }
    }
    
    if (!propertyPath) {
      // If no path, replace the entire object
      return newValue;
    }
    
    // Parse the path into segments
    const segments = parsePathSegments(propertyPath);
    updateAtPath(clonedJson, segments, newValue);
    
    return clonedJson;
  } catch (error) {
    console.error('Error updating JSON value at path:', path, error);
    throw error;
  }
};

/**
 * Parse a property path into segments handling arrays and objects
 */
const parsePathSegments = (path: string): Array<string | number> => {
  const segments: Array<string | number> = [];
  let currentSegment = '';
  let inBrackets = false;
  
  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    
    if (char === '[' && !inBrackets) {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = '';
      }
      inBrackets = true;
    } else if (char === ']' && inBrackets) {
      if (currentSegment) {
        segments.push(parseInt(currentSegment));
        currentSegment = '';
      }
      inBrackets = false;
    } else if (char === '.' && !inBrackets) {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = '';
      }
    } else {
      currentSegment += char;
    }
  }
  
  if (currentSegment) {
    if (inBrackets) {
      segments.push(parseInt(currentSegment));
    } else {
      segments.push(currentSegment);
    }
  }
  
  return segments;
};

/**
 * Update a value at the specified path segments
 */
const updateAtPath = (obj: any, segments: Array<string | number>, newValue: any): void => {
  let current = obj;
  
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    current = current[segment];
    
    if (current === undefined || current === null) {
      throw new Error(`Cannot access property '${segment}' on ${current}`);
    }
  }
  
  const finalSegment = segments[segments.length - 1];
  current[finalSegment] = newValue;
};

/**
 * Get a value from a JSON object using JSONPath syntax
 * @param json - The JSON object to query
 * @param path - JSONPath expression for the location to get
 * @returns The value at the specified path
 */
export const getJsonValueAtPath = (json: object, path: string): any => {
  try {
    // Convert the graph path format to property path
    let propertyPath = path;
    
    // Handle the special format from graph nodes: "{Root}.property[0].subproperty"
    if (path.startsWith('{Root}')) {
      propertyPath = path.replace('{Root}', '');
      if (propertyPath.startsWith('.')) {
        propertyPath = propertyPath.substring(1);
      }
    }
    
    // Handle root array format: "Root[0].property"
    if (path.startsWith('Root[')) {
      // Extract array index and rest of path
      const match = path.match(/^Root\[(\d+)\](.*)$/);
      if (match) {
        const [, index, remainingPath] = match;
        if (Array.isArray(json)) {
          if (remainingPath && remainingPath.startsWith('.')) {
            // Get nested property from array element
            const nestedPath = remainingPath.substring(1);
            const segments = parsePathSegments(nestedPath);
            return getAtPath(json[parseInt(index)], segments);
          } else {
            // Get array element directly
            return json[parseInt(index)];
          }
        }
      }
    }
    
    if (!propertyPath) {
      // If no path, return the entire object
      return json;
    }
    
    // Parse the path into segments
    const segments = parsePathSegments(propertyPath);
    return getAtPath(json, segments);
  } catch (error) {
    console.error('Error getting JSON value at path:', path, error);
    return undefined;
  }
};

/**
 * Get a value at the specified path segments
 */
const getAtPath = (obj: any, segments: Array<string | number>): any => {
  let current = obj;
  
  for (const segment of segments) {
    current = current[segment];
    if (current === undefined || current === null) {
      return undefined;
    }
  }
  
  return current;
};

/**
 * Parse a value from string to appropriate JavaScript type
 * @param value - String value to parse
 * @returns Parsed value with appropriate type
 */
export const parseValueFromString = (value: string): any => {
  if (value === '') return '';
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Try to parse as number
  const numValue = Number(value);
  if (!isNaN(numValue) && isFinite(numValue)) {
    return numValue;
  }
  
  // Try to parse as JSON (for objects/arrays)
  try {
    return JSON.parse(value);
  } catch {
    // Return as string if all else fails
    return value;
  }
};
