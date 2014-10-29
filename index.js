/*

  entry point to create services and batch services

  yield services.name[version].apiname({})

  yield batch.name[version]({});

*/
var path = require('path');
var parallel = require('co-parallel');

var copy = require('useful-copy');
var iter = require('super-iter');
var map = iter.map;
var reduce = iter.reduce;

var createServices = require('./lib/createServices');
var createBatches = require('./lib/createBatches');

var serviceTypes = require('require-all')(path.join(__dirname, '/lib/services/'));

/*
  load a service factory in the co-parallel style
*/
function * loadService (host) {

  return yield serviceTypes[host.format](host);
}


/*
  map the response from co-parallels array to an object
*/
function formatServices (services) {

  return reduce(services, function (acc, service) {
    return copy(acc, service);
  }, {});
}

/*
  initialise a set of services and batches
*/
module.exports = function * index (hostsConfig, batchConfig) {

  var reqs = map(hostsConfig, loadService);

  var services = yield parallel(reqs, reqs.length);
  services = createServices(formatServices(services));

  return {
    services: services,
    batch: createBatches(batchConfig, services)
  };
}
