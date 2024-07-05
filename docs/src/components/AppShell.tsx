import { JSX } from "solid-js/jsx-runtime";
import icon from "../../assets/icon.png";
import { classNames } from "../utils/class-names";
import GithubIcon from "./github-icon";

export const AppShell = (props: { children: JSX.Element }) => (
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
            href="#/about"
          >
            About
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
