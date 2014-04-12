var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');

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

var Motion = Backbone.Model.extend({
  initialize: function (data) {
    this.normalize(data);
    this.loaded = data.loaded;
    this.on('update', this.normalize, this);
    this.on('change:name', function () {
      console.log('name update');
    });
  },

  normalize: function (data) {
    var raw;

    if (data.get) {
      raw = data.get('raw');
    } else {
      raw = data.raw;
    }

    this.set('raw', raw);
    this.set('id', raw.id);
    this.set('name', raw.motion_en);
    this.set('mover', raw.mover_en);
    if (raw.summary) {
      this.set('result', raw.summary.overall);
      this.set('fc_result', raw.summary.fc.result);
      this.set('gc_result', raw.summary.gc.result);
    }
    this.set('time', raw.time);
    this.set('date', raw.date);

    this.set('votes', raw.votes);
  },

  getSummary: function (con) {
    var vote_names = ['yes', 'no', 'abstain', 'absent', 'present'];
    if (_.contains(['fc', 'gc'], con)) {
      var data = this.get('raw').summary[con];
      return vote_names.map(function (name) {
        return { name: name, value: data[name], color: color(name) };
      });
    } else {
      var grouped = _.groupBy(this.get('votes'), 'vote');
      return vote_names.map(function (name) {
        var votes = grouped[capitalize(name)] || [];
        return { name: name, value: votes.length, color: color(name) };
      });
    }
  },

  load: function () {
    var url = '/node_modules/hk-legco-utils/data/voting-motion-json/1314/' + this.get('id') + '.json';
    var promise = $.getJSON(url).then(function (data) {
      this.loaded = true;
      this.trigger('update', { raw: data });
    }.bind(this));

    return promise;
  }
});

module.exports = Motion;
