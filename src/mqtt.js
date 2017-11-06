const _ = require("lodash");
const mqtt = require("mqtt");

const { transformMonoMessage } = require("./mono");
const { updateCache } = require("./cache");

const createSubscriptionCallback = (topic, log) => {
  const subscriptionCallback = (err, granted) => {
    if (err) {
      log.fatal(
        { err, topic },
        "Subscribing to the topic failed. Please check the client and the broker configurations."
      );
      process.exit(1);
    }
    _.forEach(granted, ({ grantedTopic, qos }) => {
      log.info({ grantedTopic, qos }, "Subscribing to the topic succeeded");
    });
  };
  return subscriptionCallback;
};

const startMQTTSubscription = (config, log, cache) => {
  const client = mqtt.connect(config.url, config.options);
  client.on("message", (topic, message) =>
    updateCache(cache, transformMonoMessage(message))
  );
  client.on("error", err => {
    log.fatal(
      { err },
      "Connecting to the MQTT broker failed. Please check the client and the broker configurations."
    );
    process.exit(1);
  });
  client.on("offline", () => {
    log.warn("The MQTT client lost the connection");
  });
  client.on("reconnect", () => {
    log.info("Reconnecting to the MQTT broker");
  });
  client.on("connect", connack => {
    log.info({ connack }, "Connecting to the MQTT broker succeeded");
  });
  client.subscribe(
    config.topic,
    config.subscriptionOptions,
    createSubscriptionCallback(config.topic, log)
  );
  return client;
};

exports.startMQTTSubscription = startMQTTSubscription;
