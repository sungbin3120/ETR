import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = process.cwd();
const sourcePath = path.join(root, "lib", "number-reader.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
});

const exportsObject = {};
const sandbox = {
  exports: exportsObject,
  module: { exports: exportsObject },
  require,
  Intl,
  console
};

vm.runInNewContext(outputText, sandbox, { filename: sourcePath });

const {
  expressionToWords,
  formatExpressionInput,
  formatExpressionResult,
  numberToWords,
  safeEvaluate
} = sandbox.module.exports;

const numberCases = [
  [0, "ko", "영"],
  [0, "en", "zero"],
  [0, "ja", "零"],
  [25, "ko", "이십 오"],
  [25, "en", "twenty-five"],
  [25, "ja", "二十五"],
  [2000000, "ko", "이백만"],
  [2000000, "en", "two million"],
  [2000000, "ja", "二百万"],
  [24, "ko", "이십 사"],
  [24, "en", "twenty-four"],
  [24, "ja", "二十四"],
  [-12, "ko", "마이너스 십 이"],
  [-12, "en", "minus twelve"],
  [-12, "ja", "マイナス十二"],
  [3.14, "ko", "삼 점 일 사"],
  [3.14, "en", "three point one four"],
  [3.14, "ja", "三点一四"]
];

for (const [value, language, expected] of numberCases) {
  assert.equal(numberToWords(value, language), expected, `${language} ${value}`);
}

const evaluated = safeEvaluate("5×5", {
  impossible: "Unable to calculate.",
  unsupported: "Unsupported expression."
});
assert.equal(evaluated, 25);
assert.equal(formatExpressionResult(evaluated), "25");

assert.equal(formatExpressionInput("557154246248"), "557,154,246,248");
assert.equal(expressionToWords("5×5", "ko", "", ""), "오 곱하기 오");
assert.equal(expressionToWords("5×5", "en", "", ""), "five times five");
assert.equal(expressionToWords("5×5", "ja", "", ""), "五 掛ける 五");

assert.throws(
  () =>
    safeEvaluate("alert(1)", {
      impossible: "Unable to calculate.",
      unsupported: "Unsupported expression."
    }),
  /Unsupported expression/
);

console.log(`Quality checks passed: ${numberCases.length + 6} cases`);
