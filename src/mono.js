const moment = require("moment");

const longFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
const shortFormat = "YYYY-MM-DDTHH:mm:ssZ";
const useStrictParsing = true;

const parseTime = str => {
  let m = moment(str, longFormat, useStrictParsing);
  if (!m.isValid()) {
    m = moment(str, shortFormat, useStrictParsing);
  }
  return m;
};

const transformMonoMessage = message => {
  const parsed = JSON.parse(message);
  const result = {};
  parsed.predictions.forEach(p => {
    const routeId = p.joreLineId;
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

    const journeyStart = parseTime(journeyStartStr);
    const startDate = journeyStart.format("YYYYMMDD");
    const startTime = journeyStart.format("HH:mm:ss");

    // FIXME: The same Mono message cannot contain several predictions for the
    //        same journey. Log a warning if that happens.
    result[pseudoTripId] = {
      id: pseudoTripId,
      tripUpdate: {
        trip: {
          routeId,
          directionId,
          startDate,
          startTime
        },
        stopTimeUpdate: [
          {
            stopSequence,
            stopId,
            departure: {
              delay
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
