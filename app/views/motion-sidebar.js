var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var rivets = require('rivets');
var Motion = require('../models/motion.js');
var motions = require('../collections/motions.js');

rivets.formatters.sidebar_href = function(value) {
  return '#motion/' + value;
};

var MotionSideBarView = Backbone.View.extend({
  el: '#motion-sidebar',

  initialize: function (opts) {
    _.bindAll(this, 'updateHeight');
    $(window).on('resize', this.updateHeight);
    this.updateHeight();

    var data = _.chain(opts.motions)
      // .where({ ammendment: false })
      .map(function (motion) {
        return { raw: motion, prefetched: false };
      }).value();
    this.collection = motions;
    this.collection.reset(data);
    rivets.bind(this.$el, { motions: this.collection });
  },

  render: function () {
  },

  updateHeight: _.debounce(function () {
    // needs to be triggered when svg changes the document size
    this.$el.find('#motion-scroll-container')
      .height($('body').height() - this.$el.offset().top);
  }, 500)
});

module.exports = MotionSideBarView;
