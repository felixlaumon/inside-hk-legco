var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var rivets = require('rivets');
var VoteBarView = require('./votebar.js');
var VoteGraphView = require('./votegraph.js');
var Motion = require('../models/motion.js');
var motions = require('../collections/motions.js');

var MotionView = Backbone.View.extend({
  el: '#motion',

  initialize: function (data) {
    this.members = data.members;
    this.render();
    this.model = new Motion({ raw: {} });
    this.rv = rivets.bind(this.$el, { motion: this.model });

    Backbone.on('motion:show', this.update, this);
  },

  initSubViews: _.once(function () {
    this.initVoteBars();
    this.initVoteGraph();
  }),

  render: function () {
  },

  initVoteBars: function () {
    this.vbViews = [];
    _.each(['fc', 'gc'], function (con) {
      var vbView = new VoteBarView();
      vbView.setElement(this.$el.find('.votebar.' + con));
      vbView.render(this.model.getSummary(con), {
        maxDomain: this.model.get('votes').length
      });
      vbView.type = con;
      this.vbViews.push(vbView);
    }, this);

    var overallVbView = new VoteBarView();
    overallVbView.setElement(this.$el.find('.votebar.overall'));
    overallVbView.render(this.model.getSummary('overall'), {
      maxDomain: this.model.get('votes').length
    });
    overallVbView.type = 'overall';
    this.vbViews.push(overallVbView);
  },

  initVoteGraph: function () {
    this.vgView = new VoteGraphView();
    this.vgView.setElement(this.$el.find('.votegraph'));
    this.vgView.render({ members: this.members, votes: this.model.get('votes') });
  },

  update: function (id) {
    var model = motions.get(id);
    this.model = model;

    this.model.load().then(function () {
      this.rv.unbind();
      this.rv = rivets.bind(this.$el, { motion: this.model });

      this.initSubViews();
      _.each(this.vbViews, function (vbView) {
        var data = this.model.getSummary(vbView.type);
        vbView.update(data);
      }, this);

      this.vgView.update(this.model.get('votes'));
    }.bind(this));
  }
});

module.exports = MotionView;

