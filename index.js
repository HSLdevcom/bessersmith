const all = require("./src/all");

const main = () => {
  const httpServer = all.createServer();
  httpServer.listen(9009);
};

if (require.main === module) {
  main();
}
