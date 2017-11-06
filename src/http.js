const http = require("http");
const url = require("url");

const gtfsrt = require("./gtfsrt");

const createServer = (log, cache, feedMessage) => {
  const httpServer = http.createServer((request, response) => {
    const { query, pathname } = url.parse(request.url, true);
    if (pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.write("Nothing to see here");
      response.end();
    } else if (pathname === "/gtfs-rt/trip-updates/pbf") {
      const obj = gtfsrt.buildFeed(cache);
      // FIXME: Move into tests, do not run in production.
      const verificationErr = feedMessage.verify(obj);
      if (verificationErr) {
        log.error(
          { err: verificationErr },
          "Verifying the input for creating the protobuf message failed"
        );
      }
      const message = feedMessage.create(gtfsrt.buildFeed(cache));
      if (query.debug !== "") {
        response.writeHead(200, { "Content-Type": "application/x-protobuf" });
        response.write(feedMessage.encode(message).finish());
      } else {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.write(
          JSON.stringify(
            feedMessage.decode(feedMessage.encode(message).finish()).toJSON()
          )
        );
      }
      response.end();
    } else if (pathname === "/gtfs-rt/trip-updates/json") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.write(cache.exportJson());
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
