#!/usr/bin/env node

const { run: jscodeshift } = require("jscodeshift/src/Runner");
const path = require("node:path");
const fs = require("node:fs");

const transformPath = path.resolve(__dirname, "../lib/transform.js");

const resultFilePath = path.resolve(__dirname, "result.json");

jscodeshift(transformPath, [process.argv[2]], {
  silent: true,
  extensions: "js,jsx,ts,tsx",
  parser: "tsx",
  resultFilePath,
}).then((result) => {
  if (result.ok === 0) {
    console.log("No files changed.");
  }
  console.log(
    "Tranformation complete!",
    result.ok === 1 ? "1 file updated." : `${result.ok} files updated.`
  );

  let customResult = {};
  try {
    customResult = JSON.parse(
      fs.readFileSync(resultFilePath, { encoding: "utf-8" })
    );
  } catch (e) {}

  if (customResult.importsAdded?.length > 0) {
    console.log("\r\nYou will need to install the following modules from NPM:");
    customResult.importsAdded.forEach((i) => {
      console.log(`  * ${i}`);
    });
  }
});
