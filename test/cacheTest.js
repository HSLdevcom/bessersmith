const { expect } = require("chai");
const _ = require("lodash");
const lolex = require("lolex");

const { createCache, mergeFeedEntities, updateCache } = require("../src/cache");

describe("cache", () => {
  let tripId1;
  let tripId2;
  let input1TripId1Stop45;
  let input1TripId1Stop46;
  let input2TripId1Stop46;
  let input1;
  let input2;
  let output;

  beforeEach(() => {
    tripId1 = "4562_1_2017-10-30T14:02:00+02:00";
    tripId2 = "4562_1_2017-10-30T14:12:00+02:00";
    input1TripId1Stop45 = {
      stopSequence: 45,
      stopId: "4680248",
      arrival: {
        delay: -20,
        time: 1509367660
      },
      departure: {
        delay: -20,
        time: 1509367660
      }
    };
    input1TripId1Stop46 = {
      stopSequence: 46,
      stopId: "4520260",
      arrival: {
        delay: -21,
        time: 1509367719
      },
      departure: {
        delay: -21,
        time: 1509367719
      }
    };
    input2TripId1Stop46 = {
      stopSequence: 46,
      stopId: "4520260",
      arrival: {
        delay: -20,
        time: 1509367720
      },
      departure: {
        delay: -20,
        time: 1509367720
      }
    };
    input1 = {
      [tripId1]: {
        id: tripId1,
        tripUpdate: {
          trip: {
            routeId: "4562",
            directionId: 0,
            startTime: "14:02:00",
            startDate: "20171030"
          },
          stopTimeUpdate: [input1TripId1Stop45, input1TripId1Stop46],
          timestamp: 1509367654
        }
      },
      [tripId2]: {
        id: tripId2,
        tripUpdate: {
          trip: {
            routeId: "4562",
            directionId: 0,
            startDate: "20171030",
            startTime: "14:12:00"
          },
          stopTimeUpdate: [
            {
              stopSequence: 46,
              stopId: "4520260",
              arrival: {
                delay: -142,
                time: 1509368198
              },
              departure: {
                delay: -142,
                time: 1509368198
              }
            }
          ],
          timestamp: 1509367654
        }
      }
    };
    input2 = {
      [tripId1]: {
        id: tripId1,
        tripUpdate: {
          trip: {
            routeId: "4562",
            directionId: 0,
            startTime: "14:02:00",
            startDate: "20171030"
          },
          stopTimeUpdate: [input2TripId1Stop46],
          timestamp: 1509367659
        }
      }
    };
    output = {
      [tripId1]: {
        id: tripId1,
        tripUpdate: {
          trip: {
            routeId: "4562",
            directionId: 0,
            startTime: "14:02:00",
            startDate: "20171030"
          },
          stopTimeUpdate: [input1TripId1Stop45, input2TripId1Stop46],
          timestamp: 1509367659
        }
      },
      [tripId2]: input1[tripId2]
    };
  });

  describe("updateCache", () => {
    const cacheOptions = {
      ttlInSeconds: undefined
    };

    it("should not throw on empty cache", () => {
      const cache = createCache(cacheOptions);
      expect(() => updateCache(cache, input1)).to.not.throw();
      expect(cache.size()).to.equal(2);
    });

    it("should not throw on empty input", () => {
      const cache = createCache(cacheOptions);
      updateCache(cache, input1);
      expect(() => updateCache(cache, {})).to.not.throw();
      expect(cache.size()).to.equal(2);
    });

    it("should not throw on empty cache and empty input", () => {
      const cache = createCache(cacheOptions);
      expect(() => updateCache(cache, {})).to.not.throw();
      expect(cache.size()).to.equal(0);
    });

    it("should replace old information with new input", () => {
      const cache = createCache(cacheOptions);
      updateCache(cache, input1);
      updateCache(cache, input2);
      expect(cache.size()).to.equal(2);

      const cacheKeys = cache.keys();
      expect(cacheKeys.sort()).to.deep.equal(_.keys(output).sort());
      _.forEach(cacheKeys, key =>
        expect(cache.get(key)).to.deep.equal(output[key])
      );
    });

    it("should update timestamp", () => {
      const cache = createCache(cacheOptions);
      updateCache(cache, input1);
      expect(cache.get(tripId1).tripUpdate.timestamp).to.equal(
        input1[tripId1].tripUpdate.timestamp
      );
      updateCache(cache, input2);
      expect(cache.get(tripId1).tripUpdate.timestamp).to.equal(
        output[tripId1].tripUpdate.timestamp
      );
    });
  });

  describe("forgetful cache", () => {
    let clock;
    before(() => {
      clock = lolex.install();
    });
    after(() => clock.uninstall());

    const cacheOptions = {
      ttlInSeconds: 0.1
    };

    it("should forget the contents after the specified time", () => {
      const cache = createCache(cacheOptions);
      updateCache(cache, input1);
      expect(cache.size()).to.equal(2);
      clock.tick(99);
      expect(cache.size()).to.equal(2);
      clock.tick(1);
      expect(cache.size()).to.equal(0);
    });

    it("should reset the expiration timer for the refreshed entries", () => {
      const cache = createCache(cacheOptions);
      updateCache(cache, input1);
      clock.tick(99);
      expect(cache.size()).to.equal(2);
      updateCache(cache, input2);
      expect(cache.size()).to.equal(2);
      clock.tick(1);
      expect(cache.size()).to.equal(1);
      clock.tick(99 - 1);
      expect(cache.size()).to.equal(1);
      clock.tick(1);
      expect(cache.size()).to.equal(0);
    });
  });

  describe("mergeFeedEntities", () => {
    it("should use the timestamp of the latest update", () => {
      const cached = input1[tripId1];
      const newEntityFragment = input2[tripId1];
      const merged = mergeFeedEntities(cached, newEntityFragment);
      expect(merged.tripUpdate.timestamp).to.equal(
        newEntityFragment.tripUpdate.timestamp
      );
    });

    it("should not modify any inputs", () => {
      const cached = input1[tripId1];
      const newEntityFragment = input2[tripId1];
      const cachedClone = _.cloneDeep(cached);
      const newClone = _.cloneDeep(newEntityFragment);
      mergeFeedEntities(cached, newEntityFragment);
      expect(cached).to.deep.equal(cachedClone);
      expect(newEntityFragment).to.deep.equal(newClone);
    });

    it("should update what can be updated and retain the rest", () => {
      const cached = input1[tripId1];
      const newEntityFragment = input2[tripId1];
      const merged = mergeFeedEntities(cached, newEntityFragment);
      expect(merged).to.deep.equal(output[tripId1]);
    });
  });
});
