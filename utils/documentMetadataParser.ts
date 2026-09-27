export type ParsedDocumentMetadata = {
  documentDate: string | null;
  hospital: string | null;
  doctor: string | null;
};

type DateCandidate = {
  value: string;
  index: number;
  score: number;
};

function localDateValue(day: number, month: number, year: number) {
  const normalizedYear = year < 100 ? 2000 + year : year;
  const date = new Date(normalizedYear, month - 1, day, 12, 0, 0, 0);
  if (
    normalizedYear < 1900 ||
    normalizedYear > new Date().getFullYear() + 1 ||
    date.getFullYear() !== normalizedYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${normalizedYear}-${pad(month)}-${pad(day)}`;
}

function dateContextScore(text: string, index: number, baseScore: number) {
  const context = text.slice(Math.max(0, index - 70), index).toLowerCase();
  const birthLabel = Math.max(
    context.lastIndexOf("năm sinh"),
    context.lastIndexOf("ngày sinh"),
    context.lastIndexOf("sinh ngày"),
    context.lastIndexOf("dob"),
  );
  const documentLabel = Math.max(
    ...[
      /ngày\s*khám/g,
      /ngày\s*xét\s*nghiệm/g,
      /ngày\s*lấy\s*mẫu/g,
      /ngày\s*thực\s*hiện/g,
      /ngày\s*trả\s*kết\s*quả/g,
      /ngày\s*vào\s*viện/g,
      /ngày\s*ra\s*viện/g,
    ].map((pattern) => {
      const matches = [...context.matchAll(pattern)];
      return matches.at(-1)?.index ?? -1;
    }),
  );
  if (birthLabel > documentLabel) return -100;
  if (documentLabel >= 0) {
    return baseScore + 40;
  }
  return baseScore;
}

function detectedDocumentDate(text: string) {
  const candidates: DateCandidate[] = [];
  const vietnamesePattern =
    /ngày\s+([0-2]?\d|3[01])\s+tháng\s+(0?[1-9]|1[0-2])\s+năm\s+(20\d{2})/gi;
  for (const match of text.matchAll(vietnamesePattern)) {
    const value = localDateValue(Number(match[1]), Number(match[2]), Number(match[3]));
    if (value) candidates.push({ value, index: match.index, score: 60 });
  }

  const dayFirstPattern =
    /\b([0-2]?\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2}|\d{2})\b/g;
  for (const match of text.matchAll(dayFirstPattern)) {
    const value = localDateValue(Number(match[1]), Number(match[2]), Number(match[3]));
    if (value) {
      candidates.push({
        value,
        index: match.index,
        score: dateContextScore(text, match.index, 20),
      });
    }
  }

  const isoPattern = /\b(20\d{2})[./-](0?[1-9]|1[0-2])[./-]([0-2]?\d|3[01])\b/g;
  for (const match of text.matchAll(isoPattern)) {
    const value = localDateValue(Number(match[3]), Number(match[2]), Number(match[1]));
    if (value) {
      candidates.push({
        value,
        index: match.index,
        score: dateContextScore(text, match.index, 20),
      });
    }
  }

  return (
    candidates
      .filter((candidate) => candidate.score >= 0)
      .sort((left, right) => right.score - left.score || right.index - left.index)[0]
      ?.value ?? null
  );
}

function cleanMetadataValue(value: string) {
  return value
    .replace(/^[\s:;,.-]+|[\s:;,.-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const metadataBoundary =
  /\s+(?:địa\s*chỉ|đ\/c|hotline|điện\s*thoại|phiếu|họ\s+và\s+tên|bệnh\s*phẩm|chẩn\s*đoán|đối\s*tượng|phòng\s*khám|bệnh\s*viện|cơ\s*sở|ngày|nơi|mã|chất\s*lượng|người\s+(?:thực\s*hiện|kiểm\s*tra))\s*:?/i;

function detectedHospital(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  const labeled = flat.match(
    /(?:cơ\s*sở\s*(?:khám|y\s*tế)|nơi\s*khám)\s*:\s*(.{2,100}?)(?=\s+(?:địa\s*chỉ|hotline|điện\s*thoại|ngày|bác\s*s[ĩỹ]|chẩn\s*đoán|mã|họ\s+và\s+tên)\s*:?|$)/i,
  );
  if (labeled?.[1]) return cleanMetadataValue(labeled[1]);

  const entity = flat.match(
    /((?:bệnh\s*viện|phòng\s*khám|trung\s*tâm\s*y\s*tế|viện\s+y\s*học|medical\s*center|hospital|clinic)\s+.{2,100}?)(?=\s+(?:\d{1,4}\s*[-/]\s*\d{1,4}\b|địa\s*chỉ|đ\/c|hotline|điện\s*thoại|phiếu|họ\s+và\s+tên|bệnh\s*phẩm|chẩn\s*đoán|ngày\s+(?:khám|xét\s*nghiệm))\s*:?|$)/i,
  );
  return entity?.[1] ? cleanMetadataValue(entity[1]) : null;
}

function detectedDoctor(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  const labels = [
    /bác\s*s[ĩỹ](?:\s+(?:khám|điều\s*trị|chỉ\s*định|phụ\s*trách))?\s*[:\-]\s*/gi,
    /(?:doctor|physician|dr\.)\s*[:\-]\s*/gi,
    /\bbs\s*[:\-]\s*/gi,
  ];
  for (const pattern of labels) {
    for (const match of flat.matchAll(pattern)) {
      const tail = flat.slice(match.index + match[0].length, match.index + match[0].length + 100);
      const boundaryIndex = tail.search(metadataBoundary);
      const candidate = cleanMetadataValue(
        tail.slice(0, boundaryIndex >= 0 ? boundaryIndex : 80),
      );
      if (
        candidate.length >= 3 &&
        candidate.length <= 80 &&
        !/\d/.test(candidate) &&
        !/^(?:không|chưa|người|nơi|ngày|phòng|bệnh viện)\b/i.test(candidate)
      ) {
        return candidate;
      }
    }
  }
  return null;
}

export function parseDocumentMetadata(text: string): ParsedDocumentMetadata {
  return {
    documentDate: detectedDocumentDate(text),
    hospital: detectedHospital(text),
    doctor: detectedDoctor(text),
  };
}
