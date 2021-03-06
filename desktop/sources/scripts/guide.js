function Guide()
{
  this.el = document.createElement("canvas");
  this.el.id = "guide";
  this.el.width = 640;
  this.el.height = 640;
  this.el.style.width = "320px";
  this.el.style.height = "320px";
  this.show_extras = true;

  this.scale = 2; // require('electron').remote.getCurrentWindow().scaleFactor;

  this.start = function()
  {
    this.clear();
    this.refresh();
  }
  
  this.refresh = function()
  {
    this.clear();
  
    if(dotgrid.tool.index == 2){ this.draw_markers() ; this.draw_vertices() }
    this.draw_path(new Generator(dotgrid.tool.layers[2],dotgrid.tool.styles[2]).toString({x:0,y:0},this.scale),dotgrid.tool.styles[2])
    if(dotgrid.tool.index == 1){ this.draw_markers() ; this.draw_vertices() }
    this.draw_path(new Generator(dotgrid.tool.layers[1],dotgrid.tool.styles[1]).toString({x:0,y:0},this.scale),dotgrid.tool.styles[1])
    if(dotgrid.tool.index == 0){ this.draw_markers(); this.draw_vertices() }
    this.draw_path(new Generator(dotgrid.tool.layers[0],dotgrid.tool.styles[0]).toString({x:0,y:0},this.scale),dotgrid.tool.styles[0])

    this.draw_handles()
    this.draw_translation();
    this.draw_cursor();  
    this.draw_preview();
  }

  this.clear = function()
  {
    this.el.getContext('2d').clearRect(0, 0, this.el.width*this.scale, this.el.height*this.scale);
  }

  this.toggle = function()
  {
    this.show_extras = this.show_extras ? false : true;
    this.refresh()
  }

  this.resize = function(size)
  {
    var offset = 15
    this.el.width = (size.width+offset)*this.scale;
    this.el.height = (size.height+(offset*2))*this.scale;
    this.el.style.width = (size.width+offset)+"px";
    this.el.style.height = (size.height+(offset*2))+"px";

    this.refresh();
  }

  this.draw_handles = function()
  {
    if(!this.show_extras){ return; }

    for(segment_id in dotgrid.tool.layer()){
      var segment = dotgrid.tool.layer()[segment_id];
      for(vertex_id in segment.vertices){
        var vertex = segment.vertices[vertex_id];
        this.draw_handle(vertex);
      }
    }
  }

  this.draw_vertices = function()
  {
    for(id in dotgrid.tool.vertices){
      this.draw_vertex(dotgrid.tool.vertices[id]);
    }
  }

  this.draw_markers = function()
  {
    if(!this.show_extras){ return; }

    var cursor = {x:parseInt(dotgrid.cursor.pos.x/dotgrid.grid_width),y:parseInt(dotgrid.cursor.pos.y/dotgrid.grid_width)}

    for (var x = dotgrid.grid_x-1; x >= 0; x--) {
      for (var y = dotgrid.grid_y; y >= 0; y--) {
        var is_step = x % dotgrid.block_x == 0 && y % dotgrid.block_y == 0;

        // Color
        var color = is_step ? dotgrid.theme.active.f_med : dotgrid.theme.active.f_low;
        if((y == 0 || y == dotgrid.grid_y) && cursor.x == x+1){ color = dotgrid.theme.active.f_high; }
        else if((x == 0 || x == dotgrid.grid_x-1) && cursor.y == y+1){ color = dotgrid.theme.active.f_high; }

        this.draw_marker({
          x:parseInt(x * dotgrid.grid_width) + dotgrid.grid_width,
          y:parseInt(y * dotgrid.grid_height) + dotgrid.grid_height
        },is_step ? 2.5 : 1.5,color);
      }
    }
  }

  this.draw_vertex = function(pos, radius = 5)
  {
    var ctx = this.el.getContext('2d');
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc((pos.x * this.scale), (pos.y * this.scale), radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotgrid.theme.active.f_med;
    ctx.fill();
    ctx.closePath();
  }

  this.draw_handle = function(pos, radius = 6)
  {
    var ctx = this.el.getContext('2d');

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap="round";
    ctx.arc(Math.abs(pos.x * -this.scale), Math.abs(pos.y * this.scale), radius+3, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotgrid.theme.active.f_high;
    ctx.fill();
    ctx.strokeStyle = dotgrid.theme.active.f_high;
    ctx.stroke(); 
    ctx.closePath(); 

    ctx.beginPath();
    ctx.arc((pos.x * this.scale), (pos.y * this.scale), radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotgrid.theme.active.f_low;
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc((pos.x * this.scale), (pos.y * this.scale), radius-3, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotgrid.theme.active.f_high;
    ctx.fill();
    ctx.closePath();
  }

  this.draw_marker = function(pos,radius = 1,color)
  {
    var ctx = this.el.getContext('2d');
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(pos.x * this.scale, pos.y * this.scale, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }

  this.draw_path = function(path,style)
  {
    var ctx = this.el.getContext('2d');
    var p = new Path2D(path);

    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.thickness * this.scale;
    ctx.lineCap = style.strokeLinecap;
    ctx.lineJoin = style.strokeLinejoin;

    if(style.fill && style.fill != "none"){
      ctx.fillStyle = style.color
      ctx.fill(p);
    }
    if(style.strokeLineDash){
      ctx.setLineDash(style.strokeLineDash);
    }
    ctx.stroke(p);
    ctx.setLineDash([0,0]); 
  }

  this.draw_translation = function()
  {   
    if(!dotgrid.cursor.translation){ return; }

    var ctx = this.el.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo((dotgrid.cursor.translation.from.x * this.scale),(dotgrid.cursor.translation.from.y * this.scale));
    ctx.lineTo((dotgrid.cursor.translation.to.x * this.scale),(dotgrid.cursor.translation.to.y * this.scale));
    ctx.lineCap="round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = dotgrid.theme.active.b_inv;
    ctx.setLineDash([5,10]); 
    ctx.stroke();
    ctx.setLineDash([0,0]); 
    ctx.closePath();
  }

  this.draw_cursor = function(pos = dotgrid.cursor.pos,radius = dotgrid.tool.style().thickness-1)
  {
    var ctx = this.el.getContext('2d');

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.arc(Math.abs(pos.x * -this.scale), Math.abs(pos.y * this.scale), 3, 0, 2 * Math.PI, false);
    ctx.fillStyle = dotgrid.theme.active.f_low;
    ctx.fill(); 
    ctx.closePath(); 

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.arc(Math.abs(pos.x * -this.scale), Math.abs(pos.y * this.scale), clamp(radius,5,100), 0, 2 * Math.PI, false);
    ctx.strokeStyle = dotgrid.theme.active.f_med;
    ctx.stroke(); 
    ctx.closePath(); 
  }

  this.draw_preview = function()
  {
    var operation = dotgrid.cursor.operation && dotgrid.cursor.operation.cast ? dotgrid.cursor.operation.cast : null

    if(!dotgrid.tool.can_cast(operation)){ return; }
    if(operation == "close"){ return; }

    var path  = new Generator([{vertices:dotgrid.tool.vertices,type:operation}]).toString({x:0,y:0},2)
    var style = {
      color:dotgrid.theme.active.f_med,
      thickness:2,
      strokeLinecap:"round",
      strokeLinejoin:"round",
      strokeLineDash:[5, 15]
    }
    this.draw_path(path,style)
  }

  function pos_is_equal(a,b){ return a && b && Math.abs(a.x) == Math.abs(b.x) && Math.abs(a.y) == Math.abs(b.y) }
  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
}
