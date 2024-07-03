import * as Sentry from "@sentry/browser";
import { createSignal, onMount, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import "./docs.css";
import { Explorer } from "./components/Explorer";
import { About } from "./components/About";


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
      {fragment() === "#/about" && <About />}
      {fragment() !== "#/about" && <Explorer />}
    </>
  );
};

render(() => <MainSection />, document.getElementById("app")!);
