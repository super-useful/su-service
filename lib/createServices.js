/*

  service creation

*/
var iter = require('super-iter');
var forEach = iter.forEach;
var map = iter.map;
var request = require('co-request');


/*
  creates a generator function that calls a specific API
*/
function createApi (api) {
  if (typeof api === 'function') {
    return api;
  }

  return function * (params, query, headers) {
    return yield request({
      url: api.url(params, query),
      method: api.method.toUpperCase(),
      json: api.type === 'json' ? true : false,
      headers: headers
    });
  }
}

/*
  initialises a set of services
*/
module.exports = function createServices (hosts) {

  var services = map(hosts, function (versions, host) {

    return map(versions, function (apis, version) {

      return map(apis, createApi);
    });
  });

  Object.freeze(services);

  return services;

};
