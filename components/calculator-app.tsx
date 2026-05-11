"use client";

import { useEffect, useMemo, useState } from "react";
import {
  expressionToWords,
  formatExpressionInput,
  formatExpressionResult,
  formatNumber,
  languages,
  numberToWords,
  safeEvaluate,
  type Language
} from "@/lib/number-reader";

const buttons = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", "00", ".", "+"];
const operatorButtons = new Set(["÷", "×", "-", "+"]);
const languageStorageKey = "number-reader-calculator-language";

const copy = {
  ko: {
    languageName: "한국어",
    appName: "숫자 읽기 계산기",
    expression: "계산식",
    result: "결과",
    delete: "삭제",
    reset: "초기화",
    history: "기록",
    clear: "비우기",
    emptyHistory: "계산하면 이전 결과가 저장됩니다.",
    placeholder: "계산 결과가 여기에 표시됩니다",
    unsupported: "지원하지 않는 식입니다.",
    impossible: "계산할 수 없습니다."
  },
  en: {
    languageName: "English",
    appName: "Number Reader",
    expression: "Expression",
    result: "Result",
    delete: "Delete",
    reset: "Reset",
    history: "History",
    clear: "Clear",
    emptyHistory: "Previous results will appear here.",
    placeholder: "The number reading will appear here",
    unsupported: "This expression is not supported.",
    impossible: "Unable to calculate."
  },
  ja: {
    languageName: "日本語",
    appName: "数字読み計算機",
    expression: "計算式",
    result: "結果",
    delete: "削除",
    reset: "リセット",
    history: "履歴",
    clear: "クリア",
    emptyHistory: "計算すると履歴が保存されます。",
    placeholder: "数字の読み方がここに表示されます",
    unsupported: "この式には対応していません。",
    impossible: "計算できません。"
  }
} satisfies Record<Language, Record<string, string>>;

type HistoryItem = {
  id: number;
  expression: string;
  result: number;
};

function getExpressionFontSize(value: string) {
  const length = value.length;

  if (length > 24) return "clamp(1.1rem, 4.8vw, 1.7rem)";
  if (length > 19) return "clamp(1.25rem, 5.2vw, 1.95rem)";
  if (length > 15) return "clamp(1.55rem, 6.7vw, 2.45rem)";
  if (length > 11) return "clamp(2rem, 8.8vw, 3.25rem)";
  return "clamp(2.5rem, 12vw, 4rem)";
}

function getSpokenFontSize(value: string) {
  const compactLength = value.replace(/\s/g, "").length;

  if (compactLength > 80) return "clamp(0.78rem, 2.9vw, 1rem)";
  if (compactLength > 56) return "clamp(0.86rem, 3.2vw, 1.12rem)";
  if (compactLength > 34) return "clamp(0.95rem, 3.6vw, 1.28rem)";
  if (compactLength > 22) return "clamp(1.05rem, 4vw, 1.42rem)";
  return "clamp(1.18rem, 4.6vw, 1.62rem)";
}

export function CalculatorApp() {
  const [language, setLanguage] = useState<Language>("ko");
  const [expression, setExpression] = useState("0");
  const [result, setResult] = useState<number | null>(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const t = copy[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(languageStorageKey);

    if (savedLanguage && languages.includes(savedLanguage as Language)) {
      setLanguage(savedLanguage as Language);
    }
  }, []);

  function selectLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
  }

  const spokenResult = useMemo(() => {
    if (result === null) {
      return expressionToWords(expression, language, t.placeholder, t.impossible);
    }

    return numberToWords(result, language, t.impossible);
  }, [expression, language, result, t.impossible, t.placeholder]);
  const expressionFontSize = getExpressionFontSize(expression);
  const spokenFontSize = getSpokenFontSize(spokenResult);

  function append(value: string) {
    setExpression((current) => formatExpressionInput(`${current}${value}`));
    setResult(null);
    setError("");
  }

  function calculate() {
    try {
      const nextResult = safeEvaluate(expression, {
        impossible: t.impossible,
        unsupported: t.unsupported
      });
      setResult(nextResult);
      setHistory((items) => [{ id: Date.now(), expression, result: nextResult }, ...items].slice(0, 8));
      setExpression(formatExpressionInput(formatExpressionResult(nextResult)));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.impossible);
      setResult(null);
    }
  }

  function reset() {
    setExpression("0");
    setResult(0);
    setError("");
    setHistory([]);
    setHistoryOpen(false);
  }

  function backspace() {
    setExpression((current) => formatExpressionInput(current.slice(0, -1) || "0"));
    setResult(null);
    setError("");
  }

  return (
    <main className="calculator-shell">
      <header className="app-bar">
        <h1>{t.appName}</h1>
        <div className="app-actions">
          <button
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
            aria-expanded={historyOpen}
            className={historyOpen ? "active" : ""}
          >
            {t.history}
          </button>
          <div className="language-switcher" aria-label="Language">
            {languages.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectLanguage(item)}
                className={language === item ? "active" : ""}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {historyOpen ? (
        <section className="history-panel" aria-label={t.history}>
          <div className="history-header">
            <h2>{t.history}</h2>
            {history.length > 0 ? (
              <button type="button" onClick={() => setHistory([])}>
                {t.clear}
              </button>
            ) : null}
          </div>
          {history.length > 0 ? (
            <div className="history-list">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setExpression(item.expression);
                    setResult(null);
                    setError("");
                    setHistoryOpen(false);
                  }}
                >
                  <span>{item.expression}</span>
                  <small>
                    = {formatNumber(item.result)} / {numberToWords(item.result, language, t.impossible)}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-history">{t.emptyHistory}</p>
          )}
        </section>
      ) : null}

      <section className="display" aria-label="Calculator display">
        <label htmlFor="expression">{t.expression}</label>
        <input
          id="expression"
          value={expression}
          onChange={(event) => {
            setExpression(formatExpressionInput(event.target.value));
            setResult(null);
            setError("");
          }}
          inputMode="decimal"
          aria-label={t.expression}
          style={{ fontSize: expressionFontSize }}
        />
        <div className="display-divider" />
        <p className="numeric-result">{error ? t.result : result === null ? "0" : formatNumber(result)}</p>
        <p
          className={`spoken-result ${language === "ja" ? "break-all" : "break-keep"}`}
          style={{ fontSize: spokenFontSize }}
        >
          {spokenResult}
        </p>
        {error ? <p className="error-message">{error}</p> : null}
      </section>

      <section className="keypad" aria-label="Calculator keypad">
        {buttons.map((button) => (
          <button
            key={button}
            type="button"
            onClick={() => append(button)}
            className={operatorButtons.has(button) ? "operator-key" : ""}
          >
            {button}
          </button>
        ))}
        <button type="button" onClick={reset} aria-label={t.reset}>
          AC
        </button>
        <button type="button" onClick={backspace}>
          {t.delete}
        </button>
        <button type="button" onClick={calculate} className="result-key">
          {t.result}
        </button>
      </section>
    </main>
  );
}
