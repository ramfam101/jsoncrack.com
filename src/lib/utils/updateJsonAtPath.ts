// Utility to update a value at a given path in a JSON object
// path: string, e.g. "fruit.name" or "car.model"
// value: any
export function updateJsonAtPath(obj: any, path: string, value: any) {
  if (!path) return obj;
  const keys = path.split(".");
  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in curr)) return obj; // path invalid
    curr = curr[keys[i]];
  }
  curr[keys[keys.length - 1]] = value;
  return obj;
}
