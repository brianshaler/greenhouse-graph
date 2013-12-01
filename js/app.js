// Generated by CoffeeScript 1.6.1
(function() {
  var _this = this;

  this.Graph = (function() {

    function Graph(selector, url, keys) {
      var tooltipHolder,
        _this = this;
      this.keys = keys;
      this.hideTooltip = function() {
        return Graph.prototype.hideTooltip.apply(_this, arguments);
      };
      this.showTooltip = function(x, y) {
        return Graph.prototype.showTooltip.apply(_this, arguments);
      };
      this.render = function() {
        return Graph.prototype.render.apply(_this, arguments);
      };
      this.el = $(selector);
      this.canvas = $("<canvas>");
      this.canvas.css({
        position: "absolute"
      });
      this.el.append(this.canvas);
      this.ctx = this.canvas[0].getContext("2d");
      this.canvas.attr({
        width: this.el.outerWidth(),
        height: this.el.outerHeight()
      });
      $.getJSON(url, function(data) {
        _this.records = _.map(data.data, function(record) {
          var obj;
          obj = {};
          _.each(_this.keys, function(key) {
            return obj[key] = parseFloat(record[key]);
          });
          obj.datestamp = parseFloat(record.datestamp);
          return obj;
        });
        _this.times = _.pluck(_this.records, "datestamp");
        _this.minTime = _.min(_this.times);
        _this.maxTime = _.max(_this.times);
        _this.min = {};
        _this.max = {};
        _.each(_this.keys, function(key) {
          var delta, max, min, values;
          values = _.pluck(_this.records, key);
          min = _.min(values);
          max = _.max(values);
          delta = max - min;
          min -= delta * 0.1;
          max += delta * 0.01;
          console.log("min " + min + ", max " + max);
          if (min < 0) {
            min = 0;
          }
          _this.min[key] = min;
          return _this.max[key] = max;
        });
        return _this.render();
      });
      tooltipHolder = $("<div>");
      tooltipHolder.css({
        position: "absolute"
      });
      this.el.append(tooltipHolder);
      this.tooltip = $("<div>");
      this.tooltip.addClass("graph-tooltip");
      tooltipHolder.append(this.tooltip);
      this.el.bind("mousemove", function(e) {
        return _this.showTooltip(e.offsetX, e.offsetY);
      });
      this.el.bind("mouseout", function() {
        return _this.hideTooltip();
      });
    }

    Graph.prototype.render = function() {
      var colors,
        _this = this;
      this.w = this.canvas[0].width = this.el.outerWidth();
      this.h = this.canvas[0].height = this.el.outerHeight();
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.ctx.lineWidth = 2;
      colors = [[0, 155, 0, 0.6], [0, 0, 200, 0.6], [155, 0, 0, 0.6]];
      this.records = this.records.sort(function(a, b) {
        if (a.datestamp > b.datestamp) {
          return 1;
        } else {
          return -1;
        }
      });
      if (!(this.records.length > 1)) {
        return;
      }
      return _.each(this.keys, function(key, i) {
        var c, f, points, rgba;
        points = _.map(_this.records, function(record) {
          var x, y;
          x = (record.datestamp - _this.minTime) / (_this.maxTime - _this.minTime) * _this.w;
          y = _this.h - (record[key] - _this.min[key]) / (_this.max[key] - _this.min[key]) * _this.h;
          return {
            x: x,
            y: y
          };
        });
        _this.ctx.moveTo(0, _this.h);
        _this.ctx.beginPath();
        c = colors[i];
        f = _.map(c, function(_c) {
          return Graph.to255(_c);
        });
        _this.ctx.strokeStyle = rgba = "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", 0.6)";
        _this.ctx.fillStyle = "rgba(" + f[0] + ", " + f[1] + ", " + f[2] + ", 0.4)";
        _.each(points, function(point) {
          return _this.ctx.lineTo(point.x, point.y);
        });
        _this.ctx.stroke();
        _this.ctx.lineTo(_this.w, _this.h);
        _this.ctx.lineTo(0, _this.h);
        return _this.ctx.fill();
      });
    };

    Graph.prototype.showTooltip = function(x, y) {
      var label, nearest, p, times,
        _this = this;
      this.tooltip.css({
        left: x + 20,
        top: y
      });
      p = x / this.w;
      times = _.sortBy(this.records, function(record) {
        return Math.abs((record.datestamp - _this.minTime) / (_this.maxTime - _this.minTime) - p);
      });
      nearest = times[0];
      label = "";
      _.each(this.keys, function(key) {
        return label += "<div class='graph-tooltip-label'>" + key + ": " + nearest[key] + "</div>";
      });
      this.tooltip.html(label);
      this.tooltip.show();
      this.render();
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.h);
      return this.ctx.stroke();
    };

    Graph.prototype.hideTooltip = function() {
      return this.tooltip.hide();
    };

    Graph.to255 = function(n) {
      return Math.round(255 - (255 - n) * 0.1);
    };

    return Graph;

  })();

  $(document).ready(function() {
    var graph;
    graph = new Graph("#graph", "data.json", ["temp", "hum"]);
    window.graph = graph;
    return window.addEventListener("resize", function() {
      return graph.render();
    });
  });

}).call(this);
