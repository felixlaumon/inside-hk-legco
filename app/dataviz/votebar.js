var d3 = require('d3');

module.exports = function voteBar () {
  var width = 600;
  var height = 50;
  var scale = d3.scale.linear()
    .domain([0, 70])
    .rangeRound([0, width]);
  var capitalize = function (name) { return name.substr(0, 1).toUpperCase() + name.substr(1).toLowerCase(); };

  function chart (selection) {
    selection.each(function (data) {
      var x0 = 0;
      data.forEach(function (d) {
        d.x0 = x0 || 0;
        d.x1 = x0 + scale(d.value || 0);
        x0 = d.x1;
      });

      var svg = d3.select(this).selectAll('svg').data([data]);
      svg.enter().append('svg')
        .attr('class', 'votebar')
        .attr('width', width)
        .attr('height', height);

      var rect = svg.selectAll('.bar').data(data);
      var bar = rect.enter()
        .append('g')
          .attr('class', 'bar');

      bar.append('rect')
        .attr('x', function (d) { return d.x0; })
        .attr('y', 0)
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', height - 10)
        .attr('fill', function (d) { return d.color; })
        .append('title')
          .text(function (d) { return capitalize(d.name); });

      bar.append('text')
        .attr('class', 'name')
        .text(function (d) { return capitalize(d.name); })
        .attr('x', function (d) { return d.x0; })
        .attr('y', height)
        .style('fill-opacity', function (d) { return d.value >= 4 ? 1 : 0; });

      bar.append('text')
        .attr('class', 'count')
        .text(function (d) { return d.value; })
        .attr('x', function (d) { return d.x0 + (d.x1 - d.x0) / 2; })
        .attr('y', height / 2 - 1)
        .style('fill-opacity', function (d) { return d.value > 0 ? 1 : 0; });

      rect
        .transition()
        .style('opacity', 1);

      rect.select('rect')
        .transition()
        .attr('x', function (d) { return d.x0; })
        .attr('width', function (d) { return d.x1 - d.x0; });

      rect.select('text.name')
        .transition()
        .attr('x', function (d) { return d.x0; })
        .style('fill-opacity', function (d) { return d.value >= 4 ? 1 : 0; });

      rect.select('text.count')
        .text(function (d) { return d.value; })
        .transition()
        .attr('x', function (d) { return d.x0 + (d.x1 - d.x0) / 2; })
        .style('fill-opacity', function (d) { return d.value > 0 ? 1 : 0; });

      rect.exit()
        .style('opacity', 0);
    });
  }

  chart.width = function (value) {
    if (!arguments.length) return width;
    if (value) width = value;
    return chart;
  };

  chart.height = function (value) {
    if (!arguments.length) return height;
    if (value) height = value;
    return chart;
  };

  chart.maxDomain = function (value) {
    if (!arguments.length) return scale;
    if (value) scale.domain([0, value]).rangeRound([0, width]);
    return chart;
  };

  return chart;
};
