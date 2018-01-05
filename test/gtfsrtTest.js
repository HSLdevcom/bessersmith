const { expect } = require("chai");
const bunyan = require("bunyan");
const devnull = require("dev-null");

const { createFeedBuilder, getFeedMessage } = require("../src/gtfsrt");

describe("createFeedBuilder", () => {
  const input = [
    {
      id: "4562_1_2017-10-30T14:02:00+02:00",
      tripUpdate: {
        trip: {
          routeId: "4562",
          directionId: 0,
          startTime: "14:02:00",
          startDate: "20171030"
        },
        stopTimeUpdate: [
          {
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
          },
          {
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
          }
        ],
        timestamp: 1509367659
      }
    }
  ];
  const log = bunyan.createLogger({ name: "testing", stream: devnull() });

  it("produces a verifiable feed for one test case", async () => {
    const feedMessage = await getFeedMessage("./gtfs-realtime.proto", log);
    const buildFeed = createFeedBuilder(feedMessage);

    expect(() => buildFeed(input)).to.not.throw();
    const feed = buildFeed(input);
    expect(() => feedMessage.decode(feed)).to.not.throw();
    const decoded = feedMessage.decode(feed);
    expect(feedMessage.verify(decoded)).to.equal(null);
  });
});
