import jsCodeShiftCore from "jscodeshift/src/core";
import { uniqueId } from "lodash";
import evalPrepTransform from "./eval-prep-transform";
import { SourceWithTimestamp } from "../types";

const worker = new Worker(new URL("./eval-worker.ts", import.meta.url), {
  type: "module",
});

const j = jsCodeShiftCore.withParser("ts");

export const evaluateSource = async (
  input: SourceWithTimestamp
): Promise<string> => {
  if (!input.source) {
    return "";
  }
  const prepped = evalPrepTransform(
    { source: input.source } as any,
    { j } as any,
    {}
  );
  const messageId = uniqueId("worker-message-");
  return new Promise((res) => {
    const onWorkerMessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.messageId === messageId) {
        res(data.result);
        worker.removeEventListener("message", onWorkerMessage);
      }
    };
    worker.addEventListener("message", onWorkerMessage);
    worker.postMessage(
      JSON.stringify({ messageId, source: prepped, timestamp: input.timestamp })
    );
  });
};
