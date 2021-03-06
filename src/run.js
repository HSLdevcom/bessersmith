const bunyan = require("bunyan");
const _ = require("lodash");

const { createCache, updateCache } = require("./cache");
const { createFeedBuilder, getFeedMessage } = require("./gtfsrt");
const { transformMonoMessage } = require("./mono");
const { startPublishing, startSubscription } = require("./mqtt");

const removeStopSequence = feedEntity => {
  const censored = _.cloneDeep(feedEntity);
  censored.tripUpdate.stopTimeUpdate = _.map(
    censored.tripUpdate.stopTimeUpdate,
    stopTimeUpdate => _.omit(stopTimeUpdate, "stopSequence")
  );
  return censored;
};

const createMessageHandler = (log, cache, buildFeed, publish) => {
  const handleMessage = (topic, input) => {
    const feedEntityFragments = transformMonoMessage(log, input);
    updateCache(cache, feedEntityFragments);
    _.chain(feedEntityFragments)
      .keys()
      .map(tripId => cache.get(tripId))
      /**
       * With a large enough cacheTTLInSeconds, the cache should not expire the
       * trips that were just updated with updateCache(). Unfortunately
       * cache.get() has a side effect of removing expired entries, so filter
       * out nulls just in case.
       */
      .filter()
      /**
       * As via points in PubTrans have their own stopSequence, stopSequence
       * does not match the published GTFS. stopSequence should be removed only
       * after updateCache where it is used for retaining order in
       * stopTimeUpdate.
       */
      .map(feedEntity => removeStopSequence(feedEntity))
      // Publish each trip separately.
      .map(feedEntity => buildFeed([feedEntity]))
      .forEach(feed => publish(feed))
      .value();
  };
  return handleMessage;
};

const run = async config => {
  const log = bunyan.createLogger(config.bunyan);
  log.info({ gitCommit: process.env.GIT_COMMIT }, "log opened");
  let feedMessage;
  try {
    feedMessage = await getFeedMessage(config.protoPath, log);
  } catch (err) {
    process.exit(1);
  }
  const buildFeed = createFeedBuilder(feedMessage);
  const cache = createCache(config.cacheTTLInSeconds);
  const publish = startPublishing(config.mqtt.publish, log);
  const handleMessage = createMessageHandler(log, cache, buildFeed, publish);
  startSubscription(config.mqtt.subscribe, log, cache, handleMessage);
};

exports.run = run;
