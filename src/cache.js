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

const pairwise = arr => _.zip(_.dropRight(arr), _.tail(arr));

const mergeFeedEntities = (cached, newEntityFragment) => {
  let mergedUpdates = [];
  if (cached === null) {
    mergedUpdates = _.sortBy(
      newEntityFragment.tripUpdate.stopTimeUpdate,
      "stopSequence"
    );
  } else {
    // FIXME: Consider _.merge
    mergedUpdates = _(newEntityFragment.tripUpdate.stopTimeUpdate)
      .unionBy(cached.feedEntity.tripUpdate.stopTimeUpdate, "stopSequence")
      .sortBy("stopSequence")
      .value();
  }
  let isValid = true;
  _.forEach(pairwise(mergedUpdates), ([currStop, nextStop]) => {
    if (currStop.departure.time >= nextStop.arrival.time) {
      isValid = false;
      return false;
    }
    return true;
  });
  const newEntity = _.cloneDeep(newEntityFragment);
  newEntity.tripUpdate.stopTimeUpdate = mergedUpdates;
  return { isValid, feedEntity: newEntity };
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
