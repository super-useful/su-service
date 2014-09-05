'use strict';
var path = require('path');
var co = require('co');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var rewire = require('rewire');
var suApiserver = require('su-apiserver');

var CONF = require('config');

var server;
var modulePath = 'index';
var versions = require('require-all')(path.join(process.cwd(), '../su-apiserver/test/apis'));
var underTest;

chai.use(sinonChai);

describe(modulePath, function() {


  before(co(function * () {

    server = yield suApiserver(versions);
    underTest = yield require(path.resolve(modulePath))(CONF.hosts, CONF.batch);

  }));


  describe('su-apiserver services', function () {

    it('should create the services defined in the config', function (done) {
      co(function * () {



      })();
    });

  });

});
