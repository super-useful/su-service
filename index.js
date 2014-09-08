/*

  entry point to create services and batch services

  yield services.hostname[version].apiname({})

  yield batch.name[version]({});

*/
var parallel = require('co-parallel');

var copy = require('useful-copy');
var iter = require('super-iter');
var map = iter.map;
var reduce = iter.reduce;

var hostProxy = require('./lib/proxy/host');

//  maybe move to require-all()
var serviceTypes = {
  "su-apiserver": require('./lib/services/suApiServer')
};


function * loadService (host) {

  return yield serviceTypes[host.format](host);
}


function formatServices (services) {

  return reduce(services, function (acc, service) {
    return copy(acc, service);
  }, {});

}


module.exports = function * index (hostsConfig, batchConfig) {

  var reqs = map(hostsConfig, loadService);

  var services = yield parallel(reqs, reqs.length);
  var serviceProxies = hostProxy(formatServices(services));

  return {
    services: serviceProxies,
    batch: hostBatch(batchConfig, serviceProxies)
  };
}
