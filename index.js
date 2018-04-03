const _ = require("lodash");
const assert = require("assert");
const fs = require("fs");
const neodoc = require("neodoc");
const yaml = require("js-yaml");

const { run } = require("./src/run");

const help = `
bessersmith

Usage:
  bessersmith -c <CONFIG_PATH>
  bessersmith -h | --help

Options:
  -c --config=<CONFIG_PATH> Specify the path to the UTF-8 YAML configuration
                            file.
  -h --help                 Show this screen.
  --version                 Show version.
`;

const toNumberOrUndefined = arg =>
  typeof arg === "undefined" ? undefined : _.toNumber(arg);

const constructConfigFromEnvironment = () => {
  const filled = {
    bunyan: {
      name: process.env.BUNYAN_NAME,
      level: process.env.BUNYAN_LEVEL
    },
    mqtt: {
      subscribe: {
        url: process.env.MQTT_SUB_URL,
        connectionOptions: {
          port: toNumberOrUndefined(process.env.MQTT_SUB_PORT),
          clientId: process.env.MQTT_SUB_CLIENT_ID,
          clean: process.env.MQTT_SUB_CLEAN,
          username: process.env.MQTT_SUB_USERNAME,
          password: process.env.MQTT_SUB_PASSWORD
        },
        subscriptionOptions: {
          qos: toNumberOrUndefined(process.env.MQTT_SUB_QOS)
        },
        topic: process.env.MQTT_SUB_TOPIC
      },
      publish: {
        url: process.env.MQTT_PUB_URL,
        connectionOptions: {
          port: toNumberOrUndefined(process.env.MQTT_PUB_PORT),
          clientId: process.env.MQTT_PUB_CLIENT_ID,
          clean: process.env.MQTT_PUB_CLEAN,
          username: process.env.MQTT_PUB_USERNAME,
          password: process.env.MQTT_PUB_PASSWORD
        },
        publishingOptions: {
          qos: toNumberOrUndefined(process.env.MQTT_PUB_QOS)
        },
        topic: process.env.MQTT_PUB_TOPIC,
        logIntervalInSeconds: process.env.MQTT_PUB_LOG_INTERVAL_IN_SECONDS
      }
    },
    cacheTTLInSeconds: toNumberOrUndefined(process.env.CACHE_TTL_IN_SECONDS),
    protoPath: process.env.PROTO_PATH
  };
  return _.omitBy(filled, _.isUndefined);
};

const assertFieldExists = (value, name) => {
  if (typeof value === "undefined") {
    assert.fail(`${name} must be provided`);
  }
};

const getConfig = cliConfigPath => {
  const useCliConfigPath = typeof cliConfigPath === "undefined";
  const configPath = cliConfigPath || process.env.CONFIG_PATH;
  let configFromFile = {};
  if (typeof configPath !== "undefined") {
    configFromFile = yaml.safeLoad(fs.readFileSync(configPath, "utf8"));
  }
  const envConfig = constructConfigFromEnvironment();
  let config = {};
  if (!useCliConfigPath) {
    config = _.merge(envConfig, configFromFile);
  } else {
    config = _.merge(configFromFile, envConfig);
  }

  assertFieldExists(config.bunyan.name, "bunyan.name");
  assertFieldExists(config.mqtt.subscribe.topic, "mqtt.subscribe.topic");
  assertFieldExists(config.mqtt.publish.topic, "mqtt.publish.topic");
  assertFieldExists(config.protoPath, "protoPath");

  return config;
};

const main = () => {
  const args = neodoc.run(help);
  const config = getConfig(args["--config"]);
  Promise.resolve(run(config));
};

if (require.main === module) {
  main();
}
