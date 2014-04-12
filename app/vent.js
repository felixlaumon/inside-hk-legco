var _ = require('underscore');
var Backbone = require('Backbone');

var vent = {};
_.extend(vent, Backbone.Events);

module.exports = vent;
