var rivets = require('rivets');
var Backbone = require('backbone');
var $ = require('jquery');

rivets.adapters[':'] = {
  subscribe: function(obj, keypath, callback) {
    // console.log('subscribe', obj.cid, keypath);
    if (obj instanceof Backbone.Collection) {
      return obj.on('add remove reset', callback);
    } else if (obj instanceof Backbone.Model ) {
      return obj.on('change:' + keypath, function () {
        // console.log('changed', keypath);
        callback.apply(this, arguments);
      });
    }
    // debugger;
  },
  unsubscribe: function(obj, keypath, callback) {
    if (obj instanceof Backbone.Collection) {
      return obj.off('add remove reset', callback);
    } else if (obj instanceof Backbone.Model) {
      return obj.off('change:' + keypath, callback);
    }
  },
  read: function(obj, keypath) {
    // console.log('read', obj.cid, keypath);
    if (obj instanceof Backbone.Collection) {
      return obj.models;
    } else if (obj instanceof Backbone.Model) {
      return obj.get(keypath);
    }

    // debugger;
  },
  publish: function(obj, keypath, value) {
    obj.set(keypath, value);
  }
};

rivets.binders.class = function (el, value) {
  var $el = $(el);
  value = value && value.toLowerCase() || '';
  var lastClass = $el.data('rv-last-class');

  $el.removeClass(lastClass);
  $el.addClass(value);
  $el.data('rv-last-class', value);
};

rivets.configure({
  templateDelimiters: ['{{', '}}']
});

rivets.formatters.capitalize = function (str) {
  str = str || '';
  str = str.toLowerCase();

  // From https://github.com/gouch/to-title-case/blob/master/to-title-case.js
  var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;
  return str.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title){
    if (index > 0 && index + match.length !== title.length &&
      match.search(smallWords) > -1 && title.charAt(index - 2) !== ':' &&
      (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
      title.charAt(index - 1).search(/[^\s-]/) < 0) {
      return match.toLowerCase();
    }

    if (match.substr(1).search(/[A-Z]|\../) > -1) {
      return match;
    }

    return match.charAt(0).toUpperCase() + match.substr(1);
  });
};

rivets.formatters.toLowerCase = function (str) {
  return (str || '').toLowerCase();
};

rivets.formatters.normalize = function (obj) {
  if (Array.isArray(obj)) return obj.map(function (o) { return o.name; }).join(', ');
  return obj && obj.name || '';
};

rivets.formatters.tap = function (obj) {
  console.log('tap', obj);
  return [{ party_name: 'test' }];
};