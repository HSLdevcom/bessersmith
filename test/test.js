const expect = require('chai').expect;

const all = require('../src/all');

describe('pad', function() {
  it('should return "10" for the argument 10', function() {
    expect(all.pad(10)).to.equal("10");
  });
});
