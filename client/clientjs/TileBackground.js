class TileBackground {
	constructor(options) {
		options = options || {}
		this.tilesAsset = options.tilesAsset
		this.tileWidth = options.tileWidth || 64
		this.tileHeight = options.tileHeight || 64
		this.tileData = options.tileData
	}

	draw(drawContext, callback) {
		for(var y = 0; y< this.tileData.length; y++) {
			var col = this.tileData[y]
			for(var x = 0; x<col.length; x++) {
				var cell = col[x]
				if(!cell) continue
				for(var t in cell) {
					drawContext.drawImage(
						this.tilesAsset.element, 
						cell[t][0]*this.tileWidth, 
						cell[t][1]*this.tileHeight, 
						this.tileWidth, 
						this.tileHeight,
						x*this.tileWidth, y*this.tileHeight, 
						this.tileWidth, 
						this.tileHeight
					)
				}
			}
		}
		callback()
	}
}
