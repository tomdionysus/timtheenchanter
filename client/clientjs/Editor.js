/* global GameEngine, Mob, getAPIClient */

class Editor extends GameEngine {
	constructor(options) {
		super(options)

		this.addAsset('dungeon','/images/tileset_dungeon.png')

		this.addArea('dungeon', 'dungeon', '/map')

		this.addMob('cursor', 'dungeon', 'dungeon', 0, 0, 2, 8)

		this.cursorX = 0
		this.cursorY = 0
		this.cursorZ = 0
	}

	start() {
		super.start()
		document.onkeyup = (e) => { this.processKey(e) }
		document.onkeydown = (e) => { e.preventDefault(); e.stopPropagation() }
	}

	drawHUD(context) {
		context.save()
		context.font='14px Arial'
		context.fillStyle = 'white'
		var tile = this.areas['dungeon'].getTiles(this.cursorX, this.cursorY)
		var tileStr = ''
		if(tile) {
			tileStr += '[ '
			for(var t in tile) {
				var tileL = tile[t]
				tileStr += tileL ? 'X: '+tileL[0]+' Y: '+tileL[1]+', ' : 'None'
			}
			while([' ',','].indexOf(tileStr[tileStr.length-1])!=-1) tileStr = tileStr.substr(0,tileStr.length-1)
			tileStr += ' ]'
		} else {
			tileStr = 'None'
		}
		context.fillText(
			'X: '+this.cursorX
			+' Y: '+this.cursorY
			+' Z: '+this.cursorZ
			+' Tile: '+tileStr
			, 10, 20)
		context.restore()
	}

	addArea(name, assetName, tilesUrl) {
		this.areaDefs[name] = { assetName: assetName, tilesUrl: tilesUrl, drawAccess: true }
	}

	processKey(e) {
		var tile = this.areas['dungeon'].getTiles(this.cursorX, this.cursorY)
		if(!tile) tile = []
		
		switch(e.keyCode) {
		case 37:
			this.cursorX = Math.max(0,this.cursorX-1)
			break
		case 39:
			this.cursorX = Math.min(50,this.cursorX+1)
			break
		case 38:
			this.cursorY = Math.max(0,this.cursorY-1)
			break
		case 40:
			this.cursorY = Math.min(50,this.cursorY+1)
			break
		case 69:
			this.cursorZ = Math.min(50,this.cursorZ+1)
			break
		case 81:
			this.cursorZ = Math.max(0,this.cursorZ-1)
			break
		case 65:
			// a
			if(!tile[this.cursorZ]) tile[this.cursorZ] = [0,0]
			tile[this.cursorZ][0]--
			this.areas['dungeon'].setTiles(this.cursorX, this.cursorY, tile)
			break
		case 68:
			// d
			if(!tile[this.cursorZ]) tile[this.cursorZ] = [0,0]
			tile[this.cursorZ][0]++
			this.areas['dungeon'].setTiles(this.cursorX, this.cursorY, tile)
			break
		case 87:
			// w
			if(!tile[this.cursorZ]) tile[this.cursorZ] = [0,0]
			tile[this.cursorZ][1]--
			this.areas['dungeon'].setTiles(this.cursorX, this.cursorY, tile)
			break
		case 83:
			// s
			if(!tile[this.cursorZ]) tile[this.cursorZ] = [0,0]
			tile[this.cursorZ][1]++
			this.areas['dungeon'].setTiles(this.cursorX, this.cursorY, tile)
			break
		case 8:
			// clear level
			delete tile[this.cursorZ]
			while(tile.length>0 && tile[tile.length-1]==null) tile.pop()
			this.areas['dungeon'].setTiles(this.cursorX, this.cursorY, tile)
			break
		case 88:
			// x - Reload All
			this.areas['dungeon'].redraw()
			break	
		case 90:
			// z - Save
			this.areas['dungeon'].optimise()
			var api = getAPIClient()
			api.post('/map', { map: this.areas['dungeon'].tiles, access: this.areas['dungeon'].access }, (err) => {
				if(err) { return console.error(err) }
			})
			break
		case 67:
			// c - Clear Access mask
			this.areas['dungeon'].setAccess(this.cursorX, this.cursorY, true)
			break
		case 86:
			// v - Set Access Mask
			this.areas['dungeon'].setAccess(this.cursorX, this.cursorY, false)
			break		
		default:
			console.log(e.keyCode)
		}

		this.areas['dungeon'].redraw()
		this.clear = true
		this.getMob('cursor').moveToTile(this.cursorX,this.cursorY)

		e.preventDefault()
		e.stopPropagation()
	}

	_mousedown(e) {
	}

	_mouseup(e) {
		this.cursorX = Math.floor(this.mouseX / 64)
		this.cursorY = Math.floor(this.mouseY / 64)
		this.getMob('cursor').moveToTile(this.cursorX,this.cursorY)
	}
}