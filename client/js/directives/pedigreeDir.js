(function () {
  'use strict';

  // http://bl.ocks.org/mbostock/2966094
  // http://www.sitepoint.com/creating-charting-directives-using-angularjs-d3-js/
  app.directive('pedigree', ['$state', 'd3', 'moment', function ($state, d3, moment) {
    return {
      restrict: 'E',
      templateUrl: 'html/directives/pedigree.html',
      scope: {
        data: '=',
        depth: '=',
        link: '='
      },

      link: function (scope, elem) {
        var rawSvg = elem.find('svg')[0];
        var chartData = _.cloneDeep(scope.data);

        var findMaxParents = function (data, maxParents) {
          maxParents = maxParents || 0;

          // if there are grandparents, let's see how many there are
          if (data.parents && data.parents.length > 0) {
            data.parents.forEach(function (parent) {
              maxParents = findMaxParents(parent, maxParents);
            });
          }

          if (data.parents && data.parents.length > maxParents) {
            maxParents = data.parents.length;
          }
          return maxParents;
        };

        var limitDepth = function (data, maxDepth) {
          maxDepth = maxDepth || 3;
          maxDepth -= 1;
          if (maxDepth <= 0) {
            delete data.parents;
          }

          if (data.parents && data.parents.length > 0) {
            data.parents.forEach(function (parent) {
              limitDepth(parent, maxDepth);
            });
          }
        };
        limitDepth(chartData, scope.depth);

        var elbow = function (d) {
          return 'M' + d.source.y + ',' + d.source.x +
                 'H' + d.target.y + 'V' + d.target.x +
                 (d.target.children ? '' : 'h' + margin.right);
        };

        var chartWidth = elem.find('svg').width(),
            chartHeight = elem.find('svg').height(),
            margin = {top: 10, right: chartWidth / 3, bottom: 10, left: 0},
            width = chartWidth - margin.left - margin.right,
            height = chartHeight - margin.top - margin.bottom,
            maxParents = findMaxParents(chartData);

        var svg = d3.select(rawSvg)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var tree = d3.layout.tree()
            .separation(function (a, b) {
              return a.parent === b.parent ? 1 : 1 - (1 / maxParents);
            })
            .children(function (d) {
              return d.parents;
            })
            .size([height, width]);

        var nodes = tree.nodes(chartData);

        svg.selectAll('.link')
            .data(tree.links(nodes))
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', elbow);

        var node = svg.selectAll('.node')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', function (d) {
              return 'translate(' + d.y + ',' + d.x + ')';
            });

        node.append('text')
            .attr('class', 'name')
            .attr('x', 8)
            .attr('y', -6)
            .text(function (d) {
              return d.name;
            })
            .on('click', function (d) {
              if (scope.link === true) {
                $state.go('main.person', {personId: d.gedId});
              }
            });

        node.append('text')
            .attr('x', 8)
            .attr('y', 13)
            .attr('class', 'about lifespan')
            .text(function (d) {
              var born = d.birth ? moment(d.birth.date) : moment('INVALID');
              var died = d.death ? moment(d.death.date) : moment('INVALID');
              if (born.isValid() && parseInt(born.format('YYYY')) > 999 && died.isValid() && parseInt(died.format('YYYY')) > 999) {
                return born.format('YYYY') + ' – ' + died.format('YYYY');
              } else if (born.isValid() && parseInt(born.format('YYYY')) > 999) {
                return born.format('YYYY') + ' – Unknown';
              } else if (died.isValid() && parseInt(died.format('YYYY')) > 999) {
                return 'Unknown – ' + died.format('YYYY');
              } else {
                return '';
              }
            });

        node.append('text')
            .attr('x', 8)
            .attr('y', 26)
            .attr('class', 'about location')
            .text(function (d) {
              return d.birth ? d.birth.location : '';
            });
      }
    };
  }]);

})();