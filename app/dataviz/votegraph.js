var d3 = require('d3');
var _ = require('underscore');

var noop = function () {};

function voteGraph (svgEl, data) {
  function merge_on (arr1, arr2, key1, key2) {
    key2 = key2 || key1;
    // arr1 = _.clone(arr1);
    // arr2 = _.clone(arr2);

    return _.map(arr1, function (el1) {
      var query = {};
      query[key2] = el1[key1];
      var el2 = _.where(arr2, query)[0];
      _.extend(el1, el2);
      return el1;
    });
  }

  function assign_all (arr, key, value) {
    _.each(arr, function (obj) {
      obj[key] = value;
    });
  }

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

  var width = data.width;
  var height = data.height;
  var radius_scale = d3.scale.linear()
    .domain([0, 60]) // input
    .range([20, 120]); // output

  var party_distance_scale = d3.scale.linear()
    .domain([0, 15]) // input
    .range([50, 100]); // output

  var voting_strength_scale = d3.scale.pow().exponent(0.5)
    .domain([0, 1]) // input
    .range([0.15, 0.05]); // output

  var voting_distance_scale = d3.scale.linear()
    .domain([0, 1]) // input
    .range([50, 90]); // output

  var curve = d3.svg.line()
    .interpolate('basis-closed')
    .tension(0.9);

  var label_charge_scale = d3.scale.linear()
    .domain([0, 60]) // input
    .range([-300, -600]); // output

  var party_color = d3.scale.category20();

  var svg = d3.select(svgEl)
    .attr('width', width)
    .attr('height', height);

  svg.append('g')
    .append('clipPath').attr('id', 'avatar-clip')
      .append('circle').attr('r', 20);

  var members = data.members;
  assign_all(members, 'member', true);

  var yes_node = {
    vote: 'Yes',
    name_en: 'Yes',
    x: 2 * width / 10,
    y: height / 2
  };
  var no_node = {
    vote: 'No',
    name_en: 'No',
    x: 8 * width / 10,
    y: height / 2
  };
  var absent_node = {
    vote: 'Absent',
    name_en: 'Absent',
    x: width / 2,
    y: height / 10
  };
  var present_node = {
    vote: 'Present',
    name_en: 'Present',
    x: width / 2,
    y: height / 2
  };
  var abstain_node = {
    vote: 'Abstain',
    name_en: 'Abstain',
    x: width / 2,
    y: 9 * height / 10
  };
  var label_nodes = [yes_node, no_node, absent_node, present_node, abstain_node];
  assign_all(label_nodes, 'label', true);
  assign_all(label_nodes, 'charge', -500);
  assign_all(label_nodes, 'r', 0);
  // assign_all(label_nodes, 'fixed', true);


  var party_names = _.chain(members).pluck('parties_en').flatten().unique().value();
  // var party_nodes = _.map(party_names, function (party_name) {
  //   return {
  //     name: party_name,
  //     charge: 0
  //   };
  // });

  var node_data = [].concat(label_nodes, members);
  _.each(node_data, function (d) {
    if (!d.label) {
      d.x = width / 2 + (Math.random() - 0.5) * width / 3;
      d.y = height / 2 + (Math.random() - 0.5) * height / 3;
    }
  });




  // var party_member_links = _.chain(members)
  //   .map(function (member) {
  //     return _.map(member.parties_en, function (party) {
  //       return {
  //         source: member,
  //         target: _.where(party_nodes, { name: party })[0],
  //         strength: 0.1,
  //         distance: 100
  //       };
  //     });
  //   })
  //   .flatten()
  //   .value();


  var members_by_party = {};
  _.each(members, function (member) {
    _.each(member.parties_en, function (party) {
      members_by_party[party] = members_by_party[party] || [];
      members_by_party[party].push(member);
    });
  });

  var simple_party_links = _.chain(party_names).map(function (party_name) {
    var party_members = _.filter(members, function (member) {
      return _.contains(member.parties_en, party_name);
    });

    var links = [];
    for (var i = 0; i < party_members.length - 1; i++) {
      // TODO simplify
      links.push({
        source: party_members[i],
        target: party_members[i + 1],
        strength: 0.1,
        distance: 30,
        type: 'party_link',
        party: party_name
      });
    }
    links.push({
      source: party_members[0],
      target: party_members[party_members.length - 1],
      strength: 0.1,
      distance: 30,
      type: 'party_link',
      party: party_name
    });
    return links;
  }).flatten().value();

  var grouped_strong_party_links = {};
  var strong_party_links = [];
  _.each(party_names, function (party_name) {
    var party_members = _.filter(members, function (member) {
      return _.contains(member.parties_en, party_name);
    });

    var links = [];
    for (var i = 0; i < party_members.length; i++) {
      for (var j = i + 1; j < party_members.length; j++) {
        links.push({
          source: party_members[i],
          target: party_members[j],
          // todo: weaker if more members
          strength: 0.1,
          // longer distance if more members
          distance: party_distance_scale(party_members.length),
          type: 'party_link',
          party: party_name
        });
      }
    }
    grouped_strong_party_links[party_name] = links;
    strong_party_links = strong_party_links.concat(links);
  });



  var hull_data_input = _.map(party_names, function (party_name) {
    var party_members = _.filter(members, function (member) {
      return _.contains(member.parties_en, party_name);
    });

    var offset = 30;
    return _.chain(party_members)
      .map(function (d) { return [
        { x: d.x - offset, y: d.y - offset },
        { x: d.x - offset, y: d.y + offset },
        { x: d.x + offset, y: d.y - offset },
        { x: d.x + offset, y: d.y + offset }
      ]; })
      .flatten()
      .value();
  });
  var hull_data = _.map(hull_data_input, function (arr) {
    arr = arr.map(function (d) { return [d.x, d.y]; });
    var output = d3.geom.hull(arr);
    // console.log(arr.length, output.length);
    return output;
  });

  var hull = svg.selectAll('.hull')
    .data(hull_data)
    .enter().append('path')
      .attr('class', 'hull')
      .attr('d', function(d) {
        return 'M' + d.join('L') + 'Z';
      })
      .style('fill', party_color)
      .style('fill-opacity', 0.25);




  var node = svg.selectAll('.node')
    .data(node_data)
    .enter().append('g')
      .attr('class', 'node');
    // .exit().remove();

  node
    .filter(function (d) { return d.label || d.member; })
    .append('circle')
    .attr('r', function (d) { return d.r || 22; })
    .style('fill', function(d) { return color(d.vote); });

  node.append('text')
    .filter(function (d) { return d.label || d.member; })
    .attr('fill', 'black')
    .attr('class', function (d) { return d.label ? 'label': null; })
    .attr('y', function (d) { return d.label ? 10 : 32; })
    .text(function(d) { return d.name_en; });

  node.append('image')
    .attr('xlink:href', function (d) { return d.img; })
    .attr('x', -30)
    .attr('y', -30)
    .attr('width', 60)
    .attr('height', 60)
    .attr('clip-path', 'url(#avatar-clip)');

  function getPosition (member, i) {
    i = i || 0;

    if (!member.parties_en || !member.parties_en.length) {
      // This hides members with no party
      return;
    }

    // TODO: allow sorting
    var party = member.parties_en[i];
    var party_index = _.keys(members_by_party).indexOf(party);
    var rmember = _.where(members_by_party[party], { id: member.id })[0];
    var member_index = members_by_party[party].indexOf(rmember);

    var pos = {
      // TODO: should shift nodes to the next row
      x: 50 + member_index * 90,
      y: 50 + party_index * 100
    };
    return pos;
  }



  var force;
  var link;
  var extra_members = [];




  function update (votes, mode) {
    svg.attr('height', height);

    _.each(label_nodes, function (l) {
      var amount = _.where(votes, { vote: l.name_en }).length;
      l.r = amount;
      l.charge = label_charge_scale(amount);
    });

    var votes = merge_on(members, votes, 'name_ch', 'name_ch');

    var voting_links = _.map(votes, function (m) {
      var party_members = members_by_party[m.parties_en[0]];
      var party_member_count = party_members && party_members.length || 1;

      var party_member_by_vote = _.groupBy(party_members, 'vote');
      var same_vote_party_members = party_member_by_vote[m.vote] && party_member_by_vote[m.vote].length;
      var same_vote_count = same_vote_party_members && same_vote_party_members.length || 0;

      // Stronger strength if outliner
      var strength = voting_strength_scale(same_vote_count / party_member_count);
      // Longer distance if outliner
      var distance = voting_distance_scale(same_vote_count / party_member_count);

      return {
        source: m,
        target: _.where(label_nodes, { vote: m.vote })[0],
        strength: strength,
        // strength: 0.1,
        distance: distance,
        // distance: 40,
        type: 'vote_link',
        name_en: m.name_en
      };
    });

    // TODO some nodes are not removed resulting in extra links
    node_data = _.difference(node_data, extra_members);
    extra_members = [];
    svg.selectAll('.node').data(node_data)
      .exit().remove();
    node = svg.selectAll('.node');

    node.select('circle')
      .style('fill', function(d) { return color(d.vote); })
      .attr('fill-opacity', 0.75);

    node.filter(function (d) { return d.label; })
      .select('circle')
      .transition()
      .duration(750)
      .attr('r', function (d) { return radius_scale(d.r); });

    if (force) {
      force.stop();
      force.on('tick', null);
      force.nodes([]);
      force.links([]);
      node.interrupt();
    }

    // var link_data = [].concat(voting_links, simple_party_links);
    var link_data = [].concat(voting_links, strong_party_links);
    if (mode === 'vote') {
      groupByVote(votes, link_data);
    } else if (mode === 'party') {
      groupByParty(votes);
    }
  }

  function groupByVote (votes, link_data) {
    force = d3.layout.force()
      .gravity(0.075)
      .charge(function (d) { return d.charge || -250; })
      .links(link_data)
      .linkStrength(function (d) { return d.strength || 0.01; })
      .linkDistance(function (d) { return d.distance || 30; })
      .size([width, height])
      .friction(0.9)
      .nodes(node_data);

    svg.selectAll('.link').remove();

    link = svg.selectAll('.link').data(link_data)
      .enter().insert('line', ':first-child')
        .attr('class', 'link')
        .attr('data-type', function (d) { return d.type; })
        .style('stroke-opacity', 0.25);

    // node.each(function (d) {
    //   d.fixed = false;
    // });

    node.transition()
      .duration(500)
      .style('opacity', 1);

    node.call(force.drag);

    updateToolTipBinding();

    node.on('mousedown.highlight', function (e) {
      var member = d3.select(this);
      var m = member.datum();
      var other_nodes = node.filter(function (d) {
        if (m.label) {
          return d.vote !== m.vote;
        }

        if (d.label) {
          return d.vote !== m.vote;
        }

        if (d === m) {
          return false;
        }

        return _.all(d.parties_en, function (party) {
          return !_.contains(m.parties_en, party);
        });
      });

      other_nodes.select('circle')
        .transition()
        .attr('fill-opacity', 0.1);

      other_nodes.select('image')
        .transition()
        .attr('opacity', 0.1);
    });

    node.on('mouseup.highlight', function (e) {
      node.select('circle')
        .transition()
        .attr('fill-opacity', 0.75)
        .style('fill', function(d) { return color(d.vote); });

      node.select('image')
        .transition()
        .attr('opacity', 1);
    });

    hull.transition()
      .duration(500)
      .style('fill-opacity', 0.25);

    // node.on('mousedown.highligh-link', function () {
    //   var member = d3.select(this).data()[0];
    //   var parties = member.parties_en;
    //   _.each(parties, function (party) {
    //     link.filter(function (l) { return l.party === party; })
    //       .transition()
    //       .style('stroke-opacity', 1);
    //   });

    //   link.filter(function (l) { return l.type === 'vote_link' && l.name_en === member.name_en; })
    //     .transition()
    //     .style('stroke-opacity', 1);
    // });

    // node.on('mouseup.highligh-link', function () {
    //   var member = d3.select(this).data()[0];
    //   var parties = member.parties_en;
    //   _.each(parties, function (party) {
    //     link.filter(function (l) { return l.party === party; })
    //       .transition()
    //       .style('stroke-opacity', 0);
    //   });

    //   link.filter(function (l) { return l.type === 'vote_link' && l.name_en === member.name_en; })
    //     .transition()
    //     .style('stroke-opacity', 0.5);
    // });

    force.on('tick', function(e) {
      node.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });

      link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

      var hull_data_input = _.map(party_names, function (party_name) {
        var party_members = _.filter(members, function (member) {
          return _.contains(member.parties_en, party_name);
        });

        var offset = 30;
        return _.chain(party_members)
          .map(function (d) { return [
            { x: d.x - offset, y: d.y - offset },
            { x: d.x - offset, y: d.y + offset },
            { x: d.x + offset, y: d.y - offset },
            { x: d.x + offset, y: d.y + offset }
          ]; })
          .flatten()
          .value();
      });
      var hull_data = _.map(hull_data_input, function (arr) {
        arr = arr.map(function (d) { return [d.x, d.y]; });
        var output = d3.geom.hull(arr);
        // console.log(arr.length, output.length);
        return output;
      });

      hull = svg.selectAll('.hull').data(hull_data)
        .attr('d', function(d) {
          // return 'M' + val.join('L') + 'Z';
          return curve(d);
        });
    });

    force.start();
  }

  var empty_spaces = {};
  function groupByParty (votes) {
    // force.stop();
    // force.on('tick', null);
    // force.nodes([]);
    // force.links([]);
    // node.interrupt();

    link.style('opacity', 0);

    node.filter(function (d) { return !d.parties_en || !d.parties_en.length; })
      .transition()
      .duration(500)
      .style('opacity', 0);

    updateToolTipBinding();

    hull.transition()
      .duration(500)
      .style('fill-opacity', 0);

    // For duplicating members with multiple party. OMG this is incredibly
    // hacky
    extra_members = _.chain(members)
      .map(function (m) {
        return _.map(m.parties_en, function (p, i) {
          if (i > 0) {
            return _.extend(_.clone(m), { _extra: i });
          }
        });
      })
      .flatten()
      .compact()
      .value();
    node_data = node_data.concat(extra_members);

    var newNode = node.data(node_data)
      .enter()
        .append('g')
        .attr('class', 'node');

    newNode.filter(function (d) { return d.label || d.member; })
      .append('circle')
      .attr('r', function (d) { return d.r || 22; })
      .style('fill', function(d) { return color(d.vote); });

    newNode.append('text')
      .filter(function (d) { return d.label || d.member; })
      .attr('fill', 'black')
      .attr('y', '35')
      .text(function(d) { return d.name_en; });

    newNode.append('image')
      .attr('xlink:href', function (d) { return d.img; })
      .attr('x', -30)
      .attr('y', -30)
      .attr('width', 60)
      .attr('height', 60)
      .attr('clip-path', 'url(#avatar-clip)');

    node = svg.selectAll('.node');

    var first_row_margin = 50;
    var first_column_margin = 50;
    var column_padding = 40;
    var row_padding = 20;
    var party_padding = 100;
    var avatar_width = 60;
    var avatar_height = 60;
    var avatar_x_amount = Math.floor(width / (avatar_width + column_padding));
    var pointer_x = column_padding;
    var pointer_y = first_row_margin + row_padding + party_padding;
    var last_pindex = 0;

    // Must act on the original data array instead of node, or else sort()
    // mess up stuff
    _.chain(members.concat(extra_members))
      .filter(function (d) { return d.parties_en && d.parties_en.length; })
      .each(function (member) {
        var i = member._extra || 0;

        // TODO allow sorting
        // TODO allow arbitrary grouping
        var party = member.parties_en[i];
        member._pindex = _.keys(members_by_party).indexOf(party);
        var rmember = _.where(members_by_party[party], { id: member.id })[0];
        member._mindex = members_by_party[party].indexOf(rmember);
      })
      .sort(function (m1, m2) {
        if (m1._pindex === m2._pindex) {
          // If same party, then sort by mindex
          return m1._mindex - m2._mindex;
        } else {
          return m1._pindex - m2._pindex;
        }
      })
      .each(function (d) {
        var need_new_row = pointer_x + avatar_width + column_padding > width;
        var diff_party = d._pindex !== last_pindex;
        if (need_new_row || diff_party) {
          pointer_y += avatar_height + row_padding;
          pointer_x = column_padding;
        }

        if (diff_party) {
          var last_pname = _.keys(members_by_party)[last_pindex];
          var cur_pname = _.keys(members_by_party)[d._pindex];
          pointer_y += party_padding;
          empty_spaces[last_pname] = empty_spaces[last_pname] || {};
          empty_spaces[last_pname].end = pointer_y;
          empty_spaces[cur_pname] = {};
          empty_spaces[cur_pname].start = pointer_y;
        }

        d._posx = pointer_x;
        d._posy = pointer_y;

        pointer_x = d._posx + avatar_width + column_padding;
        pointer_y = d._posy;
        last_pindex = d._pindex;
      });

    var last_pname = _.keys(members_by_party)[last_pindex];
    empty_spaces[last_pname].end = pointer_y;

    node.filter(function (d) { return d._extra; })
      .attr('transform', function (d) {
        d.py = d.y = d._posy;
        return 'translate(-100,' + d.y + ')';
      });

    node.filter(function (d) { return d.parties_en && d.parties_en.length; })
      .transition()
      .duration(750)
      .attr('transform', function (d) {
        d.px = d.x = d._posx;
        d.py = d.y = d._posy;
        return 'translate(' + d.x + ',' + d.y + ')';
      })
      .delay(function (d) {
        return d.y / 4;
      });

    svg.attr('height', pointer_y + avatar_height + row_padding);


    // node.each(function (d) {
    //   d.fixed = true;
    // });

    node.on('mousedown.drag', null);
    node.on('mousedown.highlight', null);
  }

  function hideName () {
    svg.selectAll('.node text')
      .filter(function (d) { return d.member; })
      .transition()
      .duration(500)
      .style('fill-opacity', 0);
  }

  function showName () {
    svg.selectAll('.node text')
      .filter(function (d) { return d.member; })
      .transition()
      .duration(500)
      .style('fill-opacity', 1);
  }

  var dragging = false;
  function updateToolTipBinding () {
    node.filter(function (d) { return d.member; })
      .on('mouseover.tooltip', function () {
        if (!dragging) binding.over.apply(this, arguments);
      })
      .on('mousemove.tooltip', function () {
        if (!dragging) binding.move.apply(this, arguments);
      })
      .on('mouseout.tooltip', function () {
        if (!dragging) binding.out.apply(this, arguments);
      })
      .on('mousedown.tooltip', function () {
        binding.down.apply(this, arguments);
        dragging = true;
      })
      .on('mouseup.tooltip', function () {
        dragging = false;
      });
  }

  var binding = {};
  function tooltip (over, move, out, down) {
    binding.over = over || noop;
    binding.move = move || noop;
    binding.out = out || noop;
    binding.down = down || noop;
  }

  function state () {
    return {
      party_empty_spaces: empty_spaces
    };
  }

  return {
    update: update,
    hideName: hideName,
    showName: showName,
    tooltip: tooltip,
    state: state
  };
}

module.exports = voteGraph;
