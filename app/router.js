'use strict';

var Backbone = require('backbone');

var Router = Backbone.Router.extend({
  routes: {
    'motion/:id': 'showMotion',
    '': 'default'
  },

  showMotion: function (id) {
    Backbone.trigger('motion:show', id);
  },

  default: function () {
    this.navigate('motion/1314144', {
      trigger: true,
      replace: true
    });
  }
});

module.exports = Router;

