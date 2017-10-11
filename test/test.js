const expect = require('chai').expect;

const all = require('../src/all');

describe('pad', function() {
  it('should return "10" for the argument 10', function() {
    expect(all.pad(10)).to.equal("10");
  });
});

describe('parseIsoDatetime', () => {
  const isoString = '2017-10-11T08:52:07.150+03:00';
  it('should parse an ISO 8601 datetime+timezone into Date()', () => {
    expect(all.parseIsoDatetime(isoString)).to.be.a('Date');
  });
  it('should parse an ISO 8601 datetime+timezone into correct values', () => {
    const d = all.parseIsoDatetime(isoString);
    expect(d.getUTCFullYear()).to.equal(2017);
    expect(d.getUTCMonth()).to.equal(10 - 1);
    expect(d.getUTCDate()).to.equal(11);
    expect(d.getUTCHours()).to.equal(5);
    expect(d.getUTCMinutes()).to.equal(52);
    expect(d.getUTCSeconds()).to.equal(7);
    expect(d.getUTCMilliseconds()).to.equal(150);
  });
});
