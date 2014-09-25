# Asterisk Voicemail Notification Interface

Notification interface for Asterisk voicemail. This module supports notifying various enpoints that a message has been created/read, et cetera. An endpoint could be a phone configured to receive MWI through ARI's mailboxes resource, a URL configured to accept an HTTP POST with a JSON payload, or an email server.

# Installation

```bash
$ git clone https://github.com/asterisk/node-voicemail-notify.git
$ cd node-voicemail-notify
$ npm install -g .
```

or add the following the your package.json file

```JavaScript
"dependencies": {
  "voicemail-notify": "asterisk/node-voicemail-notify"
}
```

# Usage

# Development

After cloning the git repository, run the following to install the module and all dev dependencies:

```bash
$ npm install
$ npm link
```

Then run the following to run jshint and mocha tests:

```bash
$ grunt
```

jshint will enforce a minimal style guide. It is also a good idea to create unit tests when adding new features.

# License

Apache, Version 2.0. Copyright (c) 2014, Digium, Inc. All rights reserved.

