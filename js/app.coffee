class @Graph
  constructor: (selector, url, @keys) ->
    @el = $ selector
    @canvas = $ "<canvas>"
    @canvas.css
      position: "absolute"
    @el.append @canvas
    @ctx = @canvas[0].getContext "2d"
    @canvas.attr
      width: @el.outerWidth()
      height: @el.outerHeight()
    
    $.getJSON url, (data) =>
      @records = _.map data.data, (record) =>
        obj = {}
        _.each @keys, (key) =>
          obj[key] = parseFloat record[key]
        obj.datestamp = parseFloat record.datestamp
        obj
      
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
        min -= delta*0.1
        max += delta*0.01
        console.log "min #{min}, max #{max}"
        min = 0 if min < 0
        @min[key] = min
        @max[key] = max
      
      @render()
    
    tooltipHolder = $ "<div>"
    tooltipHolder.css
      position: "absolute"
    @el.append tooltipHolder
    @tooltip = $ "<div>"
    @tooltip.addClass "graph-tooltip"
    tooltipHolder.append @tooltip
    
    @el.bind "mousemove", (e) =>
      @showTooltip e.offsetX, e.offsetY
    @el.bind "mouseout", =>
      @hideTooltip()
  
  render: =>
    @w = @canvas[0].width = @el.outerWidth()
    @h = @canvas[0].height = @el.outerHeight()
    @ctx.clearRect 0, 0, @w, @h
    @ctx.lineWidth = 2
    
    colors = [
      [0, 155, 0, 0.6]
      [0, 0, 200, 0.6]
      [155, 0, 0, 0.6]
    ]
    
    @records = @records.sort (a, b) ->
      if a.datestamp > b.datestamp then 1 else -1
    return unless @records.length > 1
    
    _.each @keys, (key, i) =>
      points = _.map @records, (record) =>
        x = (record.datestamp-@minTime)/(@maxTime-@minTime) * @w
        y = @h - (record[key]-@min[key])/(@max[key]-@min[key]) * @h
        x: x, y: y
      @ctx.moveTo 0, @h
      @ctx.beginPath()
      c = colors[i]
      f = _.map c, (_c) -> Graph.to255 _c
      @ctx.strokeStyle = rgba = "rgba(#{c[0]}, #{c[1]}, #{c[2]}, 0.6)"
      @ctx.fillStyle = "rgba(#{f[0]}, #{f[1]}, #{f[2]}, 0.4)"
      _.each points, (point) =>
        @ctx.lineTo point.x, point.y
      @ctx.stroke()
      @ctx.lineTo @w, @h
      @ctx.lineTo 0, @h
      @ctx.fill()
  
  showTooltip: (x, y) =>
    @tooltip.css
      left: x+20
      top: y
    
    p = x/@w
    times = _.sortBy @records, (record) =>
      Math.abs (record.datestamp-@minTime)/(@maxTime-@minTime) - p
    
    nearest = times[0]
    label = ""
    
    _.each @keys, (key) ->
      label += "<div class='graph-tooltip-label'>#{key}: #{nearest[key]}</div>"
    
    @tooltip.html label
    
    @tooltip.show()
    @render()
    @ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
    @ctx.beginPath()
    @ctx.moveTo x, 0
    @ctx.lineTo x, @h
    @ctx.stroke()
  
  hideTooltip: =>
    @tooltip.hide()
  
  @to255: (n) -> Math.round 255 - (255-n)*0.1

$(document).ready ->
  graph = new Graph "#graph", "data.json", ["temp", "hum"]
  window.graph = graph
  window.addEventListener "resize", ->
    graph.render()

