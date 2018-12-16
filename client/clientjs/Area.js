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

	redraw() {
		// Tiles
		for(var y = 0; y< this.tileData.length; y++) {
			var col = this.tileData[y] 
			if(!col) continue
			for(var x = 0; x<col.length; x++) {
				if(!col[x]) continue
				this.toDraw.push({ x: x, y: y, t: col[x] })
			}
		}
		// Mobs
		for(var i in this.mobs) {
			this.mobs[i].redraw()
		}
	}

	getTiles(x,y) {
		var row = this.tileData[y]
		return row ? row[x] : null
	}

	setTiles(x,y,tiles) {
		this.tileData[y] = this.tileData[y] || []
		this.tileData[y][x] = tiles
		this.toDraw.push({ x: x, y: y, t: this.tileData[y][x] })
	}

	optimise() {
		for(var y = 0; y<this.tileData.length; y++) {
			var row = this.tileData[y]
			for(var x = 0; x<row.length; x++) {
				var cell = row[x]
				while(cell.length>0 && cell[cell.length-1] == null) cell.pop()
				row[x] = cell
			}
			while(row.length>0 && row[row.length-1] == null || row[row.length-1] == []) row.pop()
			this.tileData[y] = row
		}
		while(this.tileData.length>0 && this.tileData[this.tileData.length-1] == null || this.tileData[this.tileData.length-1] == []) this.tileData.pop()
	}

	invalidateTileRange(x1,y1,x2,y2) {
		for(var y = y1; y<=y2 && y<this.tileData.length; y++) {
			var r = this.tileData[y]
			for(var x = x1; x<=x2 && x<r.length; x++) {
				this.toDraw.push({ x: x, y: y, t: r[x] })
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
		var i

		// Invalidate Mob backgrounds if redrawn
		for(i in this.mobs) {
			var inv = this.mobs[i].getInvalidatedBounds()
			if(inv) this.invalidateRange(inv.x1,inv.y1,inv.x2,inv.y2)
		}

		// Draw all invalid tiles
		var drawn = {}
		while (true) {
			var cell = this.toDraw.pop()
			if (!cell) break
			// Cell previously drawn?
			if(!drawn[cell.x] || !drawn[cell.x][cell.y]) {
				// Clear Cell
				context.color = 'black'
				context.fillRect(
					cell.x*this.tileWidth, 
					cell.y*this.tileHeight, 
					this.tileWidth, 
					this.tileHeight
				)
				// Draw all layers in cell
				for(i in cell.t) {
					var t = cell.t[i]
					if(!t) continue
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
				// Mark cell drawn
				drawn[cell.x] = drawn[cell.x] || {}
				drawn[cell.x][cell.y] = true
			}
		}
		// Draw mobs
		for(i in this.mobs) {
			this.mobs[i].draw(context)
		}
	}
}
