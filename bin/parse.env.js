#!/bin/bash node

const fs = require("fs");
const path = require("path");
const pathToEnv = process.argv.slice(2)[0];

const data = fs.readFileSync(path.join(process.cwd(), pathToEnv)).toString();

const output = data
  .split("\n")
  .map(kv => kv.split("="))
  .reduce((o, [key, value]) => {
    try {
      value = JSON.parse(value);
    } catch (err) {}
    return { ...o, [key]: value };
  }, {});
console.log(JSON.stringify(output));
