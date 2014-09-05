/*

  SU API service constructor

*/
var request = require('co-request');
var parallel = require('co-parallel');
var func = require('super-func');
var partial = func.partial;
var iter = require('super-iter');
var reduce = iter.reduce;
var map = iter.map;

function * loadDescriptor (hostname, def) {
  return {
    hostname: hostname,
    version: def.version,
    descriptor: JSON.parse((yield request(def.uri)).body)
  };
}

function reduceVersionsToArray (endpoint, apiVersions) {

  return reduce(apiVersions, function (acc, uri, version) {
    acc.push({
      uri: endpoint + "/" + version,
      version: version
    })
    return acc;
  }, []);
}

function reduceDescriptors (versionDefinitions) {

  return reduce(versionDefinitions, function (acc, definition) {

    var host = acc[definition.hostname] || (acc[definition.hostname] = {});
    var version = host[definition.version] || (host[definition.version] = {});
    reduce(definition.descriptor, function (acc, apiDef) {
      acc[apiDef.id] = apiDef;
      return acc;
    }, version)

    return acc;
  }, Object.create(null));

}

module.exports = function * suApiServer (serviceDefinition) {

  //  grab the api descriptor file
  var apiVersions = JSON.parse((yield request(serviceDefinition.uri)).body);

  //  convert apiVersions to an array as co-parallel won't work with Objects. grrr
  apiVersions = reduceVersionsToArray(serviceDefinition.uri, apiVersions);

  //  create and load a set of parallel requests
  var reqs = yield map(apiVersions, partial(loadDescriptor, serviceDefinition.hostname));

  var descriptors = yield parallel(reqs, reqs.length);

  return reduceDescriptors(descriptors);
}
