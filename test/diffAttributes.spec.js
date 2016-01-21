var expect = require('chai').expect;
var AModel = require('./helpers').AModel;

describe('diff attributes', function() {
  var model;
  var tests = [
    {init: {foo: 'bar', alpha: '1'}, set: {foo: 'baz'}, expected: {foo: 'baz'}},
    {init: {alpha: '1'},             set: {foo: 'baz'}, expected: {foo: 'baz'}},
    {init: {alpha: []},              set: {foo: 'baz'}, expected: {foo: 'baz'}},
    {init: {alpha: []},              unset: 'alpha',    expected: {alpha: undefined}},
    {init: {},                       set: {alpha: '1'}, expected: {alpha: '1'}}
  ];

  beforeEach(function() {
    model = new AModel();
  });

  tests.forEach(function(test, i) {
    it('should provide changes since last memento (' + i + ')', function() {
      model.set(test.init);
      model.store();

      if (test.set) {
        model.set(test.set);
      } else if (test.unset) {
        model.unset(test.unset);
      }

      expect(model.changes()).to.deep.equal(test.expected);
    });
  });
});
