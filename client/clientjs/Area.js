/* global propDefault */

class Area {
	constructor(options) {
		options = options || {}
		this.tilesAsset = options.tilesAsset
		this.tileWidth = propDefault(options,'tileWidth',64)
		this.tileHeight = propDefault(options,'tileHeight',64)
		this.tiles = options.tiles
		this.access = options.access || {}
		this.drawSystem = options.drawSystem
		this.started = false

		this.toDraw = []

		this.draw = this.draw.bind(this)

		this.triggers = {}
		this.mobs = {}
	}

	addMob(id, mob) {
		this.mobs[id] = mob
		this.mobs[id].area = this
	}

	addTrigger(x,y,data) {
		this.triggers[y] = this.triggers[y] || {}
		this.triggers[y][x] = data
	}

	clearTrigger(x,y) {
		if(!this.triggers[y]) return
		if(!this.triggers[y][x]) return
		delete this.triggers[y][x]
		if(this.triggers[y] == {}) delete this.triggers[y]
	}

	redraw() {
		// Tiles
		for(var y = 0; y< this.tiles.length; y++) {
			var col = this.tiles[y] 
			if(!col) continue
			for(var x = 0; x<col.length; x++) {
				if(!col[x]) continue
				this.toDraw.push({ x: x, y: y })
			}
		}
		// Mobs
		for(var i in this.mobs) {
			this.mobs[i].redraw()
		}
	}

	getTiles(x,y) {
		var row = this.tiles[y]
		return row ? row[x] : null
	}

	setTiles(x,y,tiles) {
		this.tiles[y] = this.tiles[y] || []
		this.tiles[y][x] = tiles
		this.toDraw.push({ x: x, y: y })
	}

	setAccess(x, y, mask) {
		var row = this.access[x] || []
		row[y] = !!mask
		this.access[x] = row
		this.toDraw.push({ x: x, y: y })
	}

	optimise() {
		for(var y = 0; y<this.tiles.length; y++) {
			var row = this.tiles[y]
			if(!row) continue
			for(var x = 0; x<row.length; x++) {
				var cell = row[x]
				if(!cell) continue
				while(cell.length>0 && cell[cell.length-1] == null) cell.pop()
				row[x] = cell
			}
			while(row.length>0 && row[row.length-1] == null || row[row.length-1] == []) row.pop()
			this.tiles[y] = row
		}
		while(this.tiles.length>0 && this.tiles[this.tiles.length-1] == null || this.tiles[this.tiles.length-1] == []) this.tiles.pop()
	}

	invalidateTileRange(x1,y1,x2,y2) {
		for(var y = y1; y<=y2 && y<this.tiles.length; y++) {
			var r = this.tiles[y]
			for(var x = x1; x<=x2 && x<r.length; x++) {
				this.toDraw.push({ x: x, y: y })
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
				var layers = this.tiles[cell.y][cell.x]
				for(i in layers) {
					var t = layers[i]
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
				// Draw system entities?
				if(this.drawSystem) {
					// Draw Access Mask
					if(this.access[cell.x] && this.access[cell.x][cell.y]) {
						context.drawImage(
							this.tilesAsset.element, 
							1*this.tileWidth, 
							9*this.tileHeight, 
							this.tileWidth, 
							this.tileHeight,
							cell.x*this.tileWidth, 
							cell.y*this.tileHeight, 
							this.tileWidth, 
							this.tileHeight
						)
					}
					// Draw triggers
					if(this.triggers[cell.y] && this.triggers[cell.y][cell.x]) {
						context.drawImage(
							this.tilesAsset.element, 
							2*this.tileWidth, 
							9*this.tileHeight, 
							this.tileWidth, 
							this.tileHeight,
							cell.x*this.tileWidth, 
							cell.y*this.tileHeight, 
							this.tileWidth, 
							this.tileHeight
						)
					}
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
