/**
 * Notification module unit tests.
 *
 * @module tests-notify
 * @copyright 2014, Digium, Inc.
 * @license Apache License, Version 2.0
 * @author Samuel Fortier-Galarneau <sgalarneau@digium.com>
 */

'use strict';

/*global describe:false*/
/*global beforeEach:false*/
/*global afterEach:false*/
/*global it:false*/

var mockery = require('mockery');
var Q = require('q');
var assert = require('assert');

var mockClient;
var notifier;
// used to keep track of whether MWI update has been called yet
var mwiUpdated = false;
// used to keep track of read/unread counts sent to MWI update
var oldMessages;
var newMessages;
// milliseconds to delay async ops for mock requests
var asyncDelay = 100;
var mockeryOpts = {
  warnOnReplace: false,
  warnOnUnregistered: false,
  useCleanCache: true
};


/**
 * Returns a mock client.
 */
var getMockClient = function() {

  if (mockClient) {
    return mockClient;
  }

  mockClient = {
    mailboxes: {
      update: function(opts, cb) {
        setTimeout(function() {
          mwiUpdated = true;
          oldMessages = opts.oldMessages;
          newMessages = opts.newMessages;
          cb(null);
        }, asyncDelay);
      }
    }
  };

  return mockClient;
};

/**
 * Returns a mock config for testing.
 */
var getMockConfig = function() {
  var ariConfig = {
    url: 'http://localhost:8088',
    username: 'asterisk',
    password: 'asterisk',
    applicationName: 'test'
  };

  return {
    getAppConfig: function() {
      return {
        ari: ariConfig
      };
    }
  };
};

/**
 * Returns a mock dal for testing.
 */
var getMockDal = function() {
  return {
    mailbox: {
      newMessage: function(mailbox, updater) {
        setTimeout(function() {
          updater(mailbox.read, mailbox.unread + 1);
        }, asyncDelay);
      },

      readMessage: function(mailbox, updater) {
        setTimeout(function() {
          updater(mailbox.read + 1, mailbox.unread - 1);
        }, asyncDelay);
      },

      deletedMessage: function(mailbox, read, updater) {
        setTimeout(function() {
          var readCount = (read) ? mailbox.read - 1: mailbox.read;
          var unreadCount = (!read) ? mailbox.unread - 1: mailbox.unread;
          updater(readCount, unreadCount);
        }, asyncDelay);
      }
    }
  };
};

describe('mailbox', function() {

  beforeEach(function(done) {
    mockery.enable(mockeryOpts);

    var clientMock = {
      getClient: function(config, appName) {
        var deferred = Q.defer();

        if (config.url && config.username &&
            config.password && appName) {
          deferred.resolve(getMockClient());
        }

        return deferred.promise;
      }
    };
    mockery.registerMock('ari-client-wrapper', clientMock);

    var notify = require('../lib/notify.js')({
      config: getMockConfig(),
      dal: getMockDal()
    });
    var mailbox = {mailboxName: 'my-mailbox', read: 1, unread: 1};
    var message = {read: true};
    notifier = notify.create(mailbox, message);

    done();
  });

  afterEach(function(done) {
    mockery.disable();
    mwiUpdated = false;
    newMessages = undefined;
    oldMessages = undefined;

    done();
  });

  it('should support notifying that a new message exists', function(done) {
    notifier.newMessage();
    checkSuccess();

    function checkSuccess() {
      if (mwiUpdated) {
        assert(newMessages === 2);
        assert(oldMessages === 1);
        done();
      } else {
        setTimeout(function() {
          checkSuccess();
        }, asyncDelay);
      }
    }
  });

  it('should support notifying that a message was read', function(done) {
    notifier.messageRead();
    checkSuccess();

    function checkSuccess() {
      if (mwiUpdated) {
        assert(newMessages === 0);
        assert(oldMessages === 2);
        done();
      } else {
        setTimeout(function() {
          checkSuccess();
        }, asyncDelay);
      }
    }
  });

  it('should support notifying that a message was deleted', function(done) {
    notifier.messageDeleted();
    checkSuccess();

    function checkSuccess() {
      if (mwiUpdated) {
        assert(newMessages === 1);
        assert(oldMessages === 0);
        done();
      } else {
        setTimeout(function() {
          checkSuccess();
        }, asyncDelay);
      }
    }
  });

});
