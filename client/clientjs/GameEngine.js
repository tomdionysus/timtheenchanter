/* global Asset, async, Area */

class GameEngine {
	constructor(options) {
		options = options || {}
		this.targetId = options.targetId || 'game'

		this.assetNames = {}
		this.areaDefs = {}
		this.mobDefs = {}
		this.animationDefs = {}
		this.changed = false

		this.frame = 0
	}

	start(callback) {
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
		async.eachOf(this.areas, (area, name, cb) => {
			area.start(this.element.getContext('2d'), cb)
		}, callback)
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
			if(!a.autoStart) continue;
			a.start()
		}
		if (callback) callback()
	}

	init(callback) {
		// TileBackgrounds
		this.areas = {}
		for(var i in this.areaDefs) {
			var t = this.areaDefs[i]
			this.areas[i] = new Area(Object.assign(t, { tilesAsset: this.getAsset(t.assetName) }))
		}
		// Mobs
		this.mobs = {}
		for(var i in this.mobDefs) {
			var t = this.mobDefs[i]
			var mob = new Mob(Object.assign(t, { asset: this.getAsset(t.assetName) }))
			this.mobs[i] = mob
			this.areas[t.areaName].addMob(i, mob)
		}
		// Amimations
		this.animations = {}
		for(var i in this.animationDefs) {
			var t = this.animationDefs[i]
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
		this.target = document.getElementById(this.targetId )
		this.element = document.createElement('canvas')
		this.element.width = 640
		this.element.height = 480
		this.element.classList.add('gamescreen')
		this.target.parentNode.replaceChild(this.element, this.target)
		if(callback) callback()
	}
}