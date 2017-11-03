const http = require("http");
const url = require("url");

const gtfsrt = require("./gtfsrt");

const createServer = (cache, feedMessage) => {
  const httpServer = http.createServer((request, response) => {
    const { query, pathname } = url.parse(request.url, true);
    if (pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.write("Nothing to see here");
      response.end();
    } else if (pathname === "/gtfs-rt/trip-updates/pbf") {
      const obj = gtfsrt.buildFeed(cache);
      const verificationErr = feedMessage.verify(obj);
      if (verificationErr) {
        // FIXME: use in testing
        console.log("verificationErr", verificationErr);
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
