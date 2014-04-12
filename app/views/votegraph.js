var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var d3 = require('d3');
var votegraph = require('../dataviz/votegraph');
var MemberTooltipView = require('./member-tooltip.js');
var VoteBarView = require('./votebar.js');

function color (vote) {
  var map = {
    yes: '#417505',
    no: '#D52220',
    present: '#aaa',
    abstain: '#aaa',
    absent: '#aaa'
  };
  return map[vote && vote.toLowerCase()];
}

function capitalize (word) {
  return word.substr(0, 1).toUpperCase() + word.substr(1).toLowerCase();
}

function toDataForVotebar (data) {
  var vote_names = ['yes', 'no', 'abstain', 'absent', 'present'];
  var grouped = _.groupBy(data, 'vote');
  return vote_names.map(function (name) {
    var votes = grouped[capitalize(name)] || [];
    return { name: name, value: votes.length, color: color(name) };
  });
}

var VoteGraphView = Backbone.View.extend({
  initialize: function (opts) {
    _.bindAll(this, 'showtip', 'hidetip', 'movetip');
    this.tooltip = new MemberTooltipView();
    this.partyVbViews = [];
  },

  events: {
    'click .overview': 'viewByOverview',
    'click .view-by-party': 'viewByParty'
  },

  render: function (data, opts) {
    this.data = data;
    this.chart = votegraph(this.$el.find('svg').get(0), {
      members: data.members,
      width: this.$el.width(),
      height: this.$el.height()
    });
    this.chart.hideName();
    this.chart.tooltip(this.showtip, this.movetip, this.hidetip, this.hidetip);

    this.update(data.votes);
  },

  update: function (votes) {
    this.votes = votes;
    this.viewByOverview({ target: this.$el.find('button.overview')} );
  },

  viewByOverview: function (e) {
    this.$el.find('button').removeClass('active');
    $(e.target).addClass('active');
    this.chart.update(this.votes, 'vote');
    this.chart.hideName();
    this.hidePartyVotes();
    this.$el.find('svg.force-layout').css('height', '');
  },

  viewByParty: function (e) {
    this.$el.find('button').removeClass('active');
    $(e.target).addClass('active');
    this.chart.update(this.votes, 'party');
    this.chart.showName();
    this.showPartyVotes();
    this.$el.find('svg.force-layout').height(4500);
    // TODO set svg height
    // TODO set add party info
  },

  showPartyVotes: function () {
    this.partyVbViews = [];
    var members_by_party = {};
    _.each(this.data.members, function (member) {
      _.each(member.parties_en, function (party) {
        members_by_party[party] = members_by_party[party] || [];
        members_by_party[party].push(member);
      });
    });
    var party_names = _.keys(members_by_party);
    var party_empty_spaces = this.chart.state().party_empty_spaces;

    _.each(members_by_party, function (members, party_name) {
      var empty_space = party_empty_spaces[party_name];
      var y = empty_space.start || 170;
      var data = toDataForVotebar(members);

      var vbView = new VoteBarView({ height: 40 });
      vbView.$el.append('<div class="party-color-block"></div><h4 class="party-name"></h4>');
      vbView.$el.find('h4').text(party_name);
      var $el = vbView.render(data, {
        maxDomain: 15
      });
      this.$el.find('.party-votebars').append($el);
      $el.css({
        position: 'absolute',
        top: y - 90
      });
      this.partyVbViews.push(vbView);

      d3.select(vbView.el)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay(function () { return d3.scale.sqrt()(y * 500); })
        .style('opacity', 1);
    }, this);
  },

  hidePartyVotes: function () {
    _.each(this.partyVbViews, function (vbView) {
      vbView.stopListening();
      d3.select(vbView.el)
        .transition()
        .style('opacity', 0)
        .each('end', function () {
          this.$el.find('.party-votebars').empty();
        }.bind(this));
    }, this);
  },

  showtip: function (data) {
    this.tooltip.update(data);
    this.tooltip.show();
  },

  hidetip: function () {
    this.tooltip.hide();
  },

  movetip: function (data) {
    this.tooltip.move(data.x, data.y);
  }
});

module.exports = VoteGraphView;
