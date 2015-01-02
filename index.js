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
  if (host.format in serviceTypes) {
    return yield serviceTypes[host.format](host);
  }
  else if (Array.isArray(host.endpoints)) {
    return yield serviceTypes.default(host);
  }
  else {
    throw new Error('su-service#loadService no services found to load.')
  }
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

  var api = {
    services: services,
    batch: createBatches(batchConfig, services)
  };

  return api;
};
