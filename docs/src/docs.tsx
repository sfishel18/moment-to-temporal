import { javascript } from "@codemirror/lang-javascript";
import { debounce } from "@solid-primitives/scheduled";
// @ts-ignore
import { CodeMirror } from "@solid-codemirror/codemirror";
import { Router, Route, A } from "@solidjs/router";
import { minimalSetup } from "codemirror";
import jsCodeShiftCore from "jscodeshift/src/core";
import * as prettier from "prettier";
import * as typescriptPlugin from "prettier/plugins/typescript";
import * as estreePlugin from "prettier/plugins/estree";
import { createSignal, createEffect, JSX } from "solid-js";
import { render } from "solid-js/web";
import transform from "../../src/transform";
import "./docs.css";

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

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

const AppShell = (props: { children: JSX.Element }) => (
  <div
    class={`w-full h-screen flex flex-col bg-sky-800 bg-opacity-5 p-6`}
  >
    <nav class="flex items-center justify-between">
      <div class="flex items-center flex-shrink-0">
        <span class="font-semibold text-3xl tracking-tight">
          Moment &rarr; Temporal
        </span>
      </div>
      <div class="flex mr-16">
        <div class="mr-8">
          <A
            class={classNames(
              "font-semibold p-1",
              `focus:outline-none focus:text-sky-800 focus:ring-1 focus:ring-sky-800 focus:ring-offset-2 focus:rounded`,
              `hover:text-sky-800`,
            )}
            href="/explorer"
          >
            Explorer
          </A>
        </div>
        <div>
          <A
            class={classNames(
              "font-semibold p-1",
              `focus:outline-none focus:text-sky-800 focus:ring-1 focus:ring-sky-800 focus:ring-offset-2 focus:rounded`,
              `hover:text-sky-800`,
            )}
            href="/docs"
          >
            Docs
          </A>
        </div>
      </div>
    </nav>
    {props.children}
  </div>
);

const Explorer = () => {
  const [input, setInput] = createSignal("");
  const [output, setOutput] = createSignal("");
  const debouncedSetOutput = debounce(
    (source: string) => transpile(source).then(setOutput),
    250,
  );
  createEffect(() => debouncedSetOutput(input()));
  return (
    <AppShell>
      <div class="flex flex-col w-full h-full">
        <div class="flex w-full h-full py-8 space-x-2">
          <CodeMirror
            value={input()}
            onValueChange={(val: string) => setInput(val)}
            class={`flex-1 border-sky-800 border rounded p-2 bg-white`}
            placeholder="Moment.js code goes here"
            showLineNumbers={false}
            extensions={[minimalSetup, javascript({ typescript: true })]}
          />
          <CodeMirror
            value={output()}
            class={`flex-1 border-sky-800 border rounded p-2 bg-white`}
            placeholder="Moment.js code goes here"
            showLineNumbers={false}
            readOnly
            extensions={[minimalSetup, javascript({ typescript: true })]}
          />
        </div>
        <div class="flex justify-center">
          <a
            class={classNames(
              `py-1 px-2 ring-1 rounded ring-sky-800`,
              `focus:outline-none focus:ring-2 focus:text-sky-800`,
              `hover:text-sky-800 hover:ring-2`,
            )}
            href={`https://github.com/sfishel18/moment-to-temporal/issues/new?template=bug-report.yml&title=%5BBug%5D%3A+&input=${encodeURIComponent(input())}&output=${encodeURIComponent(output())}`}
            target="_blank"
          >
            File a bug!
          </a>
        </div>
      </div>
    </AppShell>
  );
};

const Docs = () => (
  <AppShell>
    <div class="w-full h-full py-8">
      <h1>Docs go here...</h1>
    </div>
  </AppShell>
);

const MainSection = () => {
  return (
    <Router>
      <Route path="/docs" component={Docs} />
      <Route path="*" component={Explorer} />
    </Router>
  );
};

render(() => <MainSection />, document.getElementById("app")!);
