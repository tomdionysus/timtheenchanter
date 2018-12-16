/* global Asset, async, Area, Mob */

class GameEngine {
	constructor(options) {
		options = options || {}
		this.targetId = options.targetId || 'game'

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
		this.running = true
		async.series([
			// Load Assets
			(cb) => { this.loadAssets(cb) },
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

	getAsset(name) {
		if (!this.assets[name]) throw 'Asset not found: '+name
		return this.assets[name]
	}

	addArea(name, assetName, tileData) {
		this.areaDefs[name] = { assetName: assetName, tileData: tileData }
	}

	startAreas(callback) {
		this.redraw()
		if(this.running) window.requestAnimationFrame(this.tick.bind(this),0)
		if(callback) callback()
	}

	redraw() {
		this.clear = true
		for(var i in this.areas) {
			var area = this.areas[i]
			area.invalidateAll()
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
		
		this.clear = false

		if(this.running) window.requestAnimationFrame(this.tick.bind(this),0)
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

	init(callback) {
		var i,t
		// TileBackgrounds
		this.areas = {}
		for(i in this.areaDefs) {
			t = this.areaDefs[i]
			this.areas[i] = new Area(Object.assign(t, { tilesAsset: this.getAsset(t.assetName) }))
		}
		// Mobs
		this.mobs = {}
		for(i in this.mobDefs) {
			t = this.mobDefs[i]
			var mob = new Mob(Object.assign(t, { asset: this.getAsset(t.assetName) }))
			this.mobs[i] = mob
			this.areas[t.areaName].addMob(i, mob)
		}
		// Amimations
		this.animations = {}
		for(i in this.animationDefs) {
			t = this.animationDefs[i]
			this.animations[i] = new Animation(Object.assign(t, { mob: this.getMob(t.mobName) }))
		}
		if(callback) callback()
	}

	loadAssets(callback) {
		this.assets = {}
		for(var i in this.assetNames) {
			this.assets[i] = new Asset({ name: i, src: this.assetNames[i] })
		}

		async.each(this.assets, (asset, cb) => {
			asset.load(cb)
		}, callback)
	}

	bootElement(callback) {
		this.target = document.getElementById(this.targetId)
		this.element = document.createElement('canvas')

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
}