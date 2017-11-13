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

const mergeFeedEntities = (cachedEntity, newEntityFragment) => {
  const mergedUpdates = _(newEntityFragment.tripUpdate.stopTimeUpdate)
    .unionBy(cachedEntity.tripUpdate.stopTimeUpdate, "stopSequence")
    .sortBy("stopSequence")
    .value();
  // Use new timestamp.
  const newTrip = _.cloneDeep(newEntityFragment);
  newTrip.tripUpdate.stopTimeUpdate = mergedUpdates;
  return newTrip;
};

const updateCache = (cache, input) => {
  _.forEach(input, (newEntityFragment, tripId) => {
    const cachedEntity = cache.get(tripId);
    if (cachedEntity === null) {
      cache.put(tripId, newEntityFragment);
    } else {
      cache.put(tripId, mergeFeedEntities(cachedEntity, newEntityFragment));
    }
  });
  return cache;
};

exports.createCache = createCache;
exports.mergeFeedEntities = mergeFeedEntities;
exports.updateCache = updateCache;
