// Generated by CoffeeScript 1.6.1
(function() {
  var GraphDataLoader,
    _this = this,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Graph = (function() {

    Graph.colors = [[0, 155, 0, 0.6], [0, 0, 200, 0.6], [155, 0, 0, 0.6]];

    function Graph(selector, url, keys) {
      var tooltipHolder,
        _this = this;
      this.keys = keys;
      this.hideTooltip = function() {
        return Graph.prototype.hideTooltip.apply(_this, arguments);
      };
      this.showTooltip = function(e, x, y) {
        return Graph.prototype.showTooltip.apply(_this, arguments);
      };
      this.getPointNear = function(x, key) {
        if (key == null) {
          key = _this.keys[0];
        }
        return Graph.prototype.getPointNear.apply(_this, arguments);
      };
      this.getRecordNear = function(time) {
        return Graph.prototype.getRecordNear.apply(_this, arguments);
      };
      this.renderTooltip = function(x) {
        if (x == null) {
          x = -1;
        }
        return Graph.prototype.renderTooltip.apply(_this, arguments);
      };
      this.draw = function(debug) {
        if (debug == null) {
          debug = false;
        }
        return Graph.prototype.draw.apply(_this, arguments);
      };
      this.render = function(debug) {
        if (debug == null) {
          debug = false;
        }
        return Graph.prototype.render.apply(_this, arguments);
      };
      this.el = $(selector);
      this.canvas = $("<canvas>");
      this.ctx = this.canvas[0].getContext("2d");
      this.overlay = $("<canvas>");
      this.overlayCtx = this.overlay[0].getContext("2d");
      this.el.append(this.canvas);
      this.el.append(this.overlay);
      this.dataMargin = 0.1;
      this.canvases = $("canvas", this.el);
      this.canvases.css({
        position: "absolute"
      });
      this.canvases.attr({
        width: this.el.outerWidth(),
        height: this.el.outerHeight()
      });
      this.records = [];
      this.points = {};
      _.each(this.keys, function(key) {
        return _this.points[key] = [];
      });
      GraphDataLoader.load(url, function(data) {
        _this.records = _.map(data, function(record) {
          var hasRecord, obj;
          obj = {};
          hasRecord = false;
          _.each(_this.keys, function(key) {
            if (record.hasOwnProperty(key)) {
              obj[key] = parseFloat(record[key]);
              if (!isNaN(obj[key])) {
                return hasRecord = true;
              }
            }
          });
          obj.datestamp = parseFloat(record.datestamp);
          if (isNaN(obj.datestamp) || !hasRecord) {
            obj = null;
          }
          return obj;
        });
        _this.records = _.without(_this.records, null);
        _this.records = _this.records.sort(function(a, b) {
          if (a.datestamp > b.datestamp) {
            return 1;
          } else {
            return -1;
          }
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
          min -= delta * _this.dataMargin;
          max += delta * _this.dataMargin;
          if (min < 0) {
            min = 0;
          }
          _this.min[key] = min;
          return _this.max[key] = max;
        });
        _this.render(true);
        _this.el.bind("mousemove", function(e) {
          var x, y;
          x = e.pageX - _this.el.offset().left;
          y = e.pageY - _this.el.offset().top;
          return $(document).trigger("showTooltip", [x, y]);
        });
        _this.el.bind("mouseout", function() {
          return $(document).trigger("hideTooltip");
        });
        $(document).bind("showTooltip", _this.showTooltip);
        return $(document).bind("hideTooltip", _this.hideTooltip);
      });
      tooltipHolder = $("<div>");
      tooltipHolder.css({
        position: "absolute"
      });
      this.tooltip = $("<div>");
      this.tooltip.addClass("graph-tooltip");
      tooltipHolder.append(this.tooltip);
      this.el.append(tooltipHolder);
    }

    Graph.prototype.render = function(debug) {
      var _this = this;
      if (debug == null) {
        debug = false;
      }
      this.w = this.el.outerWidth();
      this.h = this.el.outerHeight();
      this.canvases.attr({
        width: this.w,
        height: this.h
      });
      this.ctx.clearRect(0, 0, this.w, this.h);
      if (!(this.records.length > 1)) {
        return;
      }
      _.each(this.keys, function(key, i) {
        var points;
        points = _.map(_this.records, function(record) {
          var x, y;
          if (record.hasOwnProperty(key)) {
            x = (record.datestamp - _this.minTime) / (_this.maxTime - _this.minTime) * _this.w;
            y = _this.h - (record[key] - _this.min[key]) / (_this.max[key] - _this.min[key]) * _this.h;
            return {
              x: x,
              y: y,
              record: record
            };
          } else {
            return {
              x: NaN,
              y: NaN,
              record: record
            };
          }
        });
        points = _.without(points, null);
        return _this.points[key] = points;
      });
      return this.draw(debug);
    };

    Graph.prototype.draw = function(debug) {
      var _this = this;
      if (debug == null) {
        debug = false;
      }
      return _.each(this.keys, function(key, i) {
        var c, f, rgba;
        _this.ctx.moveTo(0, _this.h);
        _this.ctx.beginPath();
        c = _this.color ? _this.color : Graph.colors[i];
        f = _.map(c, function(_c) {
          return Graph.to255(_c);
        });
        _this.ctx.strokeStyle = rgba = "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", 0.6)";
        _this.ctx.fillStyle = "rgba(" + f[0] + ", " + f[1] + ", " + f[2] + ", 0.4)";
        _.each(_this.points[key], function(point, index) {
          if (debug) {
            if (isNaN(point.x)) {
              console.log(point);
            }
          }
          if (!(isNaN(point.x) || isNaN(point.y))) {
            return _this.ctx.lineTo(point.x, point.y);
          }
        });
        _this.ctx.stroke();
        _this.ctx.lineTo(_this.w, _this.h);
        _this.ctx.lineTo(0, _this.h);
        return _this.ctx.fill();
      });
    };

    Graph.prototype.renderTooltip = function(x) {
      if (x == null) {
        x = -1;
      }
      this.overlayCtx.clearRect(0, 0, this.w, this.h);
      if (this.tooltipShowing && x >= 0) {
        this.overlayCtx.lineWidth = 2;
        this.overlayCtx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(x, 0);
        this.overlayCtx.lineTo(x, this.h);
        return this.overlayCtx.stroke();
      }
    };

    Graph.prototype.getRecordNear = function(time) {
      var nearest, times,
        _this = this;
      times = _.sortBy(this.records, function(record) {
        return Math.abs(record.datetime - time);
      });
      return nearest = times[0];
    };

    Graph.prototype.getPointNear = function(x, key) {
      var max, min, nearest, points,
        _this = this;
      if (key == null) {
        key = this.keys[0];
      }
      min = 0;
      max = this.w;
      points = _.sortBy(this.points[key], function(point) {
        return Math.abs(point.x - x);
      });
      return nearest = points[0];
    };

    Graph.prototype.showTooltip = function(e, x, y) {
      var label, nearest;
      this.tooltipShowing = true;
      this.tooltip.css({
        left: x + 20,
        top: this.getPointNear(x).y
      });
      nearest = this.getPointNear(x);
      if ((nearest != null ? nearest.record : void 0) == null) {
        return;
      }
      label = "";
      _.each(this.keys, function(key) {
        return label += "<div class='graph-tooltip-label'>" + key + ": " + nearest.record[key] + "</div>";
      });
      this.tooltip.html(label);
      this.tooltip.show();
      return this.renderTooltip(x);
    };

    Graph.prototype.hideTooltip = function() {
      this.tooltipShowing = false;
      this.renderTooltip();
      return this.tooltip.hide();
    };

    Graph.to255 = function(n) {
      return Math.round(255 - (255 - n) * 0.1);
    };

    return Graph;

  })();

  this.HorizonGraph = (function(_super) {

    __extends(HorizonGraph, _super);

    function HorizonGraph(selector, url, keys) {
      var _this = this;
      this.keys = keys;
      this.scaleY = function(y) {
        return HorizonGraph.prototype.scaleY.apply(_this, arguments);
      };
      this.drawBelow = function(points, i, avgY) {
        return HorizonGraph.prototype.drawBelow.apply(_this, arguments);
      };
      this.drawAbove = function(points, i, avgY) {
        return HorizonGraph.prototype.drawAbove.apply(_this, arguments);
      };
      this._draw = function(debug) {
        if (debug == null) {
          debug = false;
        }
        return HorizonGraph.prototype._draw.apply(_this, arguments);
      };
      this.bands = 5;
      HorizonGraph.__super__.constructor.call(this, selector, url, this.keys);
      this.dataMargin = 0.5;
      this.superDraw = this.draw;
      this.draw = this._draw;
    }

    HorizonGraph.prototype._draw = function(debug) {
      var _this = this;
      if (debug == null) {
        debug = false;
      }
      console.log("draw!");
      return _.each(this.keys, function(key, i) {
        var avgy, ys, _i, _ref, _results;
        ys = _.pluck(_this.points[key], "y");
        avgy = (_.reduce(ys, function(sum, y) {
          return sum + y;
        })) / ys.length;
        _results = [];
        for (i = _i = 0, _ref = _this.bands; 0.5 > 0 ? _i <= _ref : _i >= _ref; i = _i += 0.5) {
          _this.drawAbove(_this.points[key], i, avgy);
          _results.push(_this.drawBelow(_this.points[key], i, avgy));
        }
        return _results;
      });
    };

    HorizonGraph.prototype.drawAbove = function(points, i, avgY) {
      var a, c,
        _this = this;
      this.ctx.moveTo(0, 0);
      c = Graph.colors[1];
      a = i / this.bands * 0.5;
      this.ctx.fillStyle = "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + a + ")";
      this.ctx.beginPath();
      _.each(points, function(point, index) {
        var _y;
        if (!(isNaN(point.x) || isNaN(point.y))) {
          _y = (point.y - avgY) * _this.bands + _this.h / 2;
          _y -= (i / _this.bands) * _this.h;
          if (_y < 0) {
            _y = 0;
          }
          if (_y > _this.h) {
            _y = _this.h;
          }
          return _this.ctx.lineTo(point.x, _y);
        }
      });
      this.ctx.lineTo(this.w, 0);
      this.ctx.lineTo(0, 0);
      return this.ctx.fill();
    };

    HorizonGraph.prototype.drawBelow = function(points, i, avgY) {
      var a, c,
        _this = this;
      this.ctx.moveTo(0, this.h);
      c = Graph.colors[2];
      a = i / this.bands * 0.5;
      this.ctx.fillStyle = "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + a + ")";
      this.ctx.beginPath();
      _.each(points, function(point, index) {
        var _y;
        if (!(isNaN(point.x) || isNaN(point.y))) {
          _y = (point.y - avgY) * _this.bands + _this.h / 2;
          _y += (i / _this.bands) * _this.h;
          if (_y < 0) {
            _y = 0;
          }
          if (_y > _this.h) {
            _y = _this.h;
          }
          return _this.ctx.lineTo(point.x, _y);
        }
      });
      this.ctx.lineTo(this.w, this.h);
      this.ctx.lineTo(0, this.h);
      return this.ctx.fill();
    };

    HorizonGraph.prototype.scaleY = function(y) {
      var p;
      p = y / this.h;
      p *= this.bands;
      p -= this.bands * .5;
      return p * this.h;
    };

    return HorizonGraph;

  })(Graph);

  GraphDataLoader = (function() {

    GraphDataLoader.loaders = [];

    function GraphDataLoader() {}

    GraphDataLoader.load = function(url, callback) {
      var existing, loader;
      existing = _.find(GraphDataLoader.loaders, function(loader) {
        return loader.url === url;
      });
      if (existing) {
        if (existing.loaded) {
          return callback(existing.data);
        } else {
          return existing.listeners.push(callback);
        }
      } else {
        loader = {
          url: url,
          loaded: false,
          data: [],
          listeners: [callback]
        };
        GraphDataLoader.loaders.push(loader);
        return GraphDataLoader.fetch(loader);
      }
    };

    GraphDataLoader.fetch = function(loader) {
      var _this = this;
      return $.getJSON(loader.url, function(data) {
        loader.loaded = true;
        loader.data = data;
        _.each(loader.listeners, function(listener) {
          return listener(data);
        });
        return loader.listeners = [];
      });
    };

    return GraphDataLoader;

  })();

}).call(this);
