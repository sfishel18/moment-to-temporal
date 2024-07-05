import { createSignal, createEffect } from "solid-js";
import { javascript } from "@codemirror/lang-javascript";
import { debounce } from "@solid-primitives/scheduled";
// @ts-ignore
import { CodeMirror } from "@solid-codemirror/codemirror";
import { minimalSetup } from "codemirror";
import { AppShell } from "./AppShell";
import { transpileSource } from "../utils/transpile-source";
import { evaluateSource } from "../utils/evaluate-source";
import { SourceWithTimestamp } from "../types";
import { classNames } from "../utils/class-names";

type OutputMatchResult = "pending" | "match" | "no-match";

const inputLocalStorageKey = "M2T_input";
const initialInput = `import moment from 'moment';

moment('2018-10-16T04:19:00')
  .add(3, 'years')
  .subtract(5, 'months')
  .subtract(13, 'days')
  .add(12, 'hours')
  .format('MM/DD/YYYY [at] hh:mm A')`;

export const Explorer = () => {
  const [input, setInput] = createSignal<SourceWithTimestamp>({
    source: localStorage.getItem(inputLocalStorageKey) || initialInput,
    timestamp: Date.now(),
  });

  const [output, setOutput] = createSignal<SourceWithTimestamp>({
    source: "",
    timestamp: 0,
  });
  const debouncedSetOutput = debounce((inp: SourceWithTimestamp) => {
    localStorage.setItem(inputLocalStorageKey, inp.source);
    transpileSource(inp.source)
      .then((transpiled) => {
        setOutput({ source: transpiled, timestamp: inp.timestamp });
      })
      .catch((e) => {
        console.error(e);
      });
  }, 250);
  createEffect(() => debouncedSetOutput(input()));

  const [inputResult, setInputResult] = createSignal("");
  const debouncedSetInputResult = debounce((inp: SourceWithTimestamp) => {
    evaluateSource(inp).then(setInputResult);
  }, 250);
  createEffect(() => debouncedSetInputResult(input()));

  const [outputResult, setOutputResult] = createSignal("");
  createEffect(() => evaluateSource(output()).then(setOutputResult));

  const outputMatch = (): OutputMatchResult => {
    if (
      input().timestamp === output().timestamp &&
      !!outputResult() &&
      !!inputResult()
    ) {
      return inputResult() === outputResult() ? "match" : "no-match";
    }
    return "pending";
  };

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
              value={input().source}
              onValueChange={(val: string) =>
                setInput({ source: val, timestamp: Date.now() })
              }
              class="flex-1 border-sky-900 border-x p-2 bg-white"
              showLineNumbers={false}
              extensions={[minimalSetup, javascript({ typescript: true })]}
            />
            <div class="border-sky-900 border rounded-b p-2 bg-white text-sm">
              <pre>&gt; {JSON.stringify(inputResult())}</pre>
            </div>
          </div>
          <div class="flex flex-col flex-1">
            <div class="bg-sky-900 text-white border-sky-900 border rounded-t px-4 py-2">
              ...and Temporal code comes out here
            </div>
            <CodeMirror
              value={output().source}
              class="flex-1 border-sky-900 border-x p-2 bg-white"
              showLineNumbers={false}
              readOnly
              extensions={[minimalSetup, javascript({ typescript: true })]}
            />
            <div class="border-sky-900 border rounded-b p-2 bg-white text-sm flex">
              <pre class="mr-2">&gt; {JSON.stringify(outputResult())}</pre>
              {outputMatch() === "match" && <MatchIcon />}
              {outputMatch() === "no-match" && <NoMatchIcon />}
            </div>
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
            href={`https://github.com/sfishel18/moment-to-temporal/issues/new?template=bug-report.yml&title=%5BBug%5D%3A+&input=${encodeURIComponent(input().source)}&output=${encodeURIComponent(output().source)}`}
            target="_blank"
          >
            File an issue!
          </a>
        </div>
      </div>
    </AppShell>
  );
};

const MatchIcon = () => <span class="font-bold text-green-500">&check;</span>;
const NoMatchIcon = () => <span class="font-bold text-red-500">X</span>;
