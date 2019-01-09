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
		this.toRedraw = true

		this.moving = false

		this.clearInvalid()

		this.animations = {}
	}

	draw(context) {
		if(!this.toRedraw) return

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
		this.clearInvalid()

		this.toRedraw = false
	}

	redraw() {
		this.toRedraw = true
	}

	canMove(dx,dy,area) {
		return !area.getAccess(Math.round(this.offsetX/this.areaTileWidth)+dx, Math.round(this.offsetY/this.areaTileHeight)+dy)
	}

	setTile(x,y) {
		this.invalidateCurrent()
		this.tile[0] = x
		this.tile[1] = y
		this.toRedraw = true
	}

	moveTo(x,y) {
		this.invalidateCurrent()
		this.offsetX = x
		this.offsetY = y
		this.invalidateCurrent()
		this.toRedraw = true
	}

	animateMove(dx, dy, animation) {
		if(this.moving) return
			
		var steps = animation.frames.length
		dx = dx*this.tileWidth/steps
		dy = dy*this.tileHeight/steps
		this.moving = true

		var mv = () => {
			this.invalidateCurrent()
			this.offsetX += dx
			this.offsetY += dy
			this.invalidateCurrent()
			this.toRedraw = true
			if(steps-- > 0) setTimeout(mv,animation.tickDelay)
		}
		setTimeout(mv,animation.tickDelay)
		animation.start(null, ()=>{ this.moving = false })
	}

	clearInvalid() {
		this.invalid = { x1: Number.MAX_SAFE_INTEGER, x2: 0, y1: Number.MAX_SAFE_INTEGER, y2: 0}
	}

	invalidateCurrent() {
		this.invalidate(this.offsetX,this.offsetY,this.tileWidth,this.tileHeight)
	}

	invalidate(x,y,w,h) {
		this.invalid.x1 = Math.min(this.invalid.x1, x)
		this.invalid.x2 = Math.max(this.invalid.x2, x+w-1)
		this.invalid.y1 = Math.min(this.invalid.y1, y)
		this.invalid.y2 = Math.max(this.invalid.y2, y+h-1)
	}

	getInvalidatedBounds() {
		return this.toRedraw ? this.invalid : null
	}

	moveToTile(x,y) {
		this.moveTo(x*this.areaTileWidth, y*this.areaTileHeight)
	}
}

module.exports = Mob
