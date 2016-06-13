export default
/*@ngInject*/
function (context) {
  if(!context || !context.legendColors[0] || !context.legendColors[0].fill) return;

  var drawRoundedRectangle = function(ctx,x,y,width,height,radius){
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  if(!context.labels) return;

  context.labels = context.labels.filter(label => {
    labelSlice = label.split(" ");
    return parseInt(labelSlice[labelSlice.length-1]);
  });

  drawRoundedRectangle(context.ctx,context.x,context.y - context.height/2,context.width, (context.labels.length+1) * (20+context.yPadding),context.cornerRadius);
  var ctx = context.ctx;
  ctx.fillStyle = context.fillColor;
  ctx.fill();
  ctx.closePath();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = context.titleTextColor;
  ctx.font = context.titleFont;

  ctx.fillText(context.title,context.x + context.xPadding, context.getLineHeight(0));

  ctx.font = context.font;
  var labelSlice;

  _.each(context.labels,function(label,index){
    ctx.fillStyle = context.textColor;
    ctx.fillText(label,context.x + context.xPadding + context.fontSize + 3, context.getLineHeight(index + 1));

    //A bit gnarly, but clearing this rectangle breaks when using explorercanvas (clears whole canvas)
    //ctx.clearRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);
    //Instead we'll make a white filled block to put the legendColour palette over.

    ctx.fillStyle = context.legendColorBackground;
    ctx.fillRect(context.x + context.xPadding, context.getLineHeight(index + 1) - context.fontSize/2, context.fontSize, context.fontSize);

    ctx.fillStyle = context.legendColors[index].fill;
    ctx.fillRect(context.x + context.xPadding, context.getLineHeight(index + 1) - context.fontSize/2, context.fontSize, context.fontSize);


  },context);
}