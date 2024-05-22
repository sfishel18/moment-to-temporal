import { javascript } from "@codemirror/lang-javascript";
import { debounce } from "@solid-primitives/scheduled";
// @ts-ignore
import { CodeMirror } from "@solid-codemirror/codemirror";
import { minimalSetup } from "codemirror";
import jsCodeShiftCore from "jscodeshift/src/core";
import * as prettier from "prettier";
import * as typescriptPlugin from "prettier/plugins/typescript";
import * as estreePlugin from "prettier/plugins/estree";
import { createSignal, createEffect } from "solid-js";
import { render } from "solid-js/web";
import transform from "../../src/transform";
import "./docs.css";

const j = jsCodeShiftCore.withParser("ts");
const transpile = async (source: string) => {
  if (!source) {
    return "";
  }
  const transpiled = transform({ source } as any, { j } as any, {});
  return await prettier.format(transpiled, {
    parser: "typescript",
    plugins: [typescriptPlugin, estreePlugin],
  });
};

const MainSection = () => {
  const [input, setInput] = createSignal("");
  const [output, setOutput] = createSignal("");
  const debouncedSetOutput = debounce(
    (source: string) => transpile(source).then(setOutput),
    250,
  );
  createEffect(() => debouncedSetOutput(input()));
  return (
    <>
      <section class="flex w-full px-6 py-8 space-x-2 h-screen">
        <CodeMirror
          value={input()}
          onValueChange={(val: string) => setInput(val)}
          class="flex-1 border-slate-500 border rounded p-2"
          placeholder="Moment.js code goes here"
          showLineNumbers={false}
          extensions={[minimalSetup, javascript({ typescript: true })]}
        />
        <CodeMirror
          value={output()}
          class="flex-1 border-slate-500 border rounded p-2"
          placeholder="Moment.js code goes here"
          showLineNumbers={false}
          readOnly
          extensions={[minimalSetup, javascript({ typescript: true })]}
        />
      </section>
      <a
        href={`https://github.com/sfishel18/moment-to-temporal/issues/new?template=bug-report.yml&title=%5BBug%5D%3A+&input=${encodeURIComponent(input())}&output=${encodeURIComponent(output())}`}
        target="_blank"
      >
        File a bug!
      </a>
    </>
  );
};

render(() => <MainSection />, document.getElementById("app")!);
