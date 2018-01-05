const assert = require("assert");
const fs = require("fs");
const neodoc = require("neodoc");
const yaml = require("js-yaml");

const { run } = require("./src/run");

const help = `
bessersmith

Usage:
  bessersmith -c <CONFIG_YAML>
  bessersmith -h | --help

Options:
  -c --config=<CONFIG_YAML> Specify a YAML configuration file to use.
  -h --help                 Show this screen.
  --version                 Show version.
`;

const main = () => {
  const args = neodoc.run(help, { requireFlags: true });
  const configFilename = args["--config"];
  if (typeof configFilename === "undefined") {
    assert.fail("neodoc parsing has failed");
  }
  const config = yaml.safeLoad(fs.readFileSync(configFilename, "utf8"));
  Promise.resolve(run(config));
};

if (require.main === module) {
  main();
}
