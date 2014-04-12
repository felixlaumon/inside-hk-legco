var Backbone = require('backbone');
var $ = require('jquery');
var d3 = require('d3');
var voteBar = require('../dataviz/votebar');

var VoteBarView = Backbone.View.extend({
  tagName: 'div',
  className: 'votebar-container',

  initialize: function (options) {
    this.options = options || {};
    this.chart = voteBar();
  },

  render: function (data, opts) {
    opts = opts || {};
    this.chart
      .maxDomain(opts.maxDomain)
      .width(this.options.width || this.$el.width())
      .height(this.options.height || this.$el.height());
    d3.select(this.el).datum(data).call(this.chart);

    return this.$el;
  },

  update: function (data, opts) {
    d3.select(this.el).datum(data).call(this.chart);
  }
});

module.exports = VoteBarView;

