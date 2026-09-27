export type ParsedLabStatus = "low" | "normal" | "high" | "unknown";

export type ParsedLabResult = {
  key: string;
  name: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  referenceText: string | null;
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
const containsNumberPattern = /[-+]?\d+(?:[.,]\d+)?/;
const rangePattern =
  /([-+]?\d+(?:[.,]\d+)?)\s*(?:-|–|—|đến|to)\s*([-+]?\d+(?:[.,]\d+)?)/i;

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
    .replace(/10\s*⁹\s*[/\\]\s*l/gi, "10^9/L")
    .replace(/10\s*¹²\s*[/\\]\s*l/gi, "10^12/L")
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
    key: "hba1c",
    name: "HbA1c",
    unit: "%",
    aliases: [
      /\bhba\s*1c\b/i,
      /hemoglobin\s*a\s*1c/i,
      /glycated\s*h(?:a)?emoglobin/i,
    ],
    unitAliases: [/%/, /mmol\s*[/\\]\s*mol/i],
  },
  {
    key: "glucose",
    name: "Glucose",
    unit: "mmol/L",
    aliases: [/\bglucose\b/i, /\bglu\b/i, /đường\s*(?:huyết|máu)/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 18.0182, /mg\/dL/i),
  },
  {
    key: "creatinine",
    name: "Creatinine",
    unit: "µmol/L",
    aliases: [/\bcreatinin(?:e)?\b/i, /\bcrea\b/i],
    unitAliases: [/[μuµ]mol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(88.4, /mg\/dL/i),
  },
  {
    key: "egfr",
    name: "eGFR",
    unit: "mL/phút/1.73 m²",
    aliases: [/\begfr\b(?:\s*\(\s*ckd[- ]?epi\s*\d{4}\s*\))?/i, /glomerular\s*filtration/i],
    unitAliases: [/mL?\s*[/\\]\s*(?:ph(?:ú|u)t|min)(?:[/\\]1\.73\s*m2?)?/i],
  },
  {
    key: "uric_acid",
    name: "Uric acid",
    unit: "µmol/L",
    aliases: [/uric\s*acid/i, /acid\s*uric/i, /uric/i, /a\.uric/i],
    unitAliases: [/[μuµ]mol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(59.48, /mg\/dL/i),
  },
  {
    key: "ast",
    name: "AST",
    unit: "U/L",
    aliases: [/\bast\b/i, /\bgot\b/i, /aspartate\s*aminotransferase/i],
    unitAliases: [/[ui]\s*[/\\]\s*l/i],
  },
  {
    key: "alt",
    name: "ALT",
    unit: "U/L",
    aliases: [/\balt\b/i, /\bgpt\b/i, /alanine\s*aminotransferase/i],
    unitAliases: [/[ui]\s*[/\\]\s*l/i],
  },
  {
    key: "ggt",
    name: "GGT",
    unit: "U/L",
    aliases: [/\bggt\b/i, /gamma[-\s]*gt/i, /gamma[-\s]*glutamyl/i],
    unitAliases: [/[ui]\s*[/\\]\s*l/i],
  },
  {
    key: "cholesterol",
    name: "Cholesterol",
    unit: "mmol/L",
    aliases: [
      /total\s*cholesterol/i,
      /cholesterol\s*(?:tp|toàn\s*phần)/i,
      /\bcholesterol\b/i,
      /\bchol\b/i,
    ],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 38.67, /mg\/dL/i),
  },
  {
    key: "non_hdl",
    name: "Non-HDL Cholesterol",
    unit: "mmol/L",
    aliases: [/non\s*[- ]?hdl(?:\s*cholesterol)?/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 38.67, /mg\/dL/i),
  },
  {
    key: "ldl",
    name: "LDL-C",
    unit: "mmol/L",
    aliases: [/\bldl(?:\s*[- ]?c)?\b/i, /low\s*density\s*lipoprotein/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 38.67, /mg\/dL/i),
  },
  {
    key: "hdl",
    name: "HDL-C",
    unit: "mmol/L",
    aliases: [/\bhdl(?:\s*[- ]?c)?\b/i, /high\s*density\s*lipoprotein/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 38.67, /mg\/dL/i),
  },
  {
    key: "triglyceride",
    name: "Triglyceride",
    unit: "mmol/L",
    aliases: [/\btriglycerides?\b/i, /\btriglycerid\b/i, /\btg\b/i],
    unitAliases: [/mmol\s*[/\\]\s*l/i, /mg\s*[/\\]\s*dl/i],
    convert: chemistryConverter(1 / 88.57, /mg\/dL/i),
  },
  {
    key: "wbc",
    name: "WBC",
    unit: "10^9/L",
    aliases: [/\bwbc\b/i, /white\s*blood\s*cell/i, /bạch\s*cầu/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "rbc",
    name: "RBC",
    unit: "10^12/L",
    aliases: [/\brbc\b/i, /red\s*blood\s*cell/i, /hồng\s*cầu/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*12|10\s*¹²)\s*[/\\]\s*l/i, /t\s*[/\\]\s*l/i],
  },
  {
    key: "hgb",
    name: "Hemoglobin",
    unit: "g/L",
    aliases: [/\bhgb\b/i, /\bhb\b/i, /h(?:a)?emoglobin/i, /huyết\s*sắc\s*tố/i],
    unitAliases: [/g\s*[/\\]\s*l/i, /g\s*[/\\]\s*dl/i],
    convert: chemistryConverter(10, /g\/dL/i),
  },
  {
    key: "hct",
    name: "Hematocrit",
    unit: "%",
    aliases: [/\bhct\b/i, /h(?:a)?ematocrit/i, /dung\s*tích\s*hồng\s*cầu/i],
    unitAliases: [/%/, /l\s*[/\\]\s*l/i],
    convert: (value, unit) =>
      value <= 1 && (/L\/L/i.test(unit) || unit === "%") ? value * 100 : value,
  },
  {
    key: "plt",
    name: "Platelet",
    unit: "10^9/L",
    aliases: [/\bplt\b/i, /platelets?/i, /tiểu\s*cầu/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "mcv",
    name: "MCV",
    unit: "fL",
    aliases: [/\bmcv\b/i],
    unitAliases: [/\bfl\b/i],
  },
  {
    key: "mchc",
    name: "MCHC",
    unit: "g/L",
    aliases: [/\bmchc\b/i],
    unitAliases: [/g\s*[/\\]\s*l/i, /g\s*[/\\]\s*dl/i],
    convert: chemistryConverter(10, /g\/dL/i),
  },
  {
    key: "mch",
    name: "MCH",
    unit: "pg",
    aliases: [/\bmch\b/i],
    unitAliases: [/\bpg\b/i],
  },
  {
    key: "neu_percent",
    name: "NEUT %",
    unit: "%",
    aliases: [/\bneut?\s*%/i, /neutrophil(?:s)?\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "neu_abs",
    name: "NEUT #",
    unit: "10^9/L",
    aliases: [/\bneut?\s*[#＃]/i, /neutrophil(?:s)?\s*[#＃]/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "lym_percent",
    name: "LYM %",
    unit: "%",
    aliases: [/\blym\s*%/i, /lymphocyte(?:s)?\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "lym_abs",
    name: "LYM #",
    unit: "10^9/L",
    aliases: [/\blym\s*#/i, /lymphocyte(?:s)?\s*#/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "mono_percent",
    name: "MONO %",
    unit: "%",
    aliases: [/\bmono\s*%/i, /monocyte(?:s)?\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "mono_abs",
    name: "MONO #",
    unit: "10^9/L",
    aliases: [/\bmono\s*#/i, /monocyte(?:s)?\s*#/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "eos_percent",
    name: "EOS %",
    unit: "%",
    aliases: [/\beos\s*%/i, /eosinophil(?:s)?\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "eos_abs",
    name: "EOS #",
    unit: "10^9/L",
    aliases: [/\beos\s*#/i, /eosinophil(?:s)?\s*#/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "baso_percent",
    name: "BASO %",
    unit: "%",
    aliases: [/\bbaso\s*%/i, /basophil(?:s)?\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "baso_abs",
    name: "BASO #",
    unit: "10^9/L",
    aliases: [/\bbaso\s*#/i, /basophil(?:s)?\s*#/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "luc_percent",
    name: "LUC %",
    unit: "%",
    aliases: [/\bluc\s*%/i, /large\s*unstained\s*cell(?:s)?\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "luc_abs",
    name: "LUC #",
    unit: "10^9/L",
    aliases: [/\bluc\s*#/i, /large\s*unstained\s*cell(?:s)?\s*#/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "ig_percent",
    name: "IG %",
    unit: "%",
    aliases: [/\big\s*%/i, /immature\s*granulocyte(?:s)?\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "ig_abs",
    name: "IG #",
    unit: "10^9/L",
    aliases: [/\big\s*#/i, /immature\s*granulocyte(?:s)?\s*#/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "chcm",
    name: "CHCM",
    unit: "g/L",
    aliases: [/\bchcm\b/i],
    unitAliases: [/g\s*[/\\]\s*l/i, /g\s*[/\\]\s*dl/i],
    convert: chemistryConverter(10, /g\/dL/i),
  },
  {
    key: "rdw",
    name: "RDW",
    unit: "%",
    aliases: [/\brdw\b/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "hdw",
    name: "HDW",
    unit: "g/L",
    aliases: [/\bhdw\b/i],
    unitAliases: [/g\s*[/\\]\s*l/i],
  },
  {
    key: "ch",
    name: "CH",
    unit: "pg",
    aliases: [/(?:^|[\s.()\-])ch(?:$|[\s.():\-])/i],
    unitAliases: [/\bpg\b/i],
  },
  {
    key: "mdw",
    name: "MDW",
    unit: "%",
    aliases: [/\bmdw\b/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "nrbc_percent",
    name: "NRBC %",
    unit: "%",
    aliases: [/\bnrbc\s*%/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "nrbc_abs",
    name: "NRBC #",
    unit: "10^9/L",
    aliases: [/\bnrbc\s*#/i],
    unitAliases: [/(?:[x×]?\s*10\s*\^?\s*9|10\s*⁹)\s*[/\\]\s*l/i, /g\s*[/\\]\s*l/i],
  },
  {
    key: "mpv",
    name: "MPV",
    unit: "fL",
    aliases: [/\bmpv\b/i],
    unitAliases: [/\bfl\b/i],
  },
  {
    key: "pdw",
    name: "PDW",
    unit: "%",
    aliases: [/\bpdw\b/i],
    unitAliases: [/%[a-z]?/i],
  },
  {
    key: "pct",
    name: "PCT",
    unit: "%",
    aliases: [/\bpct\b/i, /plateletcrit/i],
    unitAliases: [/%[a-z]*/i],
  },
  {
    key: "afp",
    name: "Alpha FP (AFP)",
    unit: "IU/mL",
    aliases: [/alpha\s*fp(?:\s*\(\s*afp\s*\))?/i, /\bafp\b/i],
    unitAliases: [/iu\s*[/\\]\s*ml/i],
  },
  {
    key: "hbv_viral_load",
    name: "HBV tải lượng",
    unit: "copies/mL",
    aliases: [/hbv[\s-]*(?:đo\s*)?(?:tải\s*lượng|viral\s*load)/i, /real[-\s]*time\s*pcr/i],
    unitAliases: [/copies?\s*[/\\]\s*ml/i],
  },
  {
    key: "hbv_log10",
    name: "HBV Log10",
    unit: "Log10",
    aliases: [/\blog\s*10\b/i, /\blog10\b/i],
    unitAliases: [/log\s*10/i],
  },
];

function findDate(text: string) {
  const vietnameseDate = text.match(
    /ngày\s+([0-2]?\d|3[01])\s+tháng\s+(0?[1-9]|1[0-2])\s+năm\s+(20\d{2})/i,
  );
  if (vietnameseDate) {
    const day = Number(vietnameseDate[1]);
    const month = Number(vietnameseDate[2]);
    const year = Number(vietnameseDate[3]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date.toISOString();
    }
  }
  const patterns = [
    /\b(20\d{2})[./-](0?[1-9]|1[0-2])[./-]([0-2]?\d|3[01])\b/,
    /\b([0-2]?\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2}|\d{2})\b/,
  ];
  for (let index = 0; index < patterns.length; index += 1) {
    const match = text.match(patterns[index]);
    if (!match) continue;
    const year =
      index === 0
        ? Number(match[1])
        : Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const month = Number(match[2]);
    const day = index === 0 ? Number(match[3]) : Number(match[1]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date.toISOString();
    }
  }
  return null;
}

function matchingDefinitions(line: string) {
  return definitions.filter((definition) =>
    definition.aliases.some((alias) => alias.test(line)),
  );
}

type DefinitionOccurrence = {
  definition: Definition;
  index: number;
  end: number;
  text: string;
};

function definitionOccurrences(text: string) {
  const byKey = new Map<string, DefinitionOccurrence>();
  for (const definition of definitions) {
    for (const alias of definition.aliases) {
      const match = text.match(alias);
      if (!match || match.index === undefined) continue;
      const occurrence = {
        definition,
        index: match.index,
        end: match.index + match[0].length,
        text: match[0],
      };
      const current = byKey.get(definition.key);
      if (
        !current ||
        occurrence.index < current.index ||
        (occurrence.index === current.index && occurrence.text.length > current.text.length)
      ) {
        byKey.set(definition.key, occurrence);
      }
    }
  }

  const ordered = [...byKey.values()].sort(
    (left, right) => left.index - right.index || right.text.length - left.text.length,
  );
  const withoutOverlaps: DefinitionOccurrence[] = [];
  for (const occurrence of ordered) {
    const previous = withoutOverlaps.at(-1);
    if (!previous || occurrence.index >= previous.end) {
      withoutOverlaps.push(occurrence);
      continue;
    }
    if (occurrence.text.length > previous.text.length) {
      withoutOverlaps[withoutOverlaps.length - 1] = occurrence;
    }
  }
  return withoutOverlaps;
}

function flattenedLabelRun(text: string) {
  const occurrences = definitionOccurrences(text);
  let best: DefinitionOccurrence[] = [];
  let current: DefinitionOccurrence[] = [];
  for (const occurrence of occurrences) {
    const previous = current.at(-1);
    if (
      !previous ||
      !containsNumberPattern.test(text.slice(previous.end, occurrence.index))
    ) {
      current.push(occurrence);
    } else {
      if (current.length > best.length) best = current;
      current = [occurrence];
    }
  }
  if (current.length > best.length) best = current;
  return best.length >= 3 ? best : [];
}

function firstUnitMatch(text: string, definition: Definition) {
  return definition.unitAliases
    .map((pattern) => text.match(pattern))
    .filter((match): match is RegExpMatchArray => Boolean(match) && match?.index !== undefined)
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))[0];
}

/** Reconstructs a table when OCR returns the entire page as one long line. */
function parseFlattenedColumnarLine(line: string) {
  const labels = flattenedLabelRun(line);
  if (!labels.length) return { keys: new Set<string>(), results: [] as ParsedLabResult[] };

  const data = line.slice(labels.at(-1)!.end);
  const numberMatches = [...data.matchAll(numberPattern)];
  if (numberMatches.length < labels.length) {
    return { keys: new Set<string>(), results: [] as ParsedLabResult[] };
  }
  const values = numberMatches.slice(0, labels.length);
  const lastValue = values.at(-1)!;
  const afterValuesIndex = (lastValue.index ?? 0) + lastValue[0].length;
  const afterValues = data.slice(afterValuesIndex);
  const ranges = [
    ...afterValues.matchAll(new RegExp(rangePattern.source, "gi")),
  ].slice(0, labels.length);
  const lastRange = ranges.at(-1);
  const unitsText = lastRange
    ? afterValues.slice((lastRange.index ?? 0) + lastRange[0].length)
    : afterValues;

  let unitCursor = 0;
  const units = labels.map(({ definition }) => {
    const match = firstUnitMatch(unitsText.slice(unitCursor), definition);
    if (!match) return null;
    unitCursor += (match.index ?? 0) + match[0].length;
    return match[0];
  });

  const results = labels.flatMap(({ definition, text }, offset) => {
    const parts = [text, values[offset][0]];
    if (ranges[offset]) parts.push(ranges[offset][0]);
    if (units[offset]) parts.push(units[offset]!);
    const result = parseLine(parts.join(" "), definition);
    return result ? [result] : [];
  });
  return {
    keys: new Set(labels.map(({ definition }) => definition.key)),
    results,
  };
}

function standaloneDefinition(line: string) {
  for (const definition of definitions) {
    for (const alias of definition.aliases) {
      const match = line.match(alias);
      if (!match || match.index === undefined) continue;
      const remainder = `${line.slice(0, match.index)}${line.slice(match.index + match[0].length)}`
        .replace(/[\s:;,.()\[\]_*\-–—]+/g, "");
      if (!remainder) return definition;
    }
  }
  return null;
}

function isReferenceCell(line: string) {
  return rangePattern.test(line) || /(?:<|≤|>|≥)\s*[-+]?\d/.test(line);
}

function isResultCell(line: string) {
  const value = line.match(containsNumberPattern);
  if (!value || value.index === undefined) return false;
  const range = line.match(rangePattern);
  return !range || range.index !== value.index;
}

function findColumnStart(
  lines: string[],
  start: number,
  count: number,
  predicate: (line: string, offset: number) => boolean,
) {
  const lastStart = Math.min(lines.length - count, start + 12);
  for (let candidate = start; candidate <= lastStart; candidate += 1) {
    let valid = true;
    for (let offset = 0; offset < count; offset += 1) {
      if (!predicate(lines[candidate + offset], offset)) {
        valid = false;
        break;
      }
    }
    if (valid) return candidate;
  }
  return -1;
}

/**
 * OCR engines often serialize a table column-by-column: all analyte names first,
 * followed by all results, ranges, then units. Rebuild those rows positionally so
 * every child analyte keeps its own value.
 */
function parseColumnarBlocks(lines: string[]) {
  const parsed: ParsedLabResult[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const labels: { definition: Definition; line: string }[] = [];
    let cursor = lineIndex;
    while (cursor < lines.length) {
      const definition = standaloneDefinition(lines[cursor]);
      if (!definition || labels.some((item) => item.definition.key === definition.key)) break;
      labels.push({ definition, line: lines[cursor] });
      cursor += 1;
    }
    if (labels.length < 2) continue;

    const valueStart = findColumnStart(
      lines,
      cursor,
      labels.length,
      (line) => isResultCell(line) && matchingDefinitions(line).length === 0,
    );
    if (valueStart < 0) continue;
    const afterValues = valueStart + labels.length;
    const rangeStart = findColumnStart(
      lines,
      afterValues,
      labels.length,
      (line) => isReferenceCell(line),
    );
    const afterRanges = rangeStart < 0 ? afterValues : rangeStart + labels.length;
    const unitStart = findColumnStart(
      lines,
      afterRanges,
      labels.length,
      (line, offset) => labels[offset].definition.unitAliases.some((pattern) => pattern.test(line)),
    );

    labels.forEach(({ definition, line }, offset) => {
      const parts = [line, lines[valueStart + offset]];
      if (rangeStart >= 0) parts.push(lines[rangeStart + offset]);
      if (unitStart >= 0) parts.push(lines[unitStart + offset]);
      const result = parseLine(parts.join(" "), definition);
      if (result) parsed.push(result);
    });
    lineIndex = cursor - 1;
  }
  return parsed;
}

function explicitStatus(line: string): ParsedLabStatus {
  if (/\b(?:high|cao|tăng)\b|(?:\s|\*)H(?:\s|$)/i.test(line)) return "high";
  if (/\b(?:low|thấp|giảm)\b|(?:\s|\*)L(?:\s|$)/i.test(line)) return "low";
  return "unknown";
}

function calculateStatus(
  value: number,
  min: number | null,
  max: number | null,
  line: string,
) {
  const stated = explicitStatus(line);
  if (stated !== "unknown") return stated;
  if (min !== null && value < min) return "low";
  if (max !== null && value > max) return "high";
  if (min !== null || max !== null) return "normal";
  return "unknown";
}

function parseLine(
  line: string,
  definition: Definition,
): ParsedLabResult | null {
  if (definition.key === "ch" && !/\bpg\b/i.test(line)) return null;
  if (definition.key === "cholesterol" && /\b(?:ldl|hdl)\b/i.test(line))
    return null;
  if (definition.key === "glucose" && /\b(?:urine|niệu)\b/i.test(line))
    return null;
  const aliasMatch = definition.aliases
    .map((alias) => line.match(alias))
    .find((match): match is RegExpMatchArray => Boolean(match));
  if (!aliasMatch || aliasMatch.index === undefined) return null;
  const tail = line.slice(aliasMatch.index + aliasMatch[0].length);
  let values = [...tail.matchAll(numberPattern)];
  if (!values.length) {
    values = [...line.slice(0, aliasMatch.index).matchAll(numberPattern)].slice(-1);
  }
  if (!values.length) return null;
  const rawValue = decimal(values[0][0]);
  if (!Number.isFinite(rawValue)) return null;
  if (definition.key === "hct" && rawValue > 100) return null;

  const unitMatch = definition.unitAliases
    .map((pattern) => line.match(pattern))
    .find((match): match is RegExpMatchArray => Boolean(match));
  const rawUnit = unitMatch?.[0]
    ? normalizedUnit(unitMatch[0])
    : definition.unit;
  const convert = (input: number) =>
    round(definition.convert?.(input, rawUnit) ?? input);
  const rangeSearch = tail.slice((values[0].index ?? 0) + values[0][0].length);
  const range = rangeSearch.match(rangePattern);
  let referenceMin = range ? convert(decimal(range[1])) : null;
  let referenceMax = range ? convert(decimal(range[2])) : null;
  const upper = rangeSearch.match(/(?:<|≤)\s*([-+]?\d+(?:[.,]\d+)?)/);
  const lower = rangeSearch.match(/(?:>|≥)\s*([-+]?\d+(?:[.,]\d+)?)/);
  if (!range && upper) referenceMax = convert(decimal(upper[1]));
  if (!range && lower) referenceMin = convert(decimal(lower[1]));
  const referenceText = range?.[0] ?? upper?.[0] ?? lower?.[0] ?? null;
  const value = convert(rawValue);
  const converted =
    value !== round(rawValue) ||
    normalizedUnit(rawUnit).toLowerCase() !== definition.unit.toLowerCase();
  const confidence = Math.min(
    0.99,
    0.68 + (unitMatch ? 0.16 : 0) + (range || upper || lower ? 0.1 : 0),
  );

  return {
    key: definition.key,
    name: definition.name,
    value,
    unit: definition.unit,
    referenceMin,
    referenceMax,
    referenceText,
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
    const flattened = parseFlattenedColumnarLine(line);
    for (const definition of definitions) {
      if (flattened.keys.has(definition.key)) continue;
      let parsed = parseLine(line, definition);
      if (!parsed && definition.aliases.some((alias) => alias.test(line))) {
        const nextLine = lines[lineIndex + 1];
        if (
          nextLine &&
          containsNumberPattern.test(nextLine) &&
          matchingDefinitions(nextLine).length === 0
        ) {
          parsed = parseLine(`${line} ${nextLine}`, definition);
        }
      }
      if (!parsed) continue;
      const current = candidates.get(parsed.key);
      if (!current || parsed.confidence > current.confidence)
        candidates.set(parsed.key, parsed);
    }
    for (const parsed of flattened.results) {
      const current = candidates.get(parsed.key);
      if (!current || parsed.confidence > current.confidence)
        candidates.set(parsed.key, parsed);
    }
  }
  for (const parsed of parseColumnarBlocks(lines)) {
    const current = candidates.get(parsed.key);
    if (!current || parsed.confidence > current.confidence)
      candidates.set(parsed.key, parsed);
  }
  return {
    detectedDate: findDate(text),
    results: [...candidates.values()],
  };
}

export function labStatus(
  value: number,
  min: number | null,
  max: number | null,
): ParsedLabStatus {
  return calculateStatus(value, min, max, "");
}
