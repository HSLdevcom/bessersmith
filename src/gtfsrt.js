const _ = require("lodash");
const moment = require("moment");
const protobuf = require("protobufjs");

const getFeedMessage = async filename => {
  let root;
  try {
    root = await protobuf.load(filename);
  } catch (err) {
    // FIXME: log as error
    console.log(`Loading the protobuf file at ${filename} failed:`, err);
    process.exit(1);
  }
  let msg;
  try {
    msg = root.lookupType("transit_realtime.FeedMessage");
  } catch (err) {
    // FIXME: log as error
    console.log(`Looking up FeedMessage from ${filename} failed:`, err);
    process.exit(1);
  }
  return msg;
};

const buildFeed = cache => {
  const sortedTripIds = cache.keys().sort();
  /**
   * As we do not have a snapshot of the cache, some values might expire while
   * we traverse the cache. Filter the nulls out.
   */
  const tripUpdates = _(sortedTripIds)
    .map(tripId => cache.get(tripId))
    .filter()
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
