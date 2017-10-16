const { expect } = require("chai");

const all = require("../src/all");

describe("convertISOStringToUnixSeconds", () => {
  const isoString = "2017-10-11T08:52:07.150+03:00";
  const unixSeconds = 1507701127;
  it("should parse an ISO 8601 datetime+timezone into unix seconds", () => {
    expect(all.convertISOStringToUnixSeconds(isoString))
      .to.be.a("Number")
      .and.to.equal(unixSeconds);
  });
});
