var expect = require('chai').expect;
var AModel = require('./helpers').AModel;

describe("memento", function(){
  beforeEach(function(){
    this.model = new AModel();
  });

  describe("when mementoing a model and then rolling it back", function(){
    beforeEach(function(){
      this.model.set({foo: "bar"});
      this.model.store();
    });

    it("should reset the model to the memento'd attributes", function(){
      this.model.set({foo: "what?"});
      this.model.restore();
      expect(this.model.get("foo")).to.equal("bar");
    });
  });

  describe("when restoring and no mementos exist", function(){
    beforeEach(function(){
      this.model.set({foo: "bar"});
      this.model.restore();
    });

    it("should not restore anything", function(){
      expect(this.model.get("foo")).to.equal("bar");
    });
  });

  describe("when mementoing once and restoring twice", function(){
    beforeEach(function(){
      this.model.set({foo: "bar"});
      this.model.store();
    });

    it("should not restore anything past the first one", function(){
      this.model.restore();
      this.model.restore();
      expect(this.model.get("foo")).to.equal("bar");
    });
  });

  describe("when mementoing twice and rolling back once", function(){
    beforeEach(function(){
      this.model.set({foo: "bar"});
      this.model.store();
      this.model.set({foo: "i dont know"});
      this.model.store();
      this.model.set({foo: "third"});
    });

    it("should reset to the previous stored version", function(){
      this.model.restore();
      expect(this.model.get("foo")).to.equal("i dont know");
    });
  });

  describe("when adding a new attributes and then restoring previous version", function(){
    beforeEach(function(){
      this.model.set({foo: "bar"});
      this.model.store();
      this.model.set({bar: "baz"});
    });

    it("should remove the new attribute", function(){
      this.model.restore();
      expect(this.model.get("bar")).to.be.undefined;
    });

    it("should fire a change event for the removed attribute", function(){
      changed = false;
      this.model.bind("change:bar", function(){
        changed = true;
      });
      this.model.restore();
      expect(changed).to.be.ok;
    });
  });

  describe("when mementoing a model", function() {
    it("should get all attributes when querying previous state", function() {
      this.model.set({foo: "bar"});
      this.model.store();
      this.model.set({bar: "baz"});
      this.model.store();
      expect(this.model.previousState()).to.deep.equal({
        foo: "bar",
        bar: "baz"
      });
    });

    it("should provide attributes changes since last memento", function() {
      this.model.set({foo: "bar", alpha: "1"});
      this.model.store();
      this.model.set({foo: "baz"});
      expect(this.model.changes()).to.deep.equal({foo: "baz"});
    });

    it("should provide attributes changes since last memento (2)", function() {
      this.model.set({alpha: "1"});
      this.model.store();
      this.model.set({foo: "baz"});
      expect(this.model.changes()).to.deep.equal({foo: "baz"});
    });
  });
});
