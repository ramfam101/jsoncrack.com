export interface ParsedPath {
  parts: Array<{ type: "property" | "index"; value: string | number }>;
  isValid: boolean;
}

export function parseJsonPath(path: string | undefined | null): ParsedPath {
  if (typeof path !== "string" || path.trim() === "") {
    return { parts: [], isValid: false };
  }

  // Remove "{Root}." or "Root." prefix (optional trailing dot after Root)
  const cleanPath = path.replace(/^(\{Root\}|Root)\.?/, "");

  if (cleanPath === "") return { parts: [], isValid: true };

  const tokens = cleanPath.match(/(\w+)|\[(\d+)\]/g);
  if (!tokens) return { parts: [], isValid: false };

  const parts: ParsedPath["parts"] = tokens.map((t) =>
    t.startsWith("[")
      ? { type: "index", value: parseInt(t.slice(1, -1), 10) }
      : { type: "property", value: t }
  );

  return { parts, isValid: true };
}

/* --------------------------------------------------------------
 * updateJsonAtPath
 * -------------------------------------------------------------- */
export function updateJsonAtPath(
  obj: any,
  path: string,
  newVal: any
): boolean {
  const { parts, isValid } = parseJsonPath(path);
  if (!isValid) return false;

  /* ----- "{Root}" → replace whole document ------------------- */
  if (parts.length === 0) {
    if (newVal && typeof newVal === "object") {
      Object.keys(obj).forEach((k) => delete obj[k]);
      Object.assign(obj, newVal);
      return true;
    }
    return false; // refuse to overwrite root with a primitive
  }

  /* ----- walk down to parent of target ----------------------- */
  let cur: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];

    if (part.type === "property") {
      cur = cur?.[part.value as string];
    } else if (Array.isArray(cur)) {
      cur = cur[part.value as number];
    } else {
      return false;
    }
    if (cur === undefined) return false;
  }

  /* ----- update final segment -------------------------------- */
  const last = parts[parts.length - 1];

  if (last.type === "property") {
    if (cur && typeof cur === "object") {
      cur[last.value as string] = newVal;
      return true;
    }
  } else {
    // last.type === "index"
    const idx = last.value as number;
    if (Array.isArray(cur) && idx < cur.length) {
      cur[idx] = newVal;
      return true;
    }
  }
  return false;
}

/* --------------------------------------------------------------
 * getJsonAtPath  (optional helper)
 * -------------------------------------------------------------- */
export function getJsonAtPath(obj: any, path: string): any {
  const { parts, isValid } = parseJsonPath(path);
  if (!isValid) return undefined;

  let cur = obj;
  for (const part of parts) {
    if (part.type === "property") {
      cur = cur?.[part.value as string];
    } else if (Array.isArray(cur)) {
      cur = cur[part.value as number];
    } else {
      return undefined;
    }
  }
  return cur;
}
