#!/usr/bin/env node

const { run: jscodeshift } = require("jscodeshift/src/Runner");
const path = require("node:path");

const transformPath = path.resolve(__dirname, "../lib/transform.js");

jscodeshift(transformPath, [process.argv[2]], {}).then(() => {
  console.log("Tranformation complete!");
});
