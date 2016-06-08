/* globals define, module, require */

/*!
Backbone.Memento v0.4.2

Copyright (C)2011 Derick Bailey, Muted Solutions, LLC
Distributed Under MIT License

Documentation and Full License Available at:
http://github.com/derickbailey/backbone.memento
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('underscore'), require('backbone'));
  } else {
    root.Backbone.Memento = factory(root._, root.Backbone);
  }
}(this, function (_, Backbone) {
  'use strict';

  // ----------------------------
  // Memento: the public API
  // ----------------------------
  var Memento = function(structure, config) {
    this.version = '0.4.2';

    config = _.extend({ignore: []}, config);

    var serializer = new Serializer(structure, config);
    var mementoStack = new MementoStack(structure, config);

    var restoreState = function (previousState, restoreConfig) {
      if (!previousState) {
        return;
      }
      serializer.deserialize(previousState, restoreConfig);
    };

    this.previousState = function() {
      return mementoStack.previous();
    };

    this.store = function() {
      var currentState = serializer.serialize();
      mementoStack.push(currentState);
    };

    this.restore = function(restoreConfig) {
      var previousState = mementoStack.pop();
      restoreState(previousState, restoreConfig);
    };

    this.restart = function(restoreConfig) {
      var previousState = mementoStack.rewind();
      restoreState(previousState, restoreConfig);
    };

    /**
     * Returns an object with the attributes that have been added or changed
     * since the last memento. Additionally, if an attribute that existed in
     * the last memento is not in the current set, it is also included, but has
     * a value of "undefined".
     *
     * @return {Object}
     */
    this.changes = function() {
      var currentState = serializer.serialize();
      var differ;

      if (mementoStack.size() > 0) {
        differ = new Differ(this.previousState(), currentState);
        return differ.diff();
      }

      return currentState;
    };
  };

  // ----------------------------
  // TypeHelper: a consistent API for removing attributes and
  // restoring attributes, on models and collections
  // ----------------------------
  var TypeHelper = function(structure, config) {
    if (structure instanceof Backbone.Model) {
      this.removeAttr = function(data) {
        structure.unset(data);
      };
      this.restore = function(data) {
        if (config && config.parse === true) {
          structure.set(structure.parse(data));
        } else {
          structure.set(data);
        }
      };
    } else {
      this.removeAttr = function(data) {
        structure.remove(data);
      };
      this.restore = function(data) {
        structure.reset(data);
      };
    }
  };

  // ----------------------------
  // Serializer: serializer and deserialize model and collection state
  // ----------------------------
  var Serializer = function(structure, config) {
    var typeHelper = new TypeHelper(structure, config);

    function dropIgnored(attrs, restoreConfig) {
      attrs = _.clone(attrs);
      if (_.has(restoreConfig, 'ignore') && restoreConfig.ignore.length > 0) {
        for (var index in restoreConfig.ignore) {
          var ignore = restoreConfig.ignore[index];
          delete attrs[ignore];
        }
      }
      return attrs;
    }

    function getAddedAttrDiff(newAttrs, oldAttrs) {
      var removedAttrs = [];

      // guard clause to ensure we have attrs to compare
      if (!newAttrs || !oldAttrs) {
        return removedAttrs;
      }

      // if the attr is found in the old set but not in
      // the new set, then it was remove in the new set
      for (var attr in oldAttrs) {
        if (_.has(oldAttrs, attr) && !_.has(newAttrs, attr)) {
          removedAttrs.push(attr);
        }
      }

      return removedAttrs;
    }

    function removeAttributes(structure, attrsToRemove) {
      for (var index in attrsToRemove) {
        var attr = attrsToRemove[index];
        typeHelper.removeAttr(attr);
      }
    }

    function restoreState(previousState, restoreConfig) {
      var oldAttrs = dropIgnored(previousState, restoreConfig);

      //get the current state
      var currentAttrs = structure.toJSON();
      currentAttrs = dropIgnored(currentAttrs, restoreConfig);

      //handle removing attributes that were added
      var removedAttrs = getAddedAttrDiff(oldAttrs, currentAttrs);
      removeAttributes(structure, removedAttrs);

      typeHelper.restore(oldAttrs);
    }

    this.serialize = function() {
      var attrs = structure.toJSON();
      attrs = dropIgnored(attrs, config);
      return attrs;
    };

    this.deserialize = function(previousState, restoreConfig) {
      restoreConfig = _.extend({}, config, restoreConfig);
      restoreState(previousState, restoreConfig);
    };
  };

  // ----------------------------
  // MementoStack: push / pop model and collection states
  // ----------------------------
  var MementoStack = function(structure, config) {
    var attributeStack;

    function initialize() {
      attributeStack = [];
    }

    this.push = function(attrs) {
      attributeStack.push(attrs);
    };

    this.pop = function(restoreConfig) {
      var oldAttrs = attributeStack.pop();
      return oldAttrs;
    };

    this.rewind = function() {
      var oldAttrs = attributeStack[0];
      initialize();
      return oldAttrs;
    };

    this.previous = function() {
      return attributeStack[attributeStack.length - 1];
    };

    this.size = function() {
      return attributeStack.length;
    };

    initialize();
  };

  var Differ = function(previous, current) {
    this.previous = previous;
    this.current = current;

    this.diff = function() {
      var self = this;
      var merged = _.extend({}, this.previous, this.current);
      var changed = {};

      // first, check for additions and changes
      _.each(this.current, function(value, key) {
        if (!_.isEqual(self.previous[key], value)) {
          changed[key] = value;
        }

        delete merged[key];
      });

      // check for deletions
      _.each(merged, function(value, key) {
        changed[key] = undefined;
      });

      return changed;
    };
  };

  Backbone.Memento = Memento;
  return Memento;

}));
