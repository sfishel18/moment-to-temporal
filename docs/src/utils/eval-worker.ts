import moment from "moment";
import { Temporal } from "@js-temporal/polyfill";
import FakeTimers from "@sinonjs/fake-timers";
// @ts-ignore
import toFormattedString from "moment-to-temporal/runtime/to-formatted-string";
// @ts-ignore
import toLegacyDate from "moment-to-temporal/runtime/to-legacy-date";
// @ts-ignore
import fromString from "moment-to-temporal/runtime/from-string";

self.addEventListener("message", (e) => {
  const { messageId, source, timestamp } = JSON.parse(e.data);
  const clock = FakeTimers.install({ now: timestamp });
  let result;
  ((
    moment,
    Temporal,
    toFormattedString,
    toLegacyDate,
    fromString,
    self,
    importScripts
  ) => {
    try {
      result = eval(`${source}`);
    } catch (e) {
      // pass
    }
  })(moment, Temporal, toFormattedString, toLegacyDate, fromString);
  self.postMessage(JSON.stringify({ messageId, result }));
  clock.uninstall();
});
