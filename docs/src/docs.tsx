import { debounce } from "@solid-primitives/scheduled";
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
    <section class="flex w-full px-6 py-8 space-x-2 h-screen">
      <textarea
        class="grow border-slate-500 border rounded p-2"
        placeholder="Moment.js code goes here"
        onKeyUp={(e) => setInput(e.currentTarget.value)}
      >
        {input()}
      </textarea>
      <textarea
        class="grow border-slate-500 border rounded p-2"
        placeholder="Temporal code will show up here"
        readonly
      >
        {output()}
      </textarea>
    </section>
  );
};

render(() => <MainSection />, document.getElementById("app")!);
