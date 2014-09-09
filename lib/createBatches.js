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


function * loadService (params, service) {

  var data = (yield service.api(params));

  return {
    data: data.body,
    id: service.id
  };
}

function formatResponse (data) {

  return reduce(data, function (acc, service) {
    acc[service.id] = service.data
    return acc;
  }, {});
}


function createBatch (services, apis) {

  //  convert services to an array as co-parallel won't work with Objects. grrr
  var batchServices = reduce(services, function (acc, service, id) {
    if (apis.indexOf(id) >=0) {
      acc.push({
        id: id,
        api: service
      });
    }
    return acc;
  }, []);

  return function * (params) {

    var reqs = yield map(batchServices, partial(loadService, params));
    var batches = yield parallel(reqs, reqs.length);

    return formatResponse(batches);
  }
}

module.exports = function createBatches (batchConfig, services) {

  var batches = map(batchConfig, function (hosts, batchName) {

    return reduce(hosts, function (acc, apis, host) {

      forEach(services[host], function (services, version) {
        if (!acc[version]) {
          acc[version] = createBatch(services, apis);
        }

      });

      return acc;
    }, Object.create(null));

  });

  Object.freeze(batches);

  return batches;

}
