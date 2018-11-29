class Area {
	constructor(options) {
		options = options || {}
		this.tilesAsset = options.tilesAsset
		this.tileWidth = options.tileWidth || 64
		this.tileHeight = options.tileHeight || 64
		this.tileData = options.tileData
		this.offsetX = options.offsetX || 32
		this.offsetY = options.offsetY || 32
		this.started = false

		this.toDraw = []

		this.draw = this.draw.bind(this)

		this.mobs = {}
	}

	addMob(id, mob) {
		this.mobs[id] = mob
		this.mobs[id].area = this
	}

	drawAll() {
		for(var y = 0; y< this.tileData.length; y++) {
			var col = this.tileData[y]
			for(var x = 0; x<col.length; x++) {
				if(!col[x]) continue
				this.toDraw.push({ x: x, y: y, t: col[x] })
			}
		}
	}

	start(drawContext, cb) {
		this.drawContext = drawContext
		this.drawAll()
		this.running = true
		window.requestAnimationFrame(this.draw,0)
		if(cb) cb()
	}

	stop() {
		this.running = false
	}

	invalidateRange(x,y,w,h) {
		var rx1 = Math.floor(x / this.tileWidth)
		var rx2 = Math.ceil((x+w) / this.tileWidth)
		var ry1 = Math.floor(y / this.tileHeight)
		var ry2 = Math.ceil((y+h) / this.tileHeight)
		for(x = rx1; x<=rx2; x++) {
			for(y = ry1; y<=ry2; y++) {
				this.toDraw.push({ x: x, y: y, t: this.tileData[y][x] })
			}
		}
	}

	draw() {
		// Invalidate Mob backgrounds if redrawn
		for(var i in this.mobs) {
			var mob = this.mobs[i]
			if(mob.redraw) {
				this.invalidateRange(mob.offsetX,mob.offsetY,mob.tileWidth,mob.tileHeight)
			}
		}
		// Draw all invalid tiles
		while (true) {
			var cell = this.toDraw.pop()
			if (!cell) break
			for(var i in cell.t) {
				var t = cell.t[i]
				this.drawContext.drawImage(
					this.tilesAsset.element, 
					t[0]*this.tileWidth, 
					t[1]*this.tileHeight, 
					this.tileWidth, 
					this.tileHeight,
					this.offsetX+(cell.x*this.tileWidth), this.offsetY+(cell.y*this.tileHeight), 
					this.tileWidth, 
					this.tileHeight
				)
			}
		}
		// Draw mobs
		for(var i in this.mobs) {
			var mob = this.mobs[i]
			mob.draw(this.drawContext, this.offsetX, this.offsetY)
		}
		if(this.running) window.requestAnimationFrame(this.draw,0)
	}
}
