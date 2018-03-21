const moment = require("moment");
const protobuf = require("protobufjs");

const createFeedBuilder = feedMessage => {
  const buildFeed = feedEntities => {
    const feedFormat = {
      header: {
        gtfsRealtimeVersion: "2.0",
        incrementality: 1,
        timestamp: moment().unix()
      },
      entity: feedEntities
    };
    return feedMessage.encode(feedMessage.create(feedFormat)).finish();
  };
  return buildFeed;
};

const getFeedMessage = async (protoPath, log) => {
  let root;
  try {
    root = await protobuf.load(protoPath);
  } catch (err) {
    log.fatal({ err }, "Loading the protobuf file failed");
    throw err;
  }
  let feedMessage;
  try {
    feedMessage = root.lookupType("transit_realtime.FeedMessage");
  } catch (err) {
    log.fatal({ err }, "Looking up FeedMessage from the protobuf file failed");
    throw err;
  }
  return feedMessage;
};

exports.createFeedBuilder = createFeedBuilder;
exports.getFeedMessage = getFeedMessage;
