export const languages = ["ko", "en", "ja"] as const;

export type Language = (typeof languages)[number];

const koreanDigits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const koreanSmallUnits = ["", "십", "백", "천"];
const koreanLargeUnits = ["", "만", "억", "조", "경"];

const japaneseDigits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const japaneseSmallUnits = ["", "十", "百", "千"];
const japaneseLargeUnits = ["", "万", "億", "兆", "京"];

const englishOnes = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen"
];
const englishTens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const englishScales = ["", "thousand", "million", "billion", "trillion", "quadrillion"];

function splitIntegerGroups(value: string, size: number) {
  const groups: number[] = [];
  let rest = value.replace(/^0+/, "") || "0";

  while (rest.length > 0) {
    groups.push(Number(rest.slice(-size)));
    rest = rest.slice(0, -size);
  }

  return groups;
}

function readFourKorean(value: number) {
  const digits = String(value).padStart(4, "0").split("").map(Number);
  return digits
    .map((digit, index) => {
      if (digit === 0) return "";
      const unit = koreanSmallUnits[3 - index];
      const digitText = digit === 1 && unit ? "" : koreanDigits[digit];
      return `${digitText}${unit}`;
    })
    .filter(Boolean)
    .join(" ");
}

function integerToKorean(value: string) {
  if (Number(value) === 0) return "영";

  const groupTexts = splitIntegerGroups(value, 4)
    .map((group, index) => {
      if (group === 0) return "";
      const largeUnit = koreanLargeUnits[index] ?? `10^${index * 4}`;
      return `${readFourKorean(group)}${largeUnit}`;
    })
    .reverse()
    .filter(Boolean);

  const joined = groupTexts.join(" ");
  return groupTexts.length > 1 && joined.length > 24
    ? `${groupTexts.slice(0, -1).join(" ")}\n${groupTexts.at(-1)}`
    : joined;
}

function readUnderThousandEnglish(value: number): string {
  if (value < 20) return englishOnes[value];
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return ones === 0 ? englishTens[tens] : `${englishTens[tens]}-${englishOnes[ones]}`;
  }

  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  return rest === 0
    ? `${englishOnes[hundreds]} hundred`
    : `${englishOnes[hundreds]} hundred ${readUnderThousandEnglish(rest)}`;
}

function integerToEnglish(value: string) {
  if (Number(value) === 0) return "zero";

  return splitIntegerGroups(value, 3)
    .map((group, index) => {
      if (group === 0) return "";
      const scale = englishScales[index] ?? `times ten to the ${index * 3}`;
      return [readUnderThousandEnglish(group), scale].filter(Boolean).join(" ");
    })
    .reverse()
    .filter(Boolean)
    .join(" ");
}

function readFourJapanese(value: number) {
  const digits = String(value).padStart(4, "0").split("").map(Number);
  return digits
    .map((digit, index) => {
      if (digit === 0) return "";
      const unit = japaneseSmallUnits[3 - index];
      const digitText = digit === 1 && unit ? "" : japaneseDigits[digit];
      return `${digitText}${unit}`;
    })
    .filter(Boolean)
    .join("");
}

function integerToJapanese(value: string) {
  if (Number(value) === 0) return "零";

  return splitIntegerGroups(value, 4)
    .map((group, index) => {
      if (group === 0) return "";
      const largeUnit = japaneseLargeUnits[index] ?? `10^${index * 4}`;
      return `${readFourJapanese(group)}${largeUnit}`;
    })
    .reverse()
    .filter(Boolean)
    .join("");
}

export function numberToWords(value: number, language: Language, impossibleMessage = "Unable to calculate.") {
  if (!Number.isFinite(value)) return impossibleMessage;

  const absolute = Math.abs(value);
  const fixed = Number.isInteger(absolute) ? String(absolute) : absolute.toFixed(8).replace(/0+$/, "");
  const [integerPart, decimalPart] = fixed.split(".");

  const integerText = {
    ko: integerToKorean,
    en: integerToEnglish,
    ja: integerToJapanese
  }[language](integerPart);

  const sign = {
    ko: value < 0 ? "마이너스 " : "",
    en: value < 0 ? "minus " : "",
    ja: value < 0 ? "マイナス" : ""
  }[language];

  if (!decimalPart) return `${sign}${integerText}`;

  const decimalText = decimalPart
    .split("")
    .map((digit) => {
      const index = Number(digit);
      if (language === "ko") return koreanDigits[index] || "영";
      if (language === "en") return englishOnes[index];
      return japaneseDigits[index] || "零";
    })
    .join(language === "ja" ? "" : " ");

  const point = {
    ko: " 점 ",
    en: " point ",
    ja: "点"
  }[language];

  return `${sign}${integerText}${point}${decimalText}`;
}

function numericTokenToWords(token: string, language: Language, impossibleMessage: string) {
  const cleaned = token.replace(/,/g, "");
  if (!cleaned || cleaned === ".") return "";

  const numericValue = Number(cleaned);
  return Number.isFinite(numericValue) ? numberToWords(numericValue, language, impossibleMessage) : token;
}

export function expressionToWords(
  value: string,
  language: Language,
  placeholder: string,
  impossibleMessage = "Unable to calculate."
) {
  if (!value.trim()) return placeholder;

  const operators = {
    ko: { "+": " 더하기 ", "-": " 빼기 ", "×": " 곱하기 ", "÷": " 나누기 " },
    en: { "+": " plus ", "-": " minus ", "×": " times ", "÷": " divided by " },
    ja: { "+": " 足す ", "-": " 引く ", "×": " 掛ける ", "÷": " 割る " }
  }[language];

  return value
    .replace(/\d[\d,]*(?:\.\d*)?|\.\d+|[+\-×÷]/g, (token) => {
      if (token in operators) return operators[token as keyof typeof operators];
      return numericTokenToWords(token, language, impossibleMessage);
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "오류";
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 8
  }).format(value);
}

export function formatExpressionResult(value: number) {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function formatNumberToken(token: string) {
  if (!token || token === ".") return token;

  const [integerPart, decimalPart] = token.split(".");
  const formattedInteger = integerPart
    ? new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Number(integerPart))
    : "0";

  return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
}

export function formatExpressionInput(value: string) {
  return value
    .replace(/,/g, "")
    .replace(/[^\d+\-×÷.()\s]/g, "")
    .replace(/\d+(?:\.\d*)?|\.\d+/g, (token) => formatNumberToken(token));
}

export function safeEvaluate(expression: string, messages: { unsupported: string; impossible: string }) {
  const normalized = expression.replace(/,/g, "").replace(/×/g, "*").replace(/÷/g, "/");

  if (!/^[\d+\-*/.()\s]+$/.test(normalized)) {
    throw new Error(messages.unsupported);
  }

  const result = Function(`"use strict"; return (${normalized})`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error(messages.impossible);
  }

  return result;
}
