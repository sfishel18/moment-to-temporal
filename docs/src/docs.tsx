import { javascript } from "@codemirror/lang-javascript";
import { debounce } from "@solid-primitives/scheduled";
// @ts-ignore
import { CodeMirror } from "@solid-codemirror/codemirror";
import { minimalSetup } from "codemirror";
import jsCodeShiftCore from "jscodeshift/src/core";
import * as prettier from "prettier";
import * as typescriptPlugin from "prettier/plugins/typescript";
import * as estreePlugin from "prettier/plugins/estree";
import { createSignal, createEffect, JSX, onMount, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import transform from "../../src/transform";
// @ts-ignore
import icon from "../assets/icon.png";
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
  <div class={`w-full h-screen flex flex-col bg-sky-900 bg-opacity-5 p-6`}>
    <nav class="flex items-center justify-between">
      <div class="flex items-center flex-shrink-0">
        <img src={icon} height={75} width={75} class="mr-3" />
        <span class="font-semibold text-3xl tracking-tight text-sky-900">
          Moment &rarr; Temporal
        </span>
      </div>
      <div class="flex mr-16">
        <div class="mr-8">
          <a
            class={classNames(
              "font-semibold p-1 text-sky-900",
              `focus:outline-none focus:text-sky-500 focus:ring-1 focus:ring-sky-500 focus:ring-offset-2 focus:rounded`,
              `hover:text-sky-500`,
            )}
            href="#/explorer"
          >
            Explorer
          </a>
        </div>
        <div>
          <a
            class={classNames(
              "font-semibold p-1 text-sky-900",
              `focus:outline-none focus:text-sky-500 focus:ring-1 focus:ring-sky-500 focus:ring-offset-2 focus:rounded`,
              `hover:text-sky-500`,
            )}
            href="#/docs"
          >
            Docs
          </a>
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
            class={`flex-1 border-sky-900 border rounded p-2 bg-white`}
            placeholder="Moment.js code goes here"
            showLineNumbers={false}
            extensions={[minimalSetup, javascript({ typescript: true })]}
          />
          <CodeMirror
            value={output()}
            class={`flex-1 border-sky-900 border rounded p-2 bg-white`}
            placeholder="Moment.js code goes here"
            showLineNumbers={false}
            readOnly
            extensions={[minimalSetup, javascript({ typescript: true })]}
          />
        </div>
        <div class="flex justify-center">
          <a
            class={classNames(
              `py-1 px-2 ring-2 rounded ring-sky-900 text-sky-900`,
              `focus:outline-none focus:ring-2 focus:text-sky-500 focus:ring-sky-500`,
              `hover:text-sky-500 hover:ring-2 hover:ring-sky-500`,
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
  const [fragment, setFragment] = createSignal("");
  const onFragmentChange = () => {
    setFragment(window.location.hash);
  }
  onMount(() => {
    setFragment(window.location.hash);
    window.addEventListener("hashchange", onFragmentChange);
  });
  onCleanup(() => {
    window.removeEventListener("hashchange", onFragmentChange);
  })
  return (
    <>
      {fragment() === "#/docs" && <Docs />}
      {fragment() !== "#/docs" && <Explorer />}
    </>
  );
};

render(() => <MainSection />, document.getElementById("app")!);
