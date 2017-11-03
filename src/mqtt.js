const _ = require("lodash");
const mqtt = require("mqtt");

const { transformMonoMessage } = require("./mono");
const { updateCache } = require("./cache");

const subscriptionCallback = (err, granted) => {
  if (err) {
    // FIXME: log an error for not being allowed to subscribe, probably requires changing broker settings
    console.log(err);
    // FIXME: Exit process
    process.exit(1);
  }
  _.forEach(granted, ({ topic, qos }) => {
    // FIXME: log the successful subscription to topic with granted qos
    console.log(`Subscribing to topic ${topic} succeeded with QoS ${qos}`);
  });
};

const startMQTTSubscription = (config, cache) => {
  const client = mqtt.connect(config.url, config.options);
  client.on("message", (topic, message) =>
    updateCache(cache, transformMonoMessage(message))
  );
  client.on("error", err => {
    // FIXME: log an error for not succeeding in connecting on the broker, likely needs reconfiguring broker
    // FIXME: exit process
    console.log(err);
    process.exit(1);
  });
  client.on("offline", () => {
    // FIXME: log a warning for disconnection
    console.log("Client got disconnected");
  });
  client.on("reconnect", () => {
    // FIXME: log an info for trying to reconnect
    console.log("Reconnecting to the MQTT broker");
  });
  client.on("connect", connack => {
    // FIXME: log an info for successful connection
    console.log(
      `Connecting to the MQTT broker succeeded with CONNACK ${JSON.stringify(
        connack
      )}`
    );
  });
  client.subscribe(
    config.topic,
    config.subscriptionOptions,
    subscriptionCallback
  );
  return client;
};

exports.startMQTTSubscription = startMQTTSubscription;
