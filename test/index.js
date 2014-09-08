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

        expect(underTest.services.victoria.stable['train-get']).to.be.a('function');
        expect(underTest.services.victoria.stable['bus-get']).to.be.a('function');
        expect(underTest.services.northern['v0.0.0']['train-get']).to.be.a('function');
        expect(underTest.services.northern['v0.0.0']['bus-get']).to.be.a('function');
        expect(underTest.services.northern['v1.0.0']['train-delay']).to.be.a('function');
        expect(underTest.services.northern['v1.0.0']['train-get']).to.be.a('function');
        expect(underTest.services.northern['v1.0.0']['bus-get']).to.be.a('function');

        done();

      })();
    });

  });


  describe('su-apiserver service fail', function () {

    it('should return 400 bad request', function (done) {

      co(function * () {

        var res = yield underTest.services.victoria.stable['train-get']({});
        expect(res.body.data.message[0]).to.be.equal('TypeError: Invalid number(:platform) specified');
        done();

      })();
    });

    it('should return 500 internal server', function (done) {

      co(function * () {

        var res = yield underTest.services.victoria.stable['train-get']({station: 'train_v010', platform: 3});

        expect(res.statusCode).to.be.equal(500);
        done();

      })();
    });


  });


  describe('su-apiserver service success', function () {

    it('should return 200 success', function (done) {

      co(function * () {

        var res = yield underTest.services.victoria.stable['train-get']({platform: 3});

        expect(res.statusCode).to.be.equal(200);
        done();

      })();
    });

  });



});
