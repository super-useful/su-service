/*

  proxy to pass through version level services

*/
var iter = require('super-iter');
var map = iter.map;

var receiver = require('./receiver');


function createBatch (batchDefinition, version) {

  // console.log()

  return batchDefinition;

  // console.log(version);

}


module.exports = function (batchDefinitions) {

  var proxy = Proxy.create(receiver.handler);

  receiver.cache.set(proxy, map(batchDefinitions, createBatch));

  return proxy;
};
