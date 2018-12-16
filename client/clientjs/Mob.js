class Mob {
	constructor(options) {
		options = options || {}
		this.asset = options.asset
		this.tileWidth = options.tileWidth || 64
		this.tileHeight = options.tileHeight || 64
		this.tile = [options.tileX || 0,options.tileY || 0]
		this.offsetX = options.offsetX || 0
		this.offsetY = options.offsetY || 0
		this.areaTileWidth = options.areaTileWidth || this.tileWidth || 64
		this.areaTileHeight = options.areaTileHeight || this.tileHeight || 64
		this.redraw = true

		this.invalid = { x1: 0xFFFFFFFF, x2: 0, y1: 0xFFFFFFFF, y2: 0}

		this.animations = {}
	}

	draw(context) {
		context.drawImage(
			this.asset.element, 
			this.tile[0]*this.tileWidth, 
			this.tile[1]*this.tileHeight, 
			this.tileWidth, 
			this.tileHeight,
			this.offsetX, 
			this.offsetY,
			this.tileWidth, 
			this.tileHeight
		)
		this.invalid = { x1: 0xFFFFFFFF, x2: 0, y1: 0xFFFFFFFF, y2: 0}

		this.redraw = false
	}

	setTile(x,y) {
		this.invalidateCurrent()
		this.tile[0] = x
		this.tile[1] = y
		this.redraw = true
	}

	moveTo(x,y) {
		this.invalidateCurrent()
		this.offsetX = x
		this.offsetY = y
		this.invalidateCurrent()
		this.redraw = true
	}

	invalidateCurrent() {
		this.invalidate(this.offsetX,this.offsetY,this.tileWidth,this.tileHeight)
	}

	invalidate(x,y,w,h) {
		this.invalid.x1 = Math.min(this.invalid.x1, x)
		this.invalid.x2 = Math.max(this.invalid.x2, x+w)
		this.invalid.y1 = Math.min(this.invalid.y1, y)
		this.invalid.y2 = Math.max(this.invalid.y2, y+h)
	}

	getInvalidatedBounds() {
		return this.invalid
	}

	moveToTile(x,y) {
		this.moveTo(x*this.areaTileWidth, y*this.areaTileHeight)
	}
}
