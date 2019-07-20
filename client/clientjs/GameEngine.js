const async = require('async')

const APIClient = require('APIClient')
const Area = require('Area')
const Animation = require('Animation')
const Asset = require('Asset')
const Mob = require('Mob')
const Browser = require('Browser')

class GameEngine {
	constructor(options) {
		options = options || {}
		this.targetId = options.targetId || 'game'

		this.Browser = options.Browser || Browser
		this.Area = options.Area || Area
		this.Animation = options.Animation || Animation
		this.Asset = options.Asset || Asset
		this.Mob = options.Mob || Mob

		this.assetNames = {}
		this.areaDefs = {}
		this.mobDefs = {}
		this.animationDefs = {}
		this.changed = false

		this.scale = typeof(options.scale)=='undefined' ? 1 : options.scale
		this.x = options.x || 0
		this.y = options.y || 0
		this.scale = options.scale || 1

		this.minX = options.minX
		this.minY = options.minY
		this.maxX = options.maxX
		this.maxY = options.maxY

		this.minScale = typeof(options.minScale)=='undefined' ? 0.01 : options.minScale
		this.maxScale = typeof(options.maxScale)=='undefined' ? 10 : options.maxScale

		this.enableScroll = typeof(options.enableScroll)=='undefined' ? true : !!options.enableScroll
		this.enableZoom = typeof(options.enableZoom)=='undefined' ? true : !!options.enableZoom
	}

	start(callback) {
		if(this.processKey) {
			this.Browser.document.onkeyup = (e) => { this.processKey(e) }
		}

		this.running = true
		async.series([
			// Load Assets
			(cb) => { this.loadAssets(cb) },
			// Load Assets
			(cb) => { this.loadAreas(cb) },
			// Init
			(cb) => { this.init(cb) },
			// Boot Element
			(cb) => { this.bootElement(cb) },
			// Draw Tiled Background
			(cb) => { this.startAreas(cb) },
			// Start autoStart animations
			(cb) => { this.startAnimations(cb) },
		], 
		(err) => {
			if(callback) callback(err)
		})
	}

	bindMouseWheel() {
		var ael = this.element.addEventListener
		if(!ael) ael = this.element.attachEvent
		ael('mousewheel', (e) => this._panZoom(e), false)
		ael('DOMMouseScroll', (e) => this._panZoom(e), false)
		ael('mousemove', (e) => this._move(e), false)
		ael('mousedown', (e) => this._mousedown(e), false)
		ael('mouseup', (e) => this._mouseup(e), false)
	}

	stop() {
		this.running = false
	}

	addAsset(name, src) {
		this.assetNames[name] = src
	}

	getArea(name) {
		return this.areas[name]
	}

	getAsset(name) {
		if (!this.assets[name]) throw 'Asset not found: '+name
		return this.assets[name]
	}

	addArea(name, assetName, tilesUrl) {
		this.areaDefs[name] = { assetName: assetName, tilesUrl: tilesUrl, triggers: [] }
	}

	addTrigger(areaName, x, y, type, target) {
		this.areaDefs[areaName].triggers.push( { x:x, y:y, type:type, target:target })
	}

	startAreas(callback) {
		this.redraw()
		if(this.running) this.Browser.window.requestAnimationFrame(this.tick.bind(this),0)
		if(callback) callback()
	}

	redraw() {
		this.clear = true
		for(var i in this.areas) {
			var area = this.areas[i]
			area.redraw()
		}	
	}

	tick() {
		var context = this.element.getContext('2d')

		if(this.clear) {
			context.fillStyle = 'black'
			context.fillRect(0, 0, this.element.width, this.element.height)
		}

		// Main
		context.save()

		// Set scale
		context.scale(this.scale, this.scale)
		context.translate(this.x, this.y)

		for(var i in this.areas) {
			var area = this.areas[i]
			area.draw(context)
		}

		context.restore()

		// HUD
		if(this.clear) {
			this.drawHUD(context)
		}
		
		this.clear = false

		if(this.running) this.Browser.window.requestAnimationFrame(this.tick.bind(this),0)
	}

	addMob(name, assetName, areaName, offsetX, offsetY, tileX, tileY) {
		this.mobDefs[name] = { assetName: assetName, areaName: areaName, offsetX: offsetX, offsetY: offsetY, tileX: tileX, tileY: tileY }
	}

	getMob(name) {
		return this.mobs[name]
	}

	addAnimation(name, mobName, frames, options) {
		this.animationDefs[name] = Object.assign(options,{ mobName: mobName, frames: frames })
	}

	getAnimation(name) {
		return this.animations[name]
	}

	startAnimations(callback) {
		for(var i in this.animations) {
			var a = this.animations[i]
			if(!a.autoStart) { continue }
			a.start()
		}
		if (callback) callback()
	}

	drawHUD() {
		
	}

	loadAreas(callback) {
		// TileBackgrounds
		this.areas = {}
		var api = APIClient.getDefaultClient()
		async.eachOf(this.areaDefs, (areaDef, name, cb) => {
			api.get(areaDef.tilesUrl, (err, data) => {
				if(err) return cb(err)
				this.areas[name] = new this.Area(Object.assign(areaDef, { tiles: data.map, access: data.access, tilesAsset: this.getAsset(areaDef.assetName) }))
				for(var i in areaDef.triggers) {
					var trigger = areaDef.triggers[i]
					this.areas[name].addTrigger(trigger.x, trigger.y, trigger)
				}
				cb()
			})
		}, callback)
	}

	init(callback) {
		var i,t
		// Mobs
		this.mobs = {}
		for(i in this.mobDefs) {
			t = this.mobDefs[i]
			var mob = new this.Mob(Object.assign(t, { asset: this.getAsset(t.assetName) }))
			this.mobs[i] = mob
			this.areas[t.areaName].addMob(i, mob)
		}
		// Amimations
		this.animations = {}
		for(i in this.animationDefs) {
			t = this.animationDefs[i]
			this.animations[i] = new this.Animation(Object.assign(t, { mob: this.getMob(t.mobName) }))
		}
		if(callback) callback()
	}

	loadAssets(callback) {
		this.assets = {}
		for(var i in this.assetNames) {
			this.assets[i] = new this.Asset({ name: i, src: this.assetNames[i] })
		}

		async.each(this.assets, (asset, cb) => {
			asset.load(cb)
		}, callback)
	}

	bootElement(callback) {
		this.target = this.Browser.document.getElementById(this.targetId)
		this.element = this.Browser.document.createElement('canvas')

		this.element.width = this.target.getAttribute('width')
		this.element.height = this.target.getAttribute('height')

		this.element.classList.add('gamescreen')
		this.target.parentNode.replaceChild(this.element, this.target)

		this.w = this.element.width / this.scale
		this.h = this.element.height / this.scale

		if(this.enableScroll || this.enableZoom) this.bindMouseWheel()

		if(callback) callback()
	}

	// Event Handlers
	_panZoom(e) {
		if(e.shiftKey) {
			var f = e.deltaY/100
			this.scale = this.scale + f

			if(this.minScale) this.scale = Math.max(this.scale, this.minScale)
			if(this.maxScale) this.scale = Math.min(this.scale, this.maxScale)

			// Update Width/Height
			var ow = this.w, oh = this.h
			this.w = this.element.width / this.scale
			this.h = this.element.height / this.scale

			// Update x and y to centre zoom
			this.x = this.x-(ow-this.w)/2
			this.y = this.y-(oh-this.h)/2

		} else {
			this.x += e.deltaX
			this.y += e.deltaY
		}

		// Limits? 
		if(this.minX) this.x = Math.max(this.minX*this.scale, this.x)
		if(this.minY) this.y = Math.max(this.minY*this.scale, this.y)
		if(this.maxX) this.x = Math.min(this.maxX/this.scale, this.x)
		if(this.maxY) this.y = Math.min(this.maxY/this.scale, this.y)

		// Correct Mouse Coords
		this._setMouseCoords(e)

		this.redraw()

		// Prevent DOM Stuff
		e.preventDefault()
		e.stopPropagation()
	}

	_move(e) {
		this._setMouseCoords(e)
		
		this.redraw()

		// Prevent DOM Stuff
		e.preventDefault()
		e.stopPropagation()
	}

	_setMouseCoords(e) {
		this.mouseX = (e.offsetX/this.scale)-this.x
		this.mouseY = (e.offsetY/this.scale)-this.y
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

module.exports = GameEngine