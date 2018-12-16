/* global GameEngine, Mob */

class Editor extends GameEngine {
	constructor(options) {
		super(options)

		this.addAsset('dungeon','/images/tileset_dungeon.png')

		this.addArea('dungeon','dungeon', [
			[ [[0,4]]      , [[1,4]]      , [[1,4],[1,5]], [[1,4]]      , [[1,4],[3,6]], [[1,4],[4,6]], [[1,4]]      , [[2,4]]        ],
			[ [[6,0],[0,5]], [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0],[3,7]], [[6,0],[4,7]], [[6,0],[4,4]], [[6,0],[2,5]], ],
			[ [[6,0],[0,5]], [[6,0],[0,0]], [[6,0],[1,0]], [[6,0],[2,0]], [[6,0]]      , [[6,0]]      , [[6,0],[4,5]], [[6,0],[2,5]], ],
			[ [[6,0],[0,5]], [[6,0],[0,1]], [[6,0],[1,1]], [[6,0],[2,1]], [[6,0]]      , [[6,0],[4,2]], [[6,0],[5,2]], [[6,0],[2,5]], ],
			[ [[6,0],[0,5]], [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0],[4,3]], [[6,0],[5,3]], [[6,0],[2,5]], ],
			[ [[6,0],[0,5]], [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0],[2,5]], ],
			[ [[0,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[2,6]]        ],
		])

		this.addMob('cursor', 'dungeon', 'dungeon', 0, 0, 2, 8)

		this.cursorX = 0
		this.cursorY = 0
		this.cursorX = 0
		this.cursorY = 0
		this.cursorZ = 0
	}

	start() {
		super.start()
		document.onkeyup = (e) => { this.processKey(e) }
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
			this.cursorZ = Math.min(50,this.cursorZ+1)
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
			while(tile.length>0 && tile[tile.length-1]===null) tile.pop()
			this.areas['dungeon'].setTiles(this.cursorX, this.cursorY, tile)
			break			
		default:
			console.log(e.keyCode)
		}

		this.areas['dungeon'].draw()
		this.getMob('cursor').moveToTile(this.cursorX,this.cursorY)
	}
}