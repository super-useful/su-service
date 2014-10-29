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

    it('should pass query params correctly', function (done) {

      co(function * () {

        var res = yield underTest.services.victoria.stable['train-get']({platform: 3}, {notDefined: 'woop', steam: 'please'});
        expect(res.body.query.steam).to.be.equal('please');
        expect(res.body.query.notDefined).to.be.undefined;
        done();

      })();
    });

    it('should pass headers correctly', function (done) {

      co(function * () {

        var res = yield underTest.services.victoria.stable['train-get']({platform: 3}, null, {'X-CSRF-Token': '0123456789'});
        expect(res.request.headers['X-CSRF-Token']).to.be.equal('0123456789');
        done();

      })();
    });


  });

  describe('su-apiserver batch initialsation', function () {

    it('should throw an error on initialisation if the config specifies unknown hosts', function (done) {

      co(function * () {

        CONF.batch.all.does_not_exist = {};

        var err;

        try {

          underTest = yield require(path.resolve(modulePath))(CONF.hosts, CONF.batch);
        }
        catch (e) {
          err = e;
        }

        expect(err).to.be.instanceOf(Error);

        done();

      })();
    });

    it('should throw an error on initialisation if the config specifies unknown apis', function (done) {

      co(function * () {

        CONF.batch.all.victoria.does_not_exist = {};

        var err;

        try {

          underTest = yield require(path.resolve(modulePath))(CONF.hosts, CONF.batch);
        }
        catch (e) {
          err = e;
        }

        expect(err).to.be.instanceOf(Error);

        done();

      })();
    });

  });

  describe('su-apiserver batch', function () {

    it('should create the batch services defined in the config', function (done) {

      co(function * () {

        expect(underTest.batch.all.stable).to.be.a('function');
        expect(underTest.batch.get_only.stable).to.be.a('function');
        expect(underTest.batch.delay_only.stable).to.be.a('function');
        expect(underTest.batch.all['v0.1.0']).to.be.a('function');
        expect(underTest.batch.get_only['v0.1.0']).to.be.a('function');
        expect(underTest.batch.delay_only['v0.1.0']).to.be.a('function');

        done();

      })();
    });

  });


  describe('su-apiserver batch success', function () {

    it('should return all service responses attached to the correct key', function (done) {

      co(function * () {

        var res = yield underTest.batch.all.stable({station: 'brixton', platform: 3}, {notDefined: 'woop', steam: 'please'});

        expect(res['bus']).to.be.deep.equal({
          data: {
            onTime: true,
            platform: 3,
            station: 'brixton',
            message: 'platformChange'
          },
          status: {httpStatus: 200, success: true},
          links: {},
          release: 'stable',
          version: 'v0.1.0',
          params: {station: 'brixton', platform: 3},
          query: {}
        });

        expect(res['train']).to.be.deep.equal({
          data: {
            onTime: true,
            platform: 3,
            station: 'brixton',
            message: 'platformChange'
          },
          status: {httpStatus: 200, success: true},
          links: {},
          release: 'stable',
          version: 'v0.1.0',
          params: {station: 'brixton', platform: 3},
          query: {
            steam: 'please'
          }
        });

        expect(res['train_delay']).to.be.deep.equal({
          data: {
            onTime: true
          },
          status: {httpStatus: 200, success: true},
          links: {},
          release: 'stable',
          version: 'v0.1.0',
          params: {},
          query: {
            steam: 'please'
          }
        });

        done();

      })();
    });


  });


});
