/* global GameEngine, Mob */

class TimTheEnchanter extends GameEngine {
	constructor(options) {
		super(options)

		this.addAsset('dungeon','/images/tileset_dungeon.png')
		this.addAsset('gallagher','/images/gallagher.png')

		this.addArea('dungeonroom', 'dungeon', '/map')

		this.debug = true

		this.addMob('gallagher', 'gallagher', 'dungeonroom', 64, 256, 0, 2)
		this.addMob('torch', 'dungeon', 'dungeonroom', 64*3, 0, 6, 6)	

		this.addAnimation('gallagherAnimation','gallagher',[ [0,2],[1,2],[2,2],[1,2] ], {mode: Animation.LOOP, autoStart: true, tickDelay:250 })
		this.addAnimation('torchAnimation','torch',[ [6,6],[6,5] ], {mode: Animation.LOOP, autoStart: true, tickDelay:100 })
	}

	start() {
		super.start()

		console.log("Started")
	}

	drawHUD(context) {
		if(!this.debug) return
		context.save()
		context.font='14px Arial'
		context.fillStyle = 'white'
		context.fillText(
			'Screen (X: '+Math.round(this.x)
			+' Y: '+Math.round(this.y)
			+' W: '+Math.round(this.w)
			+' H: '+Math.round(this.h)+')'
			+' Zoom: '+Math.round(this.scale*100)+'%'
			+' Mouse (X: '+Math.round(this.mouseX)+' Y: '+Math.round(this.mouseY)+')'
			+' Limits Min: (X: '+Math.round(this.minX/this.scale)+', Y: '+Math.round(this.minY/this.scale)+')'
			+' Limit Max: (X: '+Math.round(this.maxX*this.scale)+', Y: '+Math.round(this.maxY*this.scale)+')'
			, 10, 20)
		context.restore()
	}
}