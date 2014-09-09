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

var createServices = require('./lib/createServices');
var createBatches = require('./lib/createBatches');


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
  services = createServices(formatServices(services));

  return {
    services: services,
    batch: createBatches(batchConfig, services)
  };
}
