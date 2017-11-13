const assert = require("assert");
const fs = require("fs");
const bunyan = require("bunyan");
const neodoc = require("neodoc");
const yaml = require("js-yaml");

const { createCache } = require("./src/cache");
const { getFeedMessage } = require("./src/gtfsrt");
const { createServer } = require("./src/http");
const { startMQTTSubscription } = require("./src/mqtt");

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

const run = async config => {
  const log = bunyan.createLogger(config.bunyan);
  const cache = createCache(config.cache);
  let feedMessage;
  try {
    feedMessage = await getFeedMessage(config.protoFilename, log);
  } catch (err) {
    process.exit(1);
  }
  const server = createServer(log, cache, feedMessage);
  startMQTTSubscription(config.mqtt, log, cache);
  server.listen(config.http.listeningOptions, () => {
    log.info("The HTTP server has been bound");
  });
};

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
