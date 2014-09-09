/*

  service creation

*/
var iter = require('super-iter');
var forEach = iter.forEach;
var map = iter.map;
var reduce = iter.reduce;
var func = require('super-func');
var partial = func.partial;
var copy = require('useful-copy');

var parallel = require('co-parallel');


/*
  load a service in the co-parallel style
*/
function * loadService (params, service) {

  var data = (yield service.api(params));

  return {
    data: data.body,
    id: service.id
  };
}


/*
  map the response from co-parallels array to an object
*/
function formatBatchResponse (data) {

  return reduce(data, function (acc, service) {
    acc[service.id] = service.data
    return acc;
  }, {});
}


/*
  creates a generator function that calls only the relevant services
*/
function createBatch (batchName, host, services, batchApis) {

  //  create an array of services as co-parallel won't work with Objects. grrr
  //  ignore ones not specified in the batchApis array
  var batchServices = reduce(batchApis, function (acc, id) {
    if (services[id]) {
      acc.push({
        id: id,
        api: services[id]
      });
    }
    else {
      throw new Error('Service (' + id + ') specified in CONF.batch.' + batchName + '.' + host + ' does not exist in service');
    }
    return acc;
  }, []);

  return function * (params) {

    var reqs = yield map(batchServices, partial(loadService, params));
    var batches = yield parallel(reqs, reqs.length);

    return formatBatchResponse(batches);
  }
}

//  initialises the batch services
module.exports = function createBatches (batchConfig, services) {

  var batches = map(batchConfig, function (hosts, batchName) {

    return reduce(hosts, function (acc, apis, host) {

      if (!services[host]) {
        throw new Error('Host (' + host + ') specified in CONF.batch.' + batchName + ' is not a valid service host');
      }

      forEach(services[host], function (services, version) {

        if (!acc[version]) {
          acc[version] = createBatch(batchName, host, services, apis);
        }
      });

      return acc;
    }, Object.create(null));

  });

  Object.freeze(batches);

  return batches;

}
