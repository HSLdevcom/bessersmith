const _ = require("lodash");
const moment = require("moment");

const longFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
const shortFormat = "YYYY-MM-DDTHH:mm:ssZ";
const useStrictParsing = true;

const parseTime = str =>
  moment.parseZone(str, [longFormat, shortFormat], useStrictParsing);

const formStartDate = str => str.split("-").join("");

const formStartTime = allSeconds => {
  const convert = x => _.padStart(x, 2, "0");

  const hours = Math.floor(allSeconds / 3600);
  const minutes = Math.floor(allSeconds / 60) - 60 * hours;
  const seconds = allSeconds - 3600 * hours - 60 * minutes;

  return `${convert(hours)}:${convert(minutes)}:${convert(seconds)}`;
};

const routeIdRegExp = /^.{4}[a-zA-Z]*/;

const transformMonoMessage = (log, message) => {
  let parsed = {};
  try {
    parsed = JSON.parse(message);
  } catch (err) {
    log.warn({ message }, "Received a non-valid JSON message");
    return {};
  }
  const result = {};
  parsed.predictions.forEach(p => {
    const match = p.joreLineId.match(routeIdRegExp);
    if (match === null) {
      log.warn({ parsed }, "joreLineId has an unexpected form");
      // "continue" for forEach
      return;
    }
    const [routeId] = match;
    const directionStr = p.joreLineDirection;
    const journeyStartStr = p.journeyStartTime;
    const pseudoTripId = `${routeId}_${directionStr}_${journeyStartStr}`;

    // Jore direction differs from GTFS direction by one.
    const directionId = parseInt(directionStr, 10) - 1;

    const stopSequence = parseInt(p.stopOrderInJourney, 10);
    const stopId = p.joreStopId;
    const timestamp = parseTime(parsed.messageTimestamp).unix();

    const scheduled = parseTime(p.scheduledDepartureTime);
    const predicted = parseTime(p.predictedDepartureTime);
    const time = Math.round(predicted.valueOf() / 1000);
    const delay = time - Math.round(scheduled.valueOf() / 1000);

    const startDate = formStartDate(p.operatingDay);
    const startTime = formStartTime(p.journeyStartInSecondsIntoOperatingDay);

    const entity = {
      id: pseudoTripId,
      tripUpdate: {
        trip: {
          routeId,
          directionId,
          startTime,
          startDate
        },
        stopTimeUpdate: [
          {
            stopSequence,
            stopId,
            arrival: {
              delay,
              time
            },
            departure: {
              delay,
              time
            }
          }
        ],
        timestamp
      }
    };

    /**
     * The same stop might be visited several times within the same journey.
     * Several of those visits may get a prediction in the same message. That is
     * quite abnormal, though.
     */
    if (_.has(result, pseudoTripId)) {
      const prevEntity = result[pseudoTripId];
      prevEntity.tripUpdate.stopTimeUpdate = entity.tripUpdate.stopTimeUpdate.concat(
        prevEntity.tripUpdate.stopTimeUpdate
      );
    } else {
      result[pseudoTripId] = entity;
    }
  });
  return result;
};

exports.transformMonoMessage = transformMonoMessage;
