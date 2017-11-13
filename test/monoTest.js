const { expect } = require("chai");
const bunyan = require("bunyan");
const devnull = require("dev-null");
const moment = require("moment");

const mono = require("../src/mono");

describe("transformMonoMessage", () => {
  const log = bunyan.createLogger({ name: "testing", stream: devnull() });
  const monoMessage =
    '{"predictions": [{"stopOrderInJourney": 46, "operatingDay": "2017-10-30", "journeyStartInSecondsIntoOperatingDay": 50520, "joreLineId": "4562", "scheduledDepartureTime": "2017-10-30T14:49:00+02:00", "joreStopId": "4520260", "predictedDepartureTime": "2017-10-30T14:48:38.897+02:00", "journeyStartTime": "2017-10-30T14:02:00+02:00", "joreLineDirection": "1"}, {"stopOrderInJourney": 46, "operatingDay": "2017-10-30", "journeyStartInSecondsIntoOperatingDay": 51120, "joreLineId": "4562", "scheduledDepartureTime": "2017-10-30T14:59:00+02:00", "joreStopId": "4520260", "predictedDepartureTime": "2017-10-30T14:56:38.327+02:00", "journeyStartTime": "2017-10-30T14:12:00+02:00", "joreLineDirection": "1"}], "messageTimestamp": "2017-10-30T12:47:34.406+00:00"}';
  const tripId1 = "4562_1_2017-10-30T14:02:00+02:00";
  const tripId2 = "4562_1_2017-10-30T14:12:00+02:00";
  const result = {
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
            arrival: {
              delay: -21,
              time: 1509367719
            },
            departure: {
              delay: -21,
              time: 1509367719
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
          startTime: "14:12:00",
          startDate: "20171030"
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

  it("should return {} on non-valid JSON", () => {
    // FIXME: Test that the log is written to.
    expect(mono.transformMonoMessage(log, "foo")).to.deep.equal({});
  });

  it("should return the expected result for a realistic Mono message", () => {
    expect(mono.transformMonoMessage(log, monoMessage)).to.deep.equal(result);
  });

  it("should return consistent delay and time", () => {
    const shortFormat = "YYYY-MM-DDTHH:mm:ssZ";
    const useStrictParsing = true;
    const messages = mono.transformMonoMessage(log, monoMessage);
    const doTest = (tripId, scheduledString) => {
      const update = messages[tripId].tripUpdate.stopTimeUpdate[0];
      const scheduled = moment
        .parseZone(scheduledString, shortFormat, useStrictParsing)
        .unix();
      expect(update.arrival.time - update.arrival.delay).to.equal(scheduled);
      expect(update.departure.time - update.departure.delay).to.equal(
        scheduled
      );
    };
    doTest(tripId1, "2017-10-30T14:49:00+02:00");
    doTest(tripId2, "2017-10-30T14:59:00+02:00");
  });
});
