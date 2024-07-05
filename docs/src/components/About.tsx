import { SolidMarkdown } from "solid-markdown";
import { plainText as readmeText } from "../../../README.md";
import { AppShell } from "./AppShell";

export const About = () => (
  <AppShell>
    <div class="w-full h-full py-8" id="docs-markdown-container">
      <SolidMarkdown children={readmeText} />
    </div>
  </AppShell>
);
