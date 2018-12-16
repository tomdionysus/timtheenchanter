class Area {
	constructor(options) {
		options = options || {}
		this.tilesAsset = options.tilesAsset
		this.tileWidth = options.tileWidth || 64
		this.tileHeight = options.tileHeight || 64
		this.tileData = options.tileData
		this.started = false

		this.toDraw = []

		this.draw = this.draw.bind(this)

		this.mobs = {}
	}

	addMob(id, mob) {
		this.mobs[id] = mob
		this.mobs[id].area = this
	}

	invalidateAll() {
		for(var y = 0; y< this.tileData.length; y++) {
			var col = this.tileData[y]
			for(var x = 0; x<col.length; x++) {
				if(!col[x]) continue
				this.toDraw.push({ x: x, y: y, t: col[x] })
			}
		}
		// Mobs
		for(var i in this.mobs) {
			this.mobs[i].redraw = true
		}
	}

	getTiles(x,y) {
		return this.tileData[y][x]
	}

	setTiles(x,y,tiles) {
		this.tileData[y][x] = tiles
		this.toDraw.push({ x: x, y: y, t: this.tileData[y][x] })
	}

	invalidateTileRange(x1,y1,x2,y2) {
		for(var x = x1; x<=x2; x++) {
			for(var y = y1; y<=y2; y++) {
				this.toDraw.push({ x: x, y: y, t: this.tileData[y][x] })
			}
		}
	}

	invalidateRange(x1,y1,x2,y2) {
		var rx1 = Math.floor(x1 / this.tileWidth)
		var rx2 = Math.floor(x2 / this.tileWidth)
		var ry1 = Math.floor(y1 / this.tileHeight)
		var ry2 = Math.floor(y2 / this.tileHeight)
		this.invalidateTileRange(rx1,ry1,rx2,ry2)
	}

	draw(context) {
		var i, mob
		// Invalidate Mob backgrounds if redrawn
		for(i in this.mobs) {
			mob = this.mobs[i]
			if(mob.redraw) {
				var inv = mob.getInvalidatedBounds()
				this.invalidateRange(inv.x1,inv.y1,inv.x2,inv.y2)
			}
		}
		// Draw all invalid tiles
		var cleared = {}
		while (true) {
			var cell = this.toDraw.pop()
			if (!cell) break
			for(i in cell.t) {
				var t = cell.t[i]
				if(!cleared[cell.x] || !cleared[cell.x][cell.y]) {
					context.color = 'black'
					context.fillRect(
						cell.x*this.tileWidth, 
						cell.y*this.tileHeight, 
						this.tileWidth, 
						this.tileHeight
					)
					cleared[cell.x] = cleared[cell.x] || {}
					cleared[cell.x][cell.y] = true
				}
				context.drawImage(
					this.tilesAsset.element, 
					t[0]*this.tileWidth, 
					t[1]*this.tileHeight, 
					this.tileWidth, 
					this.tileHeight,
					cell.x*this.tileWidth, 
					cell.y*this.tileHeight, 
					this.tileWidth, 
					this.tileHeight
				)
			}
		}
		// Draw mobs
		for(i in this.mobs) {
			mob = this.mobs[i]
			if(mob.redraw) mob.draw(context)
		}
	}
}
