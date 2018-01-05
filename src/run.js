const _ = require("lodash");
const bunyan = require("bunyan");

const { createCache, updateCache } = require("./cache");
const { createFeedBuilder, getFeedMessage } = require("./gtfsrt");
const { transformMonoMessage } = require("./mono");
const { startPublishing, startSubscription } = require("./mqtt");

const createMessageHandler = (log, cache, buildFeed, publish) => {
  const handleMessage = (topic, input) => {
    const feedEntityFragments = transformMonoMessage(log, input);
    updateCache(cache, feedEntityFragments);
    _.chain(feedEntityFragments)
      .keys()
      .map(tripId => cache.get(tripId))
      // Publish each trip separately.
      .map(feedEntity => buildFeed([feedEntity]))
      .forEach(feed => publish(feed))
      .value();
  };
  return handleMessage;
};

const run = async config => {
  const log = bunyan.createLogger(config.bunyan);
  let feedMessage;
  try {
    feedMessage = await getFeedMessage(config.protoFilename, log);
  } catch (err) {
    process.exit(1);
  }
  const buildFeed = createFeedBuilder(feedMessage);
  const cache = createCache(config.cache);
  const publish = startPublishing(config.mqtt.publish, log);
  const handleMessage = createMessageHandler(log, cache, buildFeed, publish);
  startSubscription(config.mqtt.subscribe, log, cache, handleMessage);
};

exports.run = run;
