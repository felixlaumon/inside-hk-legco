'use strict';

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
Backbone.$ = $;
var MotionView = require('./views/motion');
var MotionSideBarView = require('./views/motion-sidebar');
var Router = require('./router');
require('./rivets-adapter');

function bootstrap () {
  return $.when(
    (function () {
      var member_url = '/node_modules/hk-legco-utils/data/member-json/all.json';
      return $.getJSON(member_url).then(function (data) {
        return data;
      });
    })(),
    (function () {
      var motions_url = '/node_modules/hk-legco-utils/data/voting-motion-json/1314/all.json';
      return $.getJSON(motions_url).then(function (data) {
        data = _.filter(data, function (d) {
          return !d.ammendment &&
            d.motion_en.toLowerCase().indexOf('amendment') < 0 &&
            d.motion_en.toLowerCase().indexOf('amended') < 0;
        });
        return data;
      });
    })()
  );
}

var AppView = Backbone.View.extend({
  el: '#container',

  initialize: function (members, motions) {
    this.motionView = new MotionView({ members: members });
    this.motionSideBarView = new MotionSideBarView({ motions: motions });
  }
});

module.exports = AppView;

$(function () {
  bootstrap().then(function (members, motions) {
    var app = new AppView(members, motions);
    var router = new Router();
    Backbone.history.start();
  });
});



// for debug
window.$ = $;
window.Backbone = Backbone;
