/*

  SU API service constructor

*/
var request = require('co-request');
var parallel = require('co-parallel');
var Router = require('koa-router');
var func = require('super-func');
var partial = func.partial;
var iter = require('super-iter');
var reduce = iter.reduce;
var map = iter.map;
var copy = require('useful-copy');

var router = new Router();


function * loadDescriptor (service, def) {

  return {
    host: service.host,
    hostname: service.hostname,
    version: def.version,
    descriptor: JSON.parse((yield request(def.uri)).body)
  };
}


function reduceVersionsToArray (endpoint, apiVersions) {

  return reduce(apiVersions, function (acc, uri, version) {
    acc.push({
      uri: endpoint + uri,
      version: version
    });
    return acc;
  }, []);
}


function formatDescriptors (versionDefinitions) {

  return reduce(versionDefinitions, function (acc, definition) {

    var host = acc[definition.hostname] || (acc[definition.hostname] = {});
    var version = host[definition.version] || (host[definition.version] = {});

    reduce(definition.descriptor, function (acc, apiDef) {
      acc[apiDef.id] = createApi(definition.host, apiDef);
      return acc;
    }, version)

    return acc;
  }, Object.create(null));

}


function createApi (host, apiDef) {

  var id = apiDef.version + '-' + apiDef.id;

  router.get(id, apiDef.url, function (){});

  apiDef.url = function (params) {
    return host + router.url(id, params);
  }

  return apiDef;
}


module.exports = function * suApiServer (serviceDefinition) {

  //  grab the api descriptor file
  var apiVersions = JSON.parse((yield request(serviceDefinition.descriptor_uri)).body);

  //  convert apiVersions to an array as co-parallel won't work with Objects. grrr
  apiVersions = reduceVersionsToArray(serviceDefinition.host, apiVersions);

  //  create and load a set of parallel requests
  var reqs = yield map(apiVersions, partial(loadDescriptor, serviceDefinition));

  var descriptors = yield parallel(reqs, reqs.length);

  return formatDescriptors(descriptors);
}
