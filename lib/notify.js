/**
 * Notification module for Asterisk voicemail.
 *
 * @module mailbox-helpers
 * @copyright 2014, Digium, Inc.
 * @license Apache License, Version 2.0
 * @author Samuel Fortier-Galarneau <sgalarneau@digium.com>
 */

'use strict';

var ari = require('ari-client-wrapper');
var Q = require('q');

/**
 * Creates a function to update a mailboxe's MWI counts.
 *
 * @param {Mailbox} mailbox - a mailbox instance
 * @param {object} dependencies - object keyed by module dependencies
 * @returns {Function} function - function to update the mailboxe's MWI counts
 */
function createMwiUpdater(mailbox, dependencies) {
  return updateMwi;

  /**
   * Uses ari to update MWI for a given mailbox.
   *
   * @param {int} read - count of read messages
   * @param {int} unread - count of unread messages
   * @returns {Q} promise - a promise containing the result of updating the MWI
   *   counts through ARI
   */
  function updateMwi(read, unread) {
    var config = dependencies.config.getAppConfig().ari;

    return ari.getClient(config, config.applicationName)
      .then(function(client) {
        var update = Q.denodeify(client.mailboxes.update.bind(client));

        return update({
          mailboxName: mailbox.mailboxName,
          oldMessages: read,
          newMessages: unread
        });
      });
  }
}

/**
 * Returns a notifier instance.
 *
 * @param {Mailbox} mailbox - a mailbox instance
 * @param {Message} message - a message instance
 * @param {object} dependencies - object keyed by module dependencies
 */
function createNotifier(mailbox, message, dependencies) {
  var mwiUpdater = createMwiUpdater(mailbox);

  var api = {
    newMessage: function() {
      return dependencies.dal.mailbox.newMessage(mailbox, mwiUpdater);
    },

    messageRead: function() {
      // TODO: handle updating message as read
      return dependencies.dal.mailbox.readMessage(mailbox, mwiUpdater);
    }
  };

  return api;
}

/**
 * Returns module functions.
 *
 * @param {object} dependencies - object keyed by module dependencies
 * @returns {object} module - module functions
 */
module.exports = function(dependencies) {
  return {
    create: function(mailbox, message) {
      return createNotifier(mailbox, message, dependencies);
    }
  };
};
