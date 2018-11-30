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
	}

	start() {
		super.start()
		document.onkeyup = (e) => {
			this.processKey(e)
		}

		console.log("Started")
	}

	processKey(e) {
			console.log(e.keyCode)
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
			default:
				console.log(e)
		}

		this.getMob('cursor').moveToTile(this.cursorX,this.cursorY)
	}
}