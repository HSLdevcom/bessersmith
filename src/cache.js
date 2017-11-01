const _ = require("lodash");
const { Cache } = require("memory-cache");

const createCache = config => {
  const { ttlInSeconds } = config;
  let ttlInMilliseconds;
  if (typeof ttlInSeconds !== "undefined") {
    ttlInMilliseconds = ttlInSeconds * 1000;
  }
  const cache = new Cache();
  cache.put = _.partial(cache.put, _, _, ttlInMilliseconds);
  return cache;
};

const updateCache = (cache, input) => {
  _.forEach(input, (newTripFragment, tripId) => {
    const cachedTrip = cache.get(tripId);
    if (cachedTrip === null) {
      cache.put(tripId, newTripFragment);
    } else {
      const newTripUpdates = _.unionBy(
        newTripFragment.tripUpdate.stopTimeUpdate,
        cachedTrip.tripUpdate.stopTimeUpdate,
        "stopSequence"
      );
      const newTrip = newTripFragment;
      newTrip.tripUpdate.stopTimeUpdate = newTripUpdates;
      cache.put(tripId, newTrip);
    }
  });
  return cache;
};

exports.createCache = createCache;
exports.updateCache = updateCache;
