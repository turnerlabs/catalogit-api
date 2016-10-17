"use strict";

/*global beforeEach, describe, it */

const expect = require('chai').expect,
    request = require('supertest');
    
let server = require('../server.js'),
    helpers = require("../restit/lib/restHelpers.js"),
    packageJson = require('../package.json');

/*
 * Mixing the use of arrow functions because Mocha can't use them,
 * but I like them, so using them where I can.
 * http://mochajs.org/#arrow-functions
 */

describe('Health check', function () {
    it('should return successfully', function (done) {
        request(server)
            .get('/hc')
            .expect('Content-Type', /json/)
            .expect(200, {
              version: packageJson.version
            }, done);
    });
});

var expectTrue = (a) => expect(a).to.equal(true);
var expectFalse = (a) => expect(a).to.equal(false);

describe('generateToken', () => {
    it('should generate a random token of length 50 by default',() => {
        var token = helpers.generateToken();
        expect(typeof token).to.equal("string");
        expect(token.length).to.equal(50);
    });

    it('should generate a random token of length 100',() => {
        var token = helpers.generateToken(100);
        expect(typeof token).to.equal("string");
        expect(token.length).to.equal(100);
    });
});


describe('isString', () => {

    it('should return true if string is passed in', () => helpers.isString(expectTrue, 'token'));
    it('should return false for undefined', () => helpers.isString(expectFalse));
    it('should return false for boolean', () => helpers.isString(expectFalse, true));
    it('should return false for Number', () => helpers.isString(expectFalse, 100));
    it('should return false for Array', () => helpers.isString(expectFalse, []));
    it('should return false for Function', () => helpers.isString(expectFalse, () => true));
    it('should return false for Object', () => helpers.isString(expectFalse, {}));
});


describe('isValidDockerLink', () => {
    it('should return false for invalid links', () => helpers.isValidDockerLink(expectTrue, 'foo'));
    it('should return false for invalid links', () => helpers.isValidDockerLink(expectFalse, ':foo'));
    it('should return false for invalid links', () => helpers.isValidDockerLink(expectFalse, 'foo_bar:0.1.1'));
    it('should return false for invalid links', () => helpers.isValidDockerLink(expectTrue, 'foo-bar:0.1.1'));
    it('should return false for invalid links', () => helpers.isValidDockerLink(expectTrue, 'garbage/foo-bar:0.1.1'));
    it('should return false for invalid links', () => helpers.isValidDockerLink(expectTrue, 'garbage.io/garbage/foo-bar:0.1.1'));
});
