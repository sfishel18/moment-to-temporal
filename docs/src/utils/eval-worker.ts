import moment from "moment";
import { Temporal } from "@js-temporal/polyfill";
import FakeTimers from "@sinonjs/fake-timers";
// @ts-ignore
import toFormattedString from "moment-to-temporal/runtime/to-formatted-string";
// @ts-ignore
import toLegacyDate from "moment-to-temporal/runtime/to-legacy-date";
// @ts-ignore
import toEpochNanos from "moment-to-temporal/runtime/to-epoch-nanos";

const noop = (obj: unknown) => obj;

self.addEventListener("message", (e) => {
  const { messageId, source, timestamp } = JSON.parse(e.data);
  const clock = FakeTimers.install({ now: timestamp });
  let result;
  ((
    moment,
    Temporal,
    toFormattedString,
    toLegacyDate,
    toEpochNanos,
    self,
    importScripts,
  ) => {
    try {
      // hack to prevent the minifier from removing these variables from the local scope
      noop({ moment, Temporal, toFormattedString, toLegacyDate, toEpochNanos, self, importScripts })
      result = eval(`${source}`);
    } catch (e) {
      console.error(e);
    }
  })(moment, Temporal, toFormattedString, toLegacyDate, toEpochNanos);
  self.postMessage(JSON.stringify({ messageId, result }));
  clock.uninstall();
});
