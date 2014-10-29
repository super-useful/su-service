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

function getParam(param) {
  param = String(param);

  return param.startsWith('$') ? process.env[param.substring(1)] : param;
}

function * loadDescriptor (service, def) {
  return {
    name: service.name,
    hostname: getParam(service.hostname),
    port: getParam(service.port),
    protocol: service.protocol,
    version: def.version,
    router: def.router,
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
      version: version,
      router: new Router()
    });
    return acc;
  }, []);
}


function formatDescriptors (versionDefinitions) {

  return reduce(versionDefinitions, function (acc, definition) {

    var service = acc[definition.name] || (acc[definition.name] = {});
    var version = service[definition.version] || (service[definition.version] = {});

    reduce(definition.descriptor, function (acc, apiDef) {
      acc[apiDef.id] = createApi(definition.protocol, getParam(definition.hostname) + (getParam(definition.port) ? ':' + getParam(definition.port) : ''), apiDef, definition.router);
      return acc;
    }, version);

    return acc;
  }, Object.create(null));

}


function filterQuery (apiDef, value, prop) {
  return !!apiDef.query[prop];
}

function createApi (protocol, host, apiDef, router) {

  var id = apiDef.version + '-' + apiDef.id;

  router.get(id, apiDef.url, function (){});

  apiDef.url = function (params, query) {
    return url.format({
      protocol: protocol,
      host: host,
      pathname: router.url(id, params || {}),
      query: filter(query || {}, partial(filterQuery, apiDef))
    });
  }

  return apiDef;
}


module.exports = function * suApiServer (definition) {
  var host = getParam(definition.hostname) + (getParam(definition.port) ? ':' + getParam(definition.port) : '');

  //  grab the api descriptor file
  var descriptor_uri = url.format({
    protocol: definition.protocol,
    host: host,
    pathname: definition.descriptor_uri
  });
  var apiVersions = JSON.parse((yield request(descriptor_uri)).body);

  //  convert apiVersions to an array as co-parallel won't work with Objects. grrr
  apiVersions = reduceVersionsToArray(definition.protocol, host, apiVersions);

  //  create and load a set of parallel requests
  var reqs = yield map(apiVersions, partial(loadDescriptor, definition));

  var descriptors = yield parallel(reqs, reqs.length);

  return formatDescriptors(descriptors);
}
