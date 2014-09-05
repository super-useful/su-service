/*

  entry point to create services and batch services

  yield services.hostname[version].apiname({})

  yield batch.name[version]({});

*/
var parallel = require('co-parallel');
var iter = require('super-iter');
var map = iter.map;

var hostProxy = require('./lib/proxy/host');

//  maybe move to require-all()
var serviceTypes = {
  "su-apiserver": require('./lib/services/suApiServer')
};


function * loadService (host) {

  return yield serviceTypes[host.format](host);
}


module.exports = function * index (hosts, batch) {

  var reqs = map(hosts, loadService);

  var services = yield parallel(reqs, reqs.length);

  return {
    services: hostProxy(services)
  };
}
