function Cursor()
{
  this.pos = {x:0,y:0};
  this.translation = null;
  this.operation = null;

  this.translate = function(from = null,to = null, multi = false)
  {    
    if((from || to) && this.translation == null){ this.translation = {multi:multi}; console.log("Begin translation") }

    if(from){ this.translation.from = from; }
    if(to){ this.translation.to = to; }

    if(!from && !to){
      this.translation = null;
    }
  }

  this.down = function(e)
  {
    this.pos = this.pos_from_event(e)

    // Translation
    if(dotgrid.tool.vertex_at(this.pos)){
      this.translate(this.pos,this.pos,e.shiftKey)
    }

    dotgrid.guide.refresh();
    dotgrid.interface.refresh();
    e.preventDefault();
  }

  this.move = function(e)
  {
    this.pos = this.pos_from_event(e)

    // Translation
    if(this.translation){
      this.translate(null,this.pos)
    }

    dotgrid.guide.refresh();
    dotgrid.interface.refresh();
    e.preventDefault();
  }

  this.up = function(e)
  {
    this.pos = this.pos_from_event(e)

    if(e.altKey){ dotgrid.tool.remove_segments_at(this.pos); return; }

    // Translation
    if(this.translation){
      if(this.translation.multi){ dotgrid.tool.translate_multi(this.translation.from,this.translation.to); }
      else{ dotgrid.tool.translate(this.translation.from,this.translation.to); }
    }
    else if(e.target.id == "guide"){
      dotgrid.tool.add_vertex({x:this.pos.x,y:this.pos.y});
    }
    this.translate();

    dotgrid.interface.refresh();
    dotgrid.guide.refresh();
    e.preventDefault();
  }

  this.alt = function(e)
  {
    this.pos = this.pos_from_event(e)

    dotgrid.tool.remove_segments_at(this.pos);
    e.preventDefault();

    setTimeout(() => { dotgrid.tool.clear(); },150);
  }

  // Position Mods

  this.pos_from_event = function(e)
  {
    return this.pos_snap(this.pos_relative({x:e.clientX,y:e.clientY}))
  }

  this.pos_relative = function(pos)
  {
    return {
      x:pos.x - dotgrid.guide.el.offsetLeft,
      y:pos.y - dotgrid.guide.el.offsetTop
    };
  }

  this.pos_snap = function(pos)
  { 
    var grid = dotgrid.tool.settings.size.width/dotgrid.grid_x;
    return {
      x:clamp(step(pos.x,grid),grid,dotgrid.tool.settings.size.width),
      y:clamp(step(pos.y,grid),grid,dotgrid.tool.settings.size.height+grid)
    };
  }
}