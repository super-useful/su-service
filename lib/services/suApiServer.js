/*

  SU API service constructor

*/
var url = require('url');
var request = require('co-request');
var parallel = require('co-parallel');
var Router = require('koa-router');
var func = require('super-func');
var partial = func.partial;
var iter = require('super-iter');
var filter = iter.filter;
var reduce = iter.reduce;
var map = iter.map;
var copy = require('useful-copy');

var router = new Router();


function * loadDescriptor (service, def) {

  return {
    hostname: service.hostname,
    host: service.host,
    protocol: service.protocol,
    version: def.version,
    descriptor: JSON.parse((yield request(def.uri)).body)
  };
}

//  convert apiVersions to an array as co-parallel won't work with Objects. grrr
function reduceVersionsToArray (protocol, host, apiVersions) {

  return reduce(apiVersions, function (acc, uri, version) {
    acc.push({
      uri: url.format({
        protocol: protocol,
        host: host,
        pathname: uri
      }),
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
      acc[apiDef.id] = createApi(definition.protocol, definition.host, apiDef);
      return acc;
    }, version)

    return acc;
  }, Object.create(null));

}


function filterQuery (apiDef, query) {

  return filter(query, function (value, prop) {
    return !!apiDef.query[prop]
  });
}


function createApi (protocol, host, apiDef) {

  var id = apiDef.version + '-' + apiDef.id;

  router.get(id, apiDef.url, function (){});

  apiDef.url = function (params, query) {

    return url.format({
      protocol: protocol,
      host: host,
      pathname: router.url(id, params),
      query: query ? filterQuery(apiDef, query) : {}
    });
  }

  return apiDef;
}


module.exports = function * suApiServer (serviceDefinition) {

  //  grab the api descriptor file
  var descriptor_uri = url.format({
    protocol: serviceDefinition.protocol,
    host: serviceDefinition.host,
    pathname: serviceDefinition.descriptor_uri
  });
  var apiVersions = JSON.parse((yield request(descriptor_uri)).body);

  //  convert apiVersions to an array as co-parallel won't work with Objects. grrr
  apiVersions = reduceVersionsToArray(serviceDefinition.protocol, serviceDefinition.host, apiVersions);

  //  create and load a set of parallel requests
  var reqs = yield map(apiVersions, partial(loadDescriptor, serviceDefinition));

  var descriptors = yield parallel(reqs, reqs.length);

  return formatDescriptors(descriptors);
}
