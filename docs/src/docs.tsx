import "./docs.css";
import { render } from "solid-js/web";

const MainSection = () => <section class="flex w-full">
    <textarea value="input" />
    <textarea value="output" />
</section>

render(() => <MainSection />, document.getElementById("app")!);
