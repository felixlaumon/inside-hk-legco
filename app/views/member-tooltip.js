var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var rivets = require('rivets');

var Member = Backbone.Model.extend({
  defaults: {
    name: '',
    parties: [],
    con_type: '',
    con_area: ''
  },

  update: function (data) {
    this.set('name', data.name_en);
    this.set('parties', data.parties_en && data.parties_en);
    this.set('con_type', data.constituency_en && data.constituency_en.type);
    this.set('con_area', data.constituency_en && data.constituency_en.area);
    this.set('vote', data.vote);
  }
});

var MemberTooltipView = Backbone.View.extend({
  el: '#member-tooltip',

  initialize: function (opts) {
    _.bindAll(this, 'hide', 'updateParties');
    this.hide({ duration: 0 });
    this.model = new Member();

    this.rv = rivets.bind(this.$el, { member: this.model });
    // TODO binding to parties doesn't work
    this._partiesTpl = this.$el.find('.parties-tpl').remove();
    this.model.on('change:parties', this.updateParties);
  },

  events: {
  },

  render: function (data) {
  },

  update: function (data) {
    // console.log('update', data);
    this.model.update(data);
  },

  updateParties: function (data) {
    var $ul = this.$el.find('.parties ul');
    $ul.empty();
    _.each(this.model.get('parties'), function (name) {
      var $el = this._partiesTpl.clone();
      $el.find('.party-name').text(name);
      $ul.append($el);
    }, this);
  },

  show: function () {
    d3.select(this.el)
      .transition()
      .style('opacity', 1);
  },

  hide: function (opts) {
    opts = opts || {};
    opts.duration = opts.duration || 400;

    d3.select(this.el)
      .transition()
      .duration(opts.duration)
      .style('opacity', 0)
      .style('pointer-events', 'none');
  },

  move: function (x, y) {
    this.$el.css({
      left: Math.round(x - this.$el.width() / 2),
      top: Math.round(y - this.$el.height() - 50)
    });
  }
});

module.exports = MemberTooltipView;
