export type ParsedLabStatus = "low" | "normal" | "high" | "unknown";

export type ParsedLabResult = {
  key: string;
  name: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  status: ParsedLabStatus;
  confidence: number;
  sourceLine: string;
  rawValue: number;
  rawUnit: string;
  converted: boolean;
};

export type ParsedMedicalDocument = {
  detectedDate: string | null;
  results: ParsedLabResult[];
};

type Definition = {
  key: string;
  name: string;
  unit: string;
  aliases: RegExp[];
  unitAliases: RegExp[];
  convert?: (value: number, unit: string) => number;
};

const numberPattern = /[-+]?\d+(?:[.,]\d+)?/g;
const rangePattern = /([-+]?\d+(?:[.,]\d+)?)\s*(?:-|–|—|đến|to)\s*([-+]?\d+(?:[.,]\d+)?)/i;

function decimal(value: string) {
  return Number(value.replace(",", "."));
}

function round(value: number) {
  if (Math.abs(value) >= 100) return Math.round(value * 10) / 10;
  if (Math.abs(value) >= 10) return Math.round(value * 100) / 100;
  return Math.round(value * 1000) / 1000;
}

function normalizedUnit(value: string) {
  return value
    .replace(/[μu]mol/gi, "µmol")
    .replace(/mmol\s*[/\\]\s*l/gi, "mmol/L")
    .replace(/mg\s*[/\\]\s*dl/gi, "mg/dL")
    .replace(/g\s*[/\\]\s*dl/gi, "g/dL")
    .replace(/g\s*[/\\]\s*l/gi, "g/L")
    .replace(/[x×]\s*10\s*\^?\s*9\s*[/\\]\s*l/gi, "10^9/L")
    .replace(/[x×]\s*10\s*\^?\s*12\s*[/\\]\s*l/gi, "10^12/L")
    .replace(/10\s*\^\s*9\s*[/\\]\s*l/gi, "10^9/L")
    .replace(/10\s*\^\s*12\s*[/\\]\s*l/gi, "10^12/L")
    .replace(/u\s*[/\\]\s*l/gi, "U/L")
    .replace(/\s+/g, "")
    .trim();
}

function chemistryConverter(factor: number, alternate: RegExp) {
  return (value: number, unit: string) =>
    alternate.test(unit) ? value * factor : value;
}

const definitions: Definition[] = [
  {
    key: "hba1c", name: "HbA1c", unit: "%",
    aliases: [/\bhba\s*1c\b/i, /hemoglobin\s*a\s*1c/i, /glycated\s*h(?:a)?emoglobin/i],
    unitAliases: [/%/, /mmol\s*[/\\]\s*mol/i],
  },
  {
    key: "glucose", name: "Glucose", unit: "mmol/L",
    aliases: [/\bglucose\b/i, /\bglu\b/i, /đường\s*(?:huyết|máu)/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 18.0182, /mg\/dL/i),
  },
  {
    key: "creatinine", name: "Creatinine", unit: "µmol/L",
    aliases: [/\bcreatinin(?:e)?\b/i, /\bcrea\b/i],
    unitAliases: [/[μuµ]mol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(88.4, /mg\/dL/i),
  },
  {
    key: "ast", name: "AST", unit: "U/L",
    aliases: [/\bast\b/i, /\bgot\b/i, /aspartate\s*aminotransferase/i],
    unitAliases: [/[ui]\s*[/\\]\s*l/i],
  },
  {
    key: "alt", name: "ALT", unit: "U/L",
    aliases: [/\balt\b/i, /\bgpt\b/i, /alanine\s*aminotransferase/i],
    unitAliases: [/[ui]\s*[/\\]\s*l/i],
  },
  {
    key: "cholesterol", name: "Cholesterol", unit: "mmol/L",
    aliases: [/total\s*cholesterol/i, /cholesterol\s*(?:tp|toàn\s*phần)/i, /\bcholesterol\b/i, /\bchol\b/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 38.67, /mg\/dL/i),
  },
  {
    key: "ldl", name: "LDL-C", unit: "mmol/L",
    aliases: [/\bldl(?:\s*[- ]?c)?\b/i, /low\s*density\s*lipoprotein/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 38.67, /mg\/dL/i),
  },
  {
    key: "hdl", name: "HDL-C", unit: "mmol/L",
    aliases: [/\bhdl(?:\s*[- ]?c)?\b/i, /high\s*density\s*lipoprotein/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 38.67, /mg\/dL/i),
  },
  {
    key: "triglyceride", name: "Triglyceride", unit: "mmol/L",
    aliases: [/\btriglycerides?\b/i, /\btriglycerid\b/i, /\btg\b/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 88.57, /mg\/dL/i),
  },
  {
    key: "wbc", name: "WBC", unit: "10^9/L",
    aliases: [/\bwbc\b/i, /white\s*blood\s*cell/i, /bạch\s*cầu/i],
    unitAliases: [/[x×]?\s*10\s*\^?\s*9\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "rbc", name: "RBC", unit: "10^12/L",
    aliases: [/\brbc\b/i, /red\s*blood\s*cell/i, /hồng\s*cầu/i],
    unitAliases: [/[x×]?\s*10\s*\^?\s*12\s*[/\\]\s*l/i, /t\s*[/\\]\s*l/i],
  },
  {
    key: "hgb", name: "Hemoglobin", unit: "g/L",
    aliases: [/\bhgb\b/i, /\bhb\b/i, /h(?:a)?emoglobin/i, /huyết\s*sắc\s*tố/i],
    unitAliases: [/g\s*[/\\]\s*l/i, /g\s*[/\\]\s*dl/i],
    convert: chemistryConverter(10, /g\/dL/i),
  },
  {
    key: "hct", name: "Hematocrit", unit: "%",
    aliases: [/\bhct\b/i, /h(?:a)?ematocrit/i, /dung\s*tích\s*hồng\s*cầu/i],
    unitAliases: [/%/, /l\s*[/\\]\s*l/i],
    convert: (value, unit) => /L\/L/i.test(unit) && value <= 1 ? value * 100 : value,
  },
  {
    key: "plt", name: "Platelet", unit: "10^9/L",
    aliases: [/\bplt\b/i, /platelets?/i, /tiểu\s*cầu/i],
    unitAliases: [/[x×]?\s*10\s*\^?\s*9\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  { key: "mcv", name: "MCV", unit: "fL", aliases: [/\bmcv\b/i], unitAliases: [/\bfl\b/i] },
  { key: "mchc", name: "MCHC", unit: "g/L", aliases: [/\bmchc\b/i], unitAliases: [/g\s*[/\\]\s*l/i, /g\s*[/\\]\s*dl/i], convert: chemistryConverter(10, /g\/dL/i) },
  { key: "mch", name: "MCH", unit: "pg", aliases: [/\bmch\b/i], unitAliases: [/\bpg\b/i] },
];

function findDate(text: string) {
  const patterns = [
    /\b(20\d{2})[./-](0?[1-9]|1[0-2])[./-]([0-2]?\d|3[01])\b/,
    /\b([0-2]?\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2}|\d{2})\b/,
  ];
  for (let index = 0; index < patterns.length; index += 1) {
    const match = text.match(patterns[index]);
    if (!match) continue;
    const year = index === 0 ? Number(match[1]) : Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const month = Number(match[2]);
    const day = index === 0 ? Number(match[3]) : Number(match[1]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date.toISOString();
    }
  }
  return null;
}

function explicitStatus(line: string): ParsedLabStatus {
  if (/\b(?:high|cao|tăng)\b|(?:\s|\*)H(?:\s|$)/i.test(line)) return "high";
  if (/\b(?:low|thấp|giảm)\b|(?:\s|\*)L(?:\s|$)/i.test(line)) return "low";
  return "unknown";
}

function calculateStatus(value: number, min: number | null, max: number | null, line: string) {
  const stated = explicitStatus(line);
  if (stated !== "unknown") return stated;
  if (min !== null && value < min) return "low";
  if (max !== null && value > max) return "high";
  if (min !== null || max !== null) return "normal";
  return "unknown";
}

function parseLine(line: string, definition: Definition): ParsedLabResult | null {
  if (definition.key === "cholesterol" && /\b(?:ldl|hdl)\b/i.test(line)) return null;
  if (definition.key === "glucose" && /\b(?:urine|niệu)\b/i.test(line)) return null;
  const aliasMatch = definition.aliases
    .map((alias) => line.match(alias))
    .find((match): match is RegExpMatchArray => Boolean(match));
  if (!aliasMatch || aliasMatch.index === undefined) return null;
  const tail = line.slice(aliasMatch.index + aliasMatch[0].length);
  const values = [...tail.matchAll(numberPattern)];
  if (!values.length) return null;
  const rawValue = decimal(values[0][0]);
  if (!Number.isFinite(rawValue)) return null;

  const unitMatch = definition.unitAliases
    .map((pattern) => line.match(pattern))
    .find((match): match is RegExpMatchArray => Boolean(match));
  const rawUnit = unitMatch?.[0] ? normalizedUnit(unitMatch[0]) : definition.unit;
  const convert = (input: number) => round(definition.convert?.(input, rawUnit) ?? input);
  const rangeSearch = tail.slice((values[0].index ?? 0) + values[0][0].length);
  const range = rangeSearch.match(rangePattern);
  let referenceMin = range ? convert(decimal(range[1])) : null;
  let referenceMax = range ? convert(decimal(range[2])) : null;
  const upper = rangeSearch.match(/(?:<|≤)\s*([-+]?\d+(?:[.,]\d+)?)/);
  const lower = rangeSearch.match(/(?:>|≥)\s*([-+]?\d+(?:[.,]\d+)?)/);
  if (!range && upper) referenceMax = convert(decimal(upper[1]));
  if (!range && lower) referenceMin = convert(decimal(lower[1]));
  const value = convert(rawValue);
  const converted = value !== round(rawValue) || normalizedUnit(rawUnit).toLowerCase() !== definition.unit.toLowerCase();
  const confidence = Math.min(0.99, 0.68 + (unitMatch ? 0.16 : 0) + (range || upper || lower ? 0.1 : 0));

  return {
    key: definition.key,
    name: definition.name,
    value,
    unit: definition.unit,
    referenceMin,
    referenceMax,
    status: calculateStatus(value, referenceMin, referenceMax, line),
    confidence,
    sourceLine: line.trim(),
    rawValue,
    rawUnit,
    converted,
  };
}

export function parseMedicalText(text: string): ParsedMedicalDocument {
  const lines = text
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const candidates = new Map<string, ParsedLabResult>();
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    for (const definition of definitions) {
      let parsed = parseLine(line, definition);
      if (!parsed && lineIndex + 1 < lines.length && definition.aliases.some((alias) => alias.test(line))) {
        parsed = parseLine(`${line} ${lines[lineIndex + 1]}`, definition);
      }
      if (!parsed) continue;
      const current = candidates.get(parsed.key);
      if (!current || parsed.confidence > current.confidence) candidates.set(parsed.key, parsed);
    }
  }
  return {
    detectedDate: findDate(text),
    results: [...candidates.values()],
  };
}

export function labStatus(value: number, min: number | null, max: number | null): ParsedLabStatus {
  return calculateStatus(value, min, max, "");
}
