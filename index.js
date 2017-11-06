const bunyan = require("bunyan");

const { createCache } = require("./src/cache");
const { getFeedMessage } = require("./src/gtfsrt");
const { createServer } = require("./src/http");
const { startMQTTSubscription } = require("./src/mqtt");

const run = async config => {
  const log = bunyan.createLogger(config.bunyan);
  const cache = createCache(config.cache);
  let feedMessage;
  try {
    feedMessage = await getFeedMessage(config.protoFilename, log);
  } catch (err) {
    log.fatal({ err }, "Something weird happened in getFeedMessage");
    process.exit(1);
  }
  const server = createServer(cache, feedMessage);
  startMQTTSubscription(config.mqtt, log, cache);
  server.listen(config.http.listeningOptions, () => {
    log.info("The HTTP server has been bound");
  });
};

const main = () => {
  // FIXME: read config from config file
  // FIXME: Perhaps log the config sans sensitive material after parsing.
  const config = {
    bunyan: {
      name: "bessersmith",
      level: "info"
    },
    mqtt: {
      url: "mqtt://mqtt.hsl.fi",
      connectionOptions: {
        // FIXME: Fix broker settings.
        // clean: false
        clean: true
      },
      subscriptionOptions: {
        qos: 1
      },
      topic: "mono/v2/predictions/#"
    },
    http: {
      listeningOptions: {
        port: 8087
      }
    },
    cache: {
      ttlInSeconds: 60 * 60 * 2
    },
    protoFilename: "gtfs-realtime.proto"
  };
  Promise.resolve(run(config));
};

if (require.main === module) {
  main();
}
