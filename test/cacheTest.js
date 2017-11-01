const { expect } = require("chai");
const _ = require("lodash");
const lolex = require("lolex");

const { createCache, updateCache } = require("../src/cache");

describe("cache", () => {
  const tripId1 = "4562_1_2017-10-30T14:02:00+02:00";
  const tripId2 = "4562_1_2017-10-30T14:12:00+02:00";
  const input1 = {
    [tripId1]: {
      id: tripId1,
      tripUpdate: {
        trip: {
          routeId: "4562",
          directionId: 0,
          startTime: "14:02:00",
          startDate: "20171030"
        },
        stopTimeUpdate: [
          {
            stopSequence: 46,
            stopId: "4520260",
            departure: {
              delay: -21
            }
          }
        ],
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
            departure: {
              delay: -142
            }
          }
        ],
        timestamp: 1509367654
      }
    }
  };
  const input2 = {
    [tripId1]: {
      id: tripId1,
      tripUpdate: {
        trip: {
          routeId: "4562",
          directionId: 0,
          startTime: "14:02:00",
          startDate: "20171030"
        },
        stopTimeUpdate: [
          {
            stopSequence: 46,
            stopId: "4520260",
            departure: {
              delay: -20
            }
          }
        ],
        timestamp: 1509367659
      }
    }
  };
  const output = {
    [tripId1]: input2[tripId1],
    [tripId2]: input1[tripId2]
  };

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
      expect(cache.get(tripId1).timestamp).to.equal(input1[tripId1].timestamp);
      updateCache(cache, input2);
      expect(cache.get(tripId1).timestamp).to.equal(output[tripId1].timestamp);
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
});
