import type { ParseError } from "jsonc-parser";
// Import Zustand store
import debounce from "lodash.debounce";
import * as XLSX from "xlsx";
import { FileFormat } from "../../enums/file.enum";
// Import FileFormat enum
import useFile from "../../store/useFile";

// Import debounce if not already imported

// Import XLSX library

const debouncedUpdateJson = debounce((json: object) => {
  // Define debouncedUpdateJson if not already defined
  // @ts-ignore
  useFile.setState({ json });
}, 300);

export const contentToJson = (value: string, format = FileFormat.JSON): Promise<object> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!value) return resolve({});

      if (format === FileFormat.JSON) {
        const { parse } = await import("jsonc-parser");
        const errors: ParseError[] = [];
        const result = parse(value, errors);
        if (errors.length > 0) JSON.parse(value);
        return resolve(result);
      }

      if (format === FileFormat.YAML) {
        const { load } = await import("js-yaml");
        return resolve(load(value) as object);
      }

      if (format === FileFormat.XML) {
        const { XMLParser } = await import("fast-xml-parser");
        const parser = new XMLParser({
          attributeNamePrefix: "$",
          ignoreAttributes: false,
          allowBooleanAttributes: true,
          parseAttributeValue: true,
          trimValues: true,
          parseTagValue: true,
        });
        return resolve(parser.parse(value));
      }

      if (format === FileFormat.CSV) {
        const { csv2json } = await import("json-2-csv");
        const result = csv2json(value, {
          trimFieldValues: true,
          trimHeaderFields: true,
          wrapBooleans: true,
          excelBOM: true,
        });
        return resolve(result);
      }

      if (format === FileFormat.XLSX) {
        const workbook = XLSX.read(value, { type: "binary" });
        const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        const { csv2json } = await import("json-2-csv");
        const result = await csv2json(csvData, {
          trimFieldValues: true,
          trimHeaderFields: true,
          wrapBooleans: true,
          excelBOM: true,
        });
        return resolve(result);
      }

      return resolve({});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to parse content";
      return reject(errorMessage);
    }
  });
};

export const jsonToContent = async (json: string, format: FileFormat): Promise<string> => {
  return new Promise(async resolve => {
    try {
      if (!json) return resolve("");

      if (format === FileFormat.JSON) {
        const parsedJson = JSON.parse(json);
        return resolve(JSON.stringify(parsedJson, null, 2));
      }

      if (format === FileFormat.YAML) {
        const { dump } = await import("js-yaml");
        const { parse } = await import("jsonc-parser");
        return resolve(dump(parse(json)));
      }

      if (format === FileFormat.XML) {
        const { XMLBuilder } = await import("fast-xml-parser");
        const builder = new XMLBuilder({
          format: true,
          attributeNamePrefix: "$",
          ignoreAttributes: false,
        });

        return resolve(builder.build(JSON.parse(json)));
      }

      if (format === FileFormat.CSV) {
        const { json2csv } = await import("json-2-csv");
        const parsedJson = JSON.parse(json);

        const data = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
        return resolve(
          json2csv(data, {
            expandArrayObjects: true,
            expandNestedObjects: true,
            excelBOM: true,
            wrapBooleans: true,
            trimFieldValues: true,
            trimHeaderFields: true,
          })
        );
      }

      return resolve(json);
    } catch (error) {
      console.error(json, error);
      return resolve(json);
    }
  });
};

export const fetchUrl = async (url: string) => {
  try {
    const res = await fetch(url);
    const format = useFile.getState().format; // Use Zustand store getter

    let content;
    if (format === FileFormat.XLSX) {
      const arrayBuffer = await res.arrayBuffer();
      const binaryString = new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      );
      content = binaryString;
    } else {
      content = await res.text();
    }

    const json = await contentToJson(content, format);
    useFile.setState({ contents: content, format, hasChanges: true }); // Use Zustand store setter
    debouncedUpdateJson(json);
  } catch (error) {
    if (error instanceof Error) {
      useFile.setState({ error: error.message }); // Use Zustand store setter for error
    } else {
      useFile.setState({ error: "An unknown error occurred" }); // Handle unknown error type
    }
  }
};
