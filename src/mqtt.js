const _ = require("lodash");
const mqtt = require("mqtt");

const startPublishing = (config, log) => {
  const { logIntervalInSeconds } = config;
  let packetAmount = 0;
  let logTimeout = null;
  let logInterval = null;
  if (!_.isUndefined(logIntervalInSeconds)) {
    if (_.isFinite(logIntervalInSeconds) && logIntervalInSeconds > 0) {
      logInterval = 1000 * config.logIntervalInSeconds;
    } else {
      log.fatal(
        { logIntervalInSeconds },
        "If given, logIntervalInSeconds must be a positive, finite number"
      );
      process.exit(1);
    }
  }

  const client = mqtt.connect(config.url, config.connectionOptions);
  const publish = msg => {
    client.publish(config.topic, msg, config.publishingOptions, err => {
      if (err) {
        log.warn({ err, msg }, "QoS handling of publishing a message failed");
      }
    });
  };
  client.on("packetsend", () => {
    packetAmount += 1;
  });
  client.on("error", err => {
    log.fatal(
      { err },
      "Connecting to the MQTT broker for publishing failed. Please check the client and the broker configurations."
    );
    process.exit(1);
  });
  client.on("offline", () => {
    log.warn("The publishing MQTT client lost the connection");
  });
  client.on("reconnect", () => {
    log.info("Reconnecting to the MQTT broker for publishing");
  });
  client.on("connect", connack => {
    log.info(
      { connack },
      "Connecting to the MQTT broker for publishing succeeded"
    );
    if (!_.isNull(logInterval) && _.isNull(logTimeout)) {
      logTimeout = setInterval(() => {
        log.info({ packetAmount }, "Sending MQTT packets");
        packetAmount = 0;
      }, logInterval);
    }
  });
  return publish;
};

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

const startSubscription = (config, log, cache, handleMessage) => {
  const client = mqtt.connect(config.url, config.connectionOptions);
  client.on("message", handleMessage);
  client.on("error", err => {
    log.fatal(
      { err },
      "Connecting to the MQTT broker for subscribing failed. Please check the client and the broker configurations."
    );
    process.exit(1);
  });
  client.on("offline", () => {
    log.warn("The subscribing MQTT client lost the connection");
  });
  client.on("reconnect", () => {
    log.info("Reconnecting to the MQTT broker for subscribing");
  });
  client.on("connect", connack => {
    log.info(
      { connack },
      "Connecting to the MQTT broker for subscribing succeeded"
    );
  });
  client.subscribe(
    config.topic,
    config.subscriptionOptions,
    createSubscriptionCallback(config.topic, log)
  );
  return client;
};

exports.startPublishing = startPublishing;
exports.startSubscription = startSubscription;
