const GameEngine = require('GameEngine')
const Animation = require('Animation')

class TimTheEnchanter extends GameEngine {
	constructor(options) {
		super(options)

		this.addAsset('dungeon','/images/tileset_dungeon.png')
		this.addAsset('gallagher','/images/gallagher.png')

		this.addArea('dungeonroom', 'dungeon', '/map')

		this.debug = true
		this.fullscreen = true

		this.addMob('gallagher', 'gallagher', 'dungeonroom', 192, 256, 0, 2)
		this.addMob('torch', 'dungeon', 'dungeonroom', 64*3, 0, 6, 6)	

		this.addAnimation('gallagher_walkright','gallagher',[ [0,2],[1,2],[2,2],[1,2], [0,2],[1,2],[2,2],[1,2] ], {mode: Animation.ONCE, tickDelay:100 })
		this.addAnimation('gallagher_walkdown','gallagher',[ [0,0],[1,0],[2,0],[1,0], [0,0],[1,0],[2,0],[1,0] ], {mode: Animation.ONCE, tickDelay:100 })
		this.addAnimation('gallagher_walkup','gallagher',[ [0,3],[1,3],[2,3],[1,3], [0,3],[1,3],[2,3],[1,3] ], {mode: Animation.ONCE, tickDelay:100 })
		this.addAnimation('gallagher_walkleft','gallagher',[ [0,1],[1,1],[2,1],[1,1], [0,1],[1,1],[2,1],[1,1] ], {mode: Animation.ONCE, tickDelay:100 })
		
		this.addAnimation('torchAnimation','torch',[ [6,6],[6,5] ], {mode: Animation.LOOP, autoStart: true, tickDelay:100 })

		this.addTrigger('dungeonroom',8,0,'exit','testing')
	}

	start() {
		super.start()
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

	processKey(e) {
		e.preventDefault()
		e.stopPropagation()
		e.stopImmediatePropagation()

		switch(e.keyCode) {
		case 37:
			if(!this.mobs['gallagher'].canMove(-1,0, this.getArea('dungeonroom'))) break
			this.mobs['gallagher'].animateMove(-1,0,this.getAnimation('gallagher_walkleft'))
			break
		case 39:
			if(!this.mobs['gallagher'].canMove(1,0, this.getArea('dungeonroom'))) break
			this.mobs['gallagher'].animateMove(1,0,this.getAnimation('gallagher_walkright'))
			break
		case 38:
			if(!this.mobs['gallagher'].canMove(0,-1, this.getArea('dungeonroom'))) break
			this.mobs['gallagher'].animateMove(0,-1,this.getAnimation('gallagher_walkup'))
			break
		case 40:
			if(!this.mobs['gallagher'].canMove(0,1, this.getArea('dungeonroom'))) break
			this.mobs['gallagher'].animateMove(0,1,this.getAnimation('gallagher_walkdown'))
			break
		default:
			this.Browser.console.log(e.keyCode)
		}
	}
}

module.exports = TimTheEnchanter