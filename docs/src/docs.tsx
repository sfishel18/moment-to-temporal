import { javascript } from "@codemirror/lang-javascript";
import { debounce } from "@solid-primitives/scheduled";
// @ts-ignore
import { CodeMirror } from "@solid-codemirror/codemirror";
import { minimalSetup } from "codemirror";
import jsCodeShiftCore from "jscodeshift/src/core";
import * as prettier from "prettier";
import * as typescriptPlugin from "prettier/plugins/typescript";
import * as estreePlugin from "prettier/plugins/estree";
import { createSignal, createEffect, JSX } from "solid-js";
import { render } from "solid-js/web";
import { Tab, TabGroup, TabList, TabPanel } from "terracotta";
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

const MainSection = () => {
  const [input, setInput] = createSignal("");
  const [output, setOutput] = createSignal("");
  const debouncedSetOutput = debounce(
    (source: string) => transpile(source).then(setOutput),
    250,
  );
  createEffect(() => debouncedSetOutput(input()));
  return (
    <TabGroup
      class="w-full h-screen flex flex-col items-stretch justify-center p-4 space-y-2 rounded-lg bg-rose-900 bg-opacity-25"
      defaultValue="explorer"
      horizontal
    >
      {({ isSelected, isActive }): JSX.Element => (
        <>
          <TabList class="w-full flex space-x-2">
            <Tab
              class={classNames(
                isSelected("explorer")
                  ? "bg-rose-900 bg-opacity-75 text-white"
                  : "bg-white",
                isActive("explorer") &&
                  "ring-2 ring-offset-2 ring-offset-rose-300 ring-white ring-opacity-60",
                "w-28 flex items-center justify-center rounded-lg shadow-md px-4 py-2 cursor-pointer focus:outline-none font-semibold",
              )}
              value="explorer"
            >
              Explorer
            </Tab>
            <Tab
              class={classNames(
                isSelected("docs")
                  ? "bg-rose-900 bg-opacity-75 text-white"
                  : "bg-white",
                isActive("docs") &&
                  "ring-2 ring-offset-2 ring-offset-rose-300 ring-white ring-opacity-60",
                "w-28 flex items-center justify-center rounded-lg shadow-md px-4 py-2 cursor-pointer focus:outline-none font-semibold",
              )}
              value="docs"
            >
              Docs
            </Tab>
          </TabList>
          <TabPanel
            value="explorer"
            class={classNames(
              "flex flex-col w-full h-full p-2 rounded-lg bg-white overflow-y-auto focus:outline-none",
              "focus:ring-2 focus:ring-offset-2 focus:ring-offset-rose-300 focus:ring-white focus:ring-opacity-60",
            )}
          >
            <div class="flex w-full h-full px-6 py-8 space-x-2">
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
            </div>
            <a
              href={`https://github.com/sfishel18/moment-to-temporal/issues/new?template=bug-report.yml&title=%5BBug%5D%3A+&input=${encodeURIComponent(input())}&output=${encodeURIComponent(output())}`}
              target="_blank"
            >
              File a bug!
            </a>
          </TabPanel>
          <TabPanel
            value="docs"
            class={classNames(
              "w-full h-full p-2 rounded-lg bg-white overflow-y-auto focus:outline-none",
              "focus:ring-2 focus:ring-offset-2 focus:ring-offset-rose-300 focus:ring-white focus:ring-opacity-60",
            )}
          >
            <h1>Docs go here...</h1>
          </TabPanel>
        </>
      )}
    </TabGroup>
  );
};

render(() => <MainSection />, document.getElementById("app")!);
