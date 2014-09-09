

var cache = new WeakMap;

exports.handler = {

  get: function(receiver, property) {

    var items = cache.get(receiver);

    if (items[property]) {

      return items[property];
    }

    throw new ReferenceError('su-service: property (' + property + ') does not exist');
  },

  set: function(receiver, property) {

    throw new ReferenceError('su-service: cannot set a property on a service.');
  },

  keys: function () {

    console.log(this);

  }
};


exports.cache = cache;
