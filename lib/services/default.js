/*

  SU API service constructor

*/
var UNDEF;
var url = require('url');
var request = require('co-request');
var parallel = require('co-parallel');
var Router = require('koa-router');
var pathToRegexp = require('path-to-regexp');
var func = require('super-func');
var partial = func.partial;
var iter = require('super-iter');
var filter = iter.filter;
var reduce = iter.reduce;
var map = iter.map;
var copy = require('useful-copy');

function getParam(param, defaultValue) {
  param = String(param);

  return (param.startsWith('$') ? process.env[param.substring(1)] : param) || defaultValue || UNDEF;
}

function createEndpointConfig(baseHeaders, baseUrl, acc, config) {
  var endpoint = {
         method : config.method || 'GET'
      };

  endpoint.headers = copy.update(config.headers || {}, baseHeaders);

  var type = endpoint.headers['content-type'];

  endpoint.json = !!(typeof type === 'string' && type.indexOf('json') > -1);

  endpoint.url = copy.update(config.url || {}, baseUrl);
  endpoint.url.pathname = baseUrl.pathname + config.url.pathname;

  endpoint.params = [];
  endpoint.regexp = pathToRegexp(endpoint.url.pathname, endpoint.params);

  acc[config.id] = function* callEndpoint(params, query, headers) {
    var head = copy.merge(endpoint.headers);
    var uri = copy.merge(endpoint.url);

    if (headers && typeof headers === 'object') {
      head = copy.update(headers, head);
    }

    if (query && typeof query === 'object') {
      uri.query = copy.update(query, uri.query);
    }

    if (params && typeof params === 'object') {

    }

    process.emit('app:info', module, url.format(uri));

    var res = yield request({
      headers : head,
      json : true,
      method : endpoint.method,
      uri : url.format(uri)
    });

    return res;
  };

  return acc;
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

module.exports = function * defaultService(definition) {
  var baseHeaders = {};
  var baseUrl = {
        hostname : getParam(definition.hostname),
        port : getParam(definition.port),
        protocol : getParam(definition.protocol, 'http:'),
        pathname : getParam(definition.descriptor_uri)
      };

  if (typeof port === 'undefined') {
    delete baseUrl.port;
  }

  if (definition.defaults && typeof definition.defaults === 'object') {
    baseHeaders = copy.merge(baseHeaders, map(definition.defaults.headers, getParam));

    baseUrl.query = map(definition.defaults.query || {}, getParam);
  }

  var endpoints = reduce(definition.endpoints, partial(createEndpointConfig, baseHeaders, baseUrl), {});

  var descriptor = {};

  descriptor[definition.name] = {
    default : endpoints
  };

  return descriptor;
};
