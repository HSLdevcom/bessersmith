const http = require("http");
const url = require("url");

const mqtt = require("mqtt");
const moment = require("moment");
const protobuf = require("protobufjs");

const _ = require("lodash");

const convertISOStringToUnixSeconds = datetime =>
  moment(datetime, "YYYY-MM-DDTHH:mm:ss.SSSZZ").unix();

function buildFeed(trips) {
  const tripIds = _.sortBy(Object.keys(trips));
  const tripUpdates = tripIds.map(tripId => {
    const trip = trips[tripId];
    const routeId = tripId.split(/_/g)[0];
    const directionId = tripId.split(/_/g)[1];
    const start = tripId.split(/_/g)[2];

    return {
      id: tripId,
      tripUpdate: {
        trip: {
          routeId,
          directionId: Number(directionId) - 1,
          startTime: start.split("T")[1].split("+")[0],
          startDate: start.split("T")[0].replace(/-/g, "")
        },
        stopTimeUpdate: _.sortBy(
          Object.keys(trips[tripId]).map(stopId => {
            const stoptime = trip[stopId];
            const delay = stoptime.predicted - stoptime.scheduled;
            return {
              stopId,
              arrival: { time: stoptime.predicted, delay },
              departure: { time: stoptime.predicted, delay }
            };
          }),
          "departure.time"
        )
      }
    };
  });

  return {
    header: {
      gtfsRealtimeVersion: "1.0",
      timestamp: moment().unix()
    },
    entity: tripUpdates
  };
}

const createServer = () => {
  const trips = {};

  const mqttConnection = mqtt.connect("mqtt://mqtt.hsl.fi");

  mqttConnection.subscribe("mono/#", () => {
    // console.log(arguments);
  });
  mqttConnection.on("message", (topic, message) => {
    const msgdata = JSON.parse(message);
    for (
      let i = 0;
      i < ((msgdata.predictions && msgdata.predictions.length) || 0);
      i += 1
    ) {
      const data = msgdata.predictions[i];
      const trip = `${data.joreLineId}_${data.joreLineDirection}_${data.journeyStartTime}`; // XXX variants
      const stop = data.joreStopId;
      if (!trips[trip]) trips[trip] = {};
      trips[trip][data.joreStopId] = {
        stop,
        scheduled: convertISOStringToUnixSeconds(data.scheduledDepartureTime),
        predicted: convertISOStringToUnixSeconds(data.predictedDepartureTime)
      };
      Object.keys(trips[trip]).map(key => trips[trip][key]);
    }
  });

  const httpServer = http.createServer((request, response) => {
    // console.log(`${request.method} ${request.url}`);
    const { query, pathname } = url.parse(request.url, true);
    if (pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.write("Nothing to see here");
      response.end();
    } else if (pathname === "/gtfs-rt/trip-updates/pbf") {
      const payload = buildFeed(trips);
      protobuf.load("gtfs-realtime.proto", (err, root) => {
        if (err) throw err;
        const FeedMessage = root.lookupType("transit_realtime.FeedMessage");
        const errMsg = FeedMessage.verify(payload);
        if (errMsg) throw errMsg;
        const message = FeedMessage.create(payload);
        if (query.debug !== "") {
          response.writeHead(200, { "Content-Type": "application/x-protobuf" });
          response.write(FeedMessage.encode(message).finish());
        } else {
          response.writeHead(200, { "Content-Type": "text/plain" });
          response.write(
            JSON.stringify(
              FeedMessage.decode(FeedMessage.encode(message).finish()).toJSON()
            )
          );
        }
        response.end();
      });
    } else if (pathname === "/gtfs-rt/trip-updates/json") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.write(JSON.stringify(buildFeed(trips)));
      response.end();
    } else {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.write(`Not found: ${request.url}`);
      response.end();
    }
  });
  return httpServer;
};

exports.createServer = createServer;
exports.convertISOStringToUnixSeconds = convertISOStringToUnixSeconds;
