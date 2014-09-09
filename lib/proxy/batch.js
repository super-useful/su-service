/*

  proxy to pass through batch

*/
var func = require('super-func');
var partial = func.partial;
var iter = require('super-iter');
var map = iter.map;
var batchVersionProxy = require('./batchVersion');

var receiver = require('./receiver');


function mapServicesToBatch (services, batchDefinition, batchName) {

  return batchVersionProxy(map(batchDefinition, function (apis, host) {

    return {
      apis: apis,
      services: services[host]
    };
  }));
}


module.exports = function (batch, services) {

  var proxy = Proxy.create(receiver.handler);

  console.log(Object.keys(proxy));

  receiver.cache.set(proxy, map(batch, partial(mapServicesToBatch, services)));

  return proxy;
};
