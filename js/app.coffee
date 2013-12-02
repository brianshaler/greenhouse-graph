class @Graph
  @colors: [
    [0, 155, 0, 0.6]
    [0, 0, 200, 0.6]
    [155, 0, 0, 0.6]
  ]
  
  constructor: (selector, url, @keys) ->
    @el = $ selector
    @canvas = $ "<canvas>"
    @ctx = @canvas[0].getContext "2d"
    @overlay = $ "<canvas>"
    @overlayCtx = @overlay[0].getContext "2d"
    @el.append @canvas
    @el.append @overlay
    
    @dataMargin = 0.1
    
    @canvases = $ "canvas", @el
    @canvases.css
      position: "absolute"
    @canvases.attr
      width: @el.outerWidth()
      height: @el.outerHeight()
    
    @records = []
    @points = {}
    _.each @keys, (key) => @points[key] = []
    
    GraphDataLoader.load url, (data) =>
      @records = _.map data, (record) =>
        obj = {}
        hasRecord = false
        _.each @keys, (key) =>
          if record.hasOwnProperty key
            obj[key] = parseFloat record[key]
            hasRecord = true unless isNaN obj[key]
        obj.datestamp = parseFloat record.datestamp
        obj = null if isNaN(obj.datestamp) or !hasRecord
        obj
      
      @records = _.without @records, null
      
      @records = @records.sort (a, b) ->
        if a.datestamp > b.datestamp then 1 else -1
      
      @times = _.pluck @records, "datestamp"
      @minTime = _.min @times
      @maxTime = _.max @times
      
      @min = {}
      @max = {}
      _.each @keys, (key) =>
        values = _.pluck @records, key
        min = _.min values
        max = _.max values
        delta = max-min
        min -= delta*@dataMargin
        max += delta*@dataMargin
        min = 0 if min < 0
        @min[key] = min
        @max[key] = max
      
      @render true
      @el.bind "mousemove", (e) =>
        x = e.pageX - @el.offset().left
        y = e.pageY - @el.offset().top
        $(document).trigger "showTooltip", [x, y]
      @el.bind "mouseout", =>
        $(document).trigger "hideTooltip"
        #@hideTooltip()
      $(document).bind "showTooltip", @showTooltip
      $(document).bind "hideTooltip", @hideTooltip
    
    tooltipHolder = $ "<div>"
    tooltipHolder.css
      position: "absolute"
    #@el.append tooltipHolder
    @tooltip = $ "<div>"
    @tooltip.addClass "graph-tooltip"
    tooltipHolder.append @tooltip
    @el.append tooltipHolder
  
  render: (debug = false) =>
    @w = @el.outerWidth()
    @h = @el.outerHeight()
    @canvases.attr
      width: @w
      height: @h
    
    @ctx.clearRect 0, 0, @w, @h
    
    return unless @records.length > 1
    
    _.each @keys, (key, i) =>
      points = _.map @records, (record) =>
        if record.hasOwnProperty key
          x = (record.datestamp-@minTime)/(@maxTime-@minTime) * @w
          y = @h - (record[key]-@min[key])/(@max[key]-@min[key]) * @h
          x: x, y: y, record: record
        else
          x: NaN, y: NaN, record: record
      
      points = _.without points, null
      @points[key] = points
    
    @draw(debug)
  
  draw: (debug = false) =>
    _.each @keys, (key, i) =>
      @ctx.moveTo 0, @h
      @ctx.beginPath()
      c = if @color
        @color
      else
        Graph.colors[i]
      f = _.map c, (_c) -> Graph.to255 _c
      @ctx.strokeStyle = rgba = "rgba(#{c[0]}, #{c[1]}, #{c[2]}, 0.6)"
      @ctx.fillStyle = "rgba(#{f[0]}, #{f[1]}, #{f[2]}, 0.4)"
      _.each @points[key], (point, index) =>
        if debug
          if isNaN point.x
            console.log point
          #console.log "Point #{index}: #{point.x}, #{point.y}"
        unless isNaN(point.x) or isNaN(point.y)
          @ctx.lineTo point.x, point.y
      @ctx.stroke()
      @ctx.lineTo @w, @h
      @ctx.lineTo 0, @h
      @ctx.fill()
  
  renderTooltip: (x = -1) =>
    @overlayCtx.clearRect 0, 0, @w, @h
    
    if @tooltipShowing and x >= 0
      @overlayCtx.lineWidth = 2
      @overlayCtx.strokeStyle = "rgba(0, 0, 0, 0.2)"
      @overlayCtx.beginPath()
      @overlayCtx.moveTo x, 0
      @overlayCtx.lineTo x, @h
      @overlayCtx.stroke()
  
  getRecordNear: (time) =>
    times = _.sortBy @records, (record) =>
      Math.abs record.datetime - time
    nearest = times[0]
  
  getPointNear: (x, key = @keys[0]) =>
    min = 0
    max = @w
    points = _.sortBy @points[key], (point) =>
      Math.abs point.x - x
    nearest = points[0]
  
  showTooltip: (e, x, y) =>
    @tooltipShowing = true
    @tooltip.css
      left: x+20
      top: @getPointNear(x).y
    
    nearest = @getPointNear x
    return unless nearest?.record?
    label = ""
    
    _.each @keys, (key) ->
      label += "<div class='graph-tooltip-label'>#{key}: #{nearest.record[key]}</div>"
    
    @tooltip.html label
    
    @tooltip.show()
    @renderTooltip x
  
  hideTooltip: =>
    @tooltipShowing = false
    @renderTooltip()
    @tooltip.hide()
  
  @to255: (n) -> Math.round 255 - (255-n)*0.1

class @HorizonGraph extends Graph
  constructor: (selector, url, @keys) ->
    @bands = 5
    super selector, url, @keys
    @dataMargin = 0.5
    
    @superDraw = @draw
    @draw = @_draw
  
  _draw: (debug = false) =>
    console.log "draw!"
    _.each @keys, (key, i) =>
      ys = _.pluck @points[key], "y"
      avgy = (_.reduce ys, (sum, y) -> sum+y)/ys.length
      
      for i in [0..@bands] by 0.5
        @drawAbove @points[key], i, avgy
        @drawBelow @points[key], i, avgy
  
  drawAbove: (points, i, avgY) =>
    @ctx.moveTo 0, 0
    c = Graph.colors[1]
    a = i/@bands * 0.5
    @ctx.fillStyle = "rgba(#{c[0]}, #{c[1]}, #{c[2]}, #{a})"
    @ctx.beginPath()
    _.each points, (point, index) =>
      unless isNaN(point.x) or isNaN(point.y)
        _y = (point.y-avgY)*@bands + @h / 2
        _y -= (i/@bands)*@h
        _y = 0 if _y < 0
        _y = @h if _y > @h
        #console.log "Point #{index}: #{point.x}, #{_y}"
        @ctx.lineTo point.x, _y
    @ctx.lineTo @w, 0
    @ctx.lineTo 0, 0
    @ctx.fill()
    
  drawBelow: (points, i, avgY) =>
    @ctx.moveTo 0, @h
    c = Graph.colors[2]
    a = i/@bands * 0.5
    @ctx.fillStyle = "rgba(#{c[0]}, #{c[1]}, #{c[2]}, #{a})"
    @ctx.beginPath()
    _.each points, (point, index) =>
      unless isNaN(point.x) or isNaN(point.y)
        _y = (point.y-avgY)*@bands + @h / 2
        _y += (i/@bands)*@h
        _y = 0 if _y < 0
        _y = @h if _y > @h
        @ctx.lineTo point.x, _y
    @ctx.lineTo @w, @h
    @ctx.lineTo 0, @h
    @ctx.fill()
  
  scaleY: (y) =>
    p = y/@h
    p *= @bands
    p -= @bands*.5
    p*@h
    

class GraphDataLoader
  @loaders: []
  constructor: ->
    
  
  @load: (url, callback) ->
    existing = _.find GraphDataLoader.loaders, (loader) -> loader.url == url
    if existing
      if existing.loaded
        callback existing.data
      else
        existing.listeners.push callback
    else
      loader =
        url: url
        loaded: false
        data: []
        listeners: [callback]
      GraphDataLoader.loaders.push loader
      GraphDataLoader.fetch loader
  
  @fetch: (loader) ->
    $.getJSON loader.url, (data) =>
      loader.loaded = true
      loader.data = data
      _.each loader.listeners, (listener) ->
        listener data
      loader.listeners = []
