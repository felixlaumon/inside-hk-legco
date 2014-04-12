var Backbone = require('backbone');
var $ = require('jquery');
var Motion = require('../models/motion.js');

var Motions = Backbone.Collection.extend({
  model: Motion,
  comparator: 'date'
});

// singleton
var motions = new Motions();

module.exports = motions;
