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

const mergeFeedEntities = (cached, newEntityFragment) => {
  let mergedUpdates = [];
  if (cached === null) {
    mergedUpdates = _.sortBy(
      newEntityFragment.tripUpdate.stopTimeUpdate,
      "stopSequence"
    );
  } else {
    mergedUpdates = _(newEntityFragment.tripUpdate.stopTimeUpdate)
      .unionBy(cached.tripUpdate.stopTimeUpdate, "stopSequence")
      .sortBy("stopSequence")
      .value();
  }
  const newEntity = _.cloneDeep(newEntityFragment);
  newEntity.tripUpdate.stopTimeUpdate = mergedUpdates;
  return newEntity;
};

const updateCache = (cache, input) => {
  _.forOwn(input, (newEntityFragment, tripId) =>
    cache.put(tripId, mergeFeedEntities(cache.get(tripId), newEntityFragment))
  );
  return cache;
};

exports.createCache = createCache;
exports.mergeFeedEntities = mergeFeedEntities;
exports.updateCache = updateCache;
