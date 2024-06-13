import { javascript } from "@codemirror/lang-javascript";
import * as Sentry from "@sentry/browser";
import { debounce } from "@solid-primitives/scheduled";
// @ts-ignore
import { CodeMirror } from "@solid-codemirror/codemirror";
import { minimalSetup } from "codemirror";
import jsCodeShiftCore from "jscodeshift/src/core";
import * as prettier from "prettier";
import * as typescriptPlugin from "prettier/plugins/typescript";
import * as estreePlugin from "prettier/plugins/estree";
import { createSignal, createEffect, JSX, onMount, onCleanup } from "solid-js";
import { SolidMarkdown } from "solid-markdown";
import { render } from "solid-js/web";
import transform from "../../src/transform";
import icon from "../assets/icon.png";
import GithubIcon from "./github-icon";
import { plainText as readmeText } from "../../README.md";
import "./docs.css";

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: "https://55cf199bb7f25e45b9eea80250d571ce@o1208652.ingest.us.sentry.io/4507415527620608",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/sfishel18.github.io\/moment-to-temporal/,
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

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
  <div class="w-full min-h-screen flex flex-col bg-sky-900 bg-opacity-5 p-6">
    <nav class="flex items-center justify-between">
      <div class="flex items-center flex-shrink-0">
        <img src={icon} height={75} width={75} class="mr-3" />
        <span class="font-semibold text-3xl tracking-tight text-sky-900">
          Moment &rarr; Temporal
        </span>
      </div>
      <div class="flex mr-16">
        <div class="mr-4">
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
        <div class="mr-4">
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
        <div>
          <a
            class={classNames(
              "font-semibold p-1 text-sky-900",
              `focus:outline-none focus:text-sky-500 focus:ring-1 focus:ring-sky-500 focus:ring-offset-2 focus:rounded`,
              `hover:text-sky-500`,
            )}
            target="_blank"
            href="https://github.com/sfishel18/moment-to-temporal"
          >
            <GithubIcon />
          </a>
        </div>
      </div>
    </nav>
    {props.children}
  </div>
);

const initialInput = `import moment from 'moment';

const nowIso = moment().toDate().toISOString();`;

const Explorer = () => {
  const [input, setInput] = createSignal(initialInput);
  const [output, setOutput] = createSignal("");
  const debouncedSetOutput = debounce(
    (source: string) => transpile(source).then(setOutput),
    250,
  );
  createEffect(() => debouncedSetOutput(input()));
  return (
    <AppShell>
      <div class="flex flex-col flex-auto w-full h-full">
        <h3 class="mt-6 mb-2">
          Paste in some code to see how it will be transformed. A small (but
          growing!) subset of the Moment.js API is currenly supported.
        </h3>
        <h3>
          If your code doesn't get fully transformed, use the "File an issue"
          button below to create a pre-populated issue!
        </h3>
        <div class="flex flex-auto w-full h-full py-6 space-x-2">
          <div class="flex flex-col flex-1">
            <div class="bg-sky-900 text-white border-sky-900 border rounded-t px-4 py-2">
              Moment.js code goes in here...
            </div>
            <CodeMirror
              value={input()}
              onValueChange={(val: string) => setInput(val)}
              class="flex-1 border-sky-900 border rounded-b p-2 bg-white"
              showLineNumbers={false}
              extensions={[minimalSetup, javascript({ typescript: true })]}
            />
          </div>
          <div class="flex flex-col flex-1">
            <div class="bg-sky-900 text-white border-sky-900 border rounded-t px-4 py-2">
              ...and Temporal code comes out here
            </div>
            <CodeMirror
              value={output()}
              class="flex-1 border-sky-900 border rounded-b p-2 bg-white"
              showLineNumbers={false}
              readOnly
              extensions={[minimalSetup, javascript({ typescript: true })]}
            />
          </div>
        </div>
        <div class="flex justify-center items-center">
          <p class="mr-4">Output doesn't look right?</p>
          <a
            class={classNames(
              `py-1 px-2 ring-2 rounded ring-sky-900 text-sky-900`,
              `focus:outline-none focus:ring-2 focus:text-sky-500 focus:ring-sky-500`,
              `hover:text-sky-500 hover:ring-2 hover:ring-sky-500`,
            )}
            href={`https://github.com/sfishel18/moment-to-temporal/issues/new?template=bug-report.yml&title=%5BBug%5D%3A+&input=${encodeURIComponent(input())}&output=${encodeURIComponent(output())}`}
            target="_blank"
          >
            File an issue!
          </a>
        </div>
      </div>
    </AppShell>
  );
};

const Docs = () => (
  <AppShell>
    <div class="w-full h-full py-8" id="docs-markdown-container">
      <SolidMarkdown children={readmeText} />
    </div>
  </AppShell>
);

const MainSection = () => {
  const [fragment, setFragment] = createSignal("");
  const onFragmentChange = () => {
    setFragment(window.location.hash);
  };
  onMount(() => {
    setFragment(window.location.hash);
    window.addEventListener("hashchange", onFragmentChange);
  });
  onCleanup(() => {
    window.removeEventListener("hashchange", onFragmentChange);
  });
  return (
    <>
      {fragment() === "#/docs" && <Docs />}
      {fragment() !== "#/docs" && <Explorer />}
    </>
  );
};

render(() => <MainSection />, document.getElementById("app")!);
