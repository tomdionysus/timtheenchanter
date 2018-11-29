class Mob {
	constructor(options) {
		options = options || {}
		this.asset = options.asset
		this.tileWidth = options.tileWidth || 64
		this.tileHeight = options.tileHeight || 64
		this.tile = [options.tileX || 0,options.tileY || 0]
		this.offsetX = options.offsetX || 0
		this.offsetY = options.offsetY || 0
		this.redraw = true
	}

	draw(drawContext, areaOffsetX, areaOffsetY) {
		drawContext.drawImage(
			this.asset.element, 
			this.tile[0]*this.tileWidth, 
			this.tile[1]*this.tileHeight, 
			this.tileWidth, 
			this.tileHeight,
			areaOffsetX+this.offsetX, areaOffsetY+this.offsetY,
			this.tileWidth, 
			this.tileHeight
		)
		this.redraw = false
	}

	setTile(x,y) {
		this.tile[0] = x
		this.tile[1] = y
		this.redraw = true
	}
}