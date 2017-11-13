const moment = require("moment");

const longFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
const shortFormat = "YYYY-MM-DDTHH:mm:ssZ";
const useStrictParsing = true;

const parseTime = str =>
  moment.parseZone(str, [longFormat, shortFormat], useStrictParsing);

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
    const time = moment(scheduled)
      .add(delay, "seconds")
      .unix();

    const journeyStart = parseTime(journeyStartStr);
    let startDate = journeyStart.format("YYYYMMDD");
    let startTime = journeyStart.format("HH:mm:ss");
    // FIXME: The first journey of an operating day starts at 03:09, the last
    //        journey at 28:54. Current Mono message format does not have enough
    //        information to reliably fix this.
    if (journeyStart.hours() < 4) {
      const scheduleDay = journeyStart
        .clone()
        .subtract(1, "days")
        .startOf("day");
      startDate = scheduleDay.format("YYYYMMDD");
      // FIXME: This breaks when DST ends, e.g. at 2017-10-29T03:30:00+02:00.
      startTime = journeyStart.hours() + 24 + journeyStart.format(":mm:ss");
    }

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
