const moment = require("moment");

const longFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
const shortFormat = "YYYY-MM-DDTHH:mm:ssZ";
const useStrictParsing = true;

const parseTime = str =>
  moment.parseZone(str, [longFormat, shortFormat], useStrictParsing);

const formStartDate = str => str.split("-").join("");

const formStartTime = allSeconds => {
  const convert = x => {
    if (x < 10) {
      return `0${x.toString()}`;
    }
    return x.toString();
  };

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
    const delay = Math.round(predicted.diff(scheduled, "seconds", true));
    const time = moment(scheduled)
      .add(delay, "seconds")
      .unix();

    const startDate = formStartDate(p.operatingDay);
    const startTime = formStartTime(p.journeyStartInSecondsIntoOperatingDay);

    // FIXME: The same Mono message cannot contain several predictions for the
    //        same journey. Log a warning if that happens.
    result[pseudoTripId] = {
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
  });
  return result;
};

exports.transformMonoMessage = transformMonoMessage;
