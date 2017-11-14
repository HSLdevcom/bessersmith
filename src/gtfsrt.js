const _ = require("lodash");
const moment = require("moment");
const protobuf = require("protobufjs");

const getFeedMessage = async (filename, log) => {
  let root;
  try {
    root = await protobuf.load(filename);
  } catch (err) {
    log.fatal({ err }, "Loading the protobuf file failed");
    throw err;
  }
  let msg;
  try {
    msg = root.lookupType("transit_realtime.FeedMessage");
  } catch (err) {
    log.fatal({ err }, "Looking up FeedMessage from the protobuf file failed");
    throw err;
  }
  return msg;
};

const buildFeed = cache => {
  const sortedTripIds = cache.keys().sort();
  /**
   * As we do not have a snapshot of the cache, some values might expire while
   * we traverse the cache. Filter the nulls out.
   */
  const tripUpdates = _.chain(sortedTripIds)
    .map(tripId => cache.get(tripId))
    .filter()
    .filter("isValid")
    .map("feedEntity")
    .map(_.cloneDeep)
    .forEach(entity =>
      _(entity.tripUpdate.stopTimeUpdate).forEach(stopTimeUpdate =>
        _.unset(stopTimeUpdate, "stopSequence")
      )
    )
    .value();
  return {
    header: {
      gtfsRealtimeVersion: "1.0",
      timestamp: moment().unix()
    },
    entity: tripUpdates
  };
};

exports.buildFeed = buildFeed;
exports.getFeedMessage = getFeedMessage;
