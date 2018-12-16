/* global GameEngine, Mob */

class TimTheEnchanter extends GameEngine {
	constructor(options) {
		super(options)

		this.addAsset('dungeon','/images/tileset_dungeon.png')
		this.addAsset('gallagher','/images/gallagher.png')

		this.addArea('dungeonroom','dungeon', 
			[
				[ [[0,4]]      , [[1,4]]      , [[1,4],[1,5]], [[1,4]]      , [[1,4],[3,6]], [[1,4],[4,6]], [[1,4]]      , [[2,4]]        ],
				[ [[6,0],[0,5]], [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0],[3,7]], [[6,0],[4,7]], [[6,0],[4,4]], [[6,0],[2,5]], ],
				[ [[6,0],[0,5]], [[6,0],[0,0]], [[6,0],[1,0]], [[6,0],[2,0]], [[6,0]]      , [[6,0]]      , [[6,0],[4,5]], [[6,0],[2,5]], ],
				[ [[6,0],[0,5]], [[6,0],[0,1]], [[6,0],[1,1]], [[6,0],[2,1]], [[6,0]]      , [[6,0],[4,2]], [[6,0],[5,2]], [[6,0],[2,5]], ],
				[ [[6,0],[0,5]], [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0],[4,3]], [[6,0],[5,3]], [[6,0],[2,5]], ],
				[ [[6,0],[0,5]], [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0]]      , [[6,0],[2,5]], ],
				[ [[0,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[1,6]]      , [[2,6]]        ],
			]
		)

		this.addMob('gallagher', 'gallagher', 'dungeonroom', 64, 256, 0, 2)
		this.addMob('torch', 'dungeon', 'dungeonroom', 64*3, 0, 6, 6)	

		this.addAnimation('gallagherAnimation','gallagher',[ [0,2],[1,2],[2,2],[1,2] ], {mode: Animation.LOOP, autoStart: true, tickDelay:250 })
		this.addAnimation('torchAnimation','torch',[ [6,6],[6,5] ], {mode: Animation.LOOP, autoStart: true, tickDelay:100 })
	}

	start() {
		super.start()

		console.log("Started")
	}
}