/* global Asset, async, Area */

class GameEngine {
	constructor(options) {
		options = options || {}
		this.targetId = options.targetId || 'game'

		this.assetNames = {}
		this.areaDefs = {}
		this.mobDefs = {}
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
			(cb) => { this.areas.dungeonroom.start(this.element.getContext('2d'), cb) },
		], 
		(err) => {
			setInterval(this.animate.bind(this),250)
			if(callback) callback(err)
		})
	}

	animate() {

		switch(this.frame) {
		case 0:
			this.areas.dungeonroom.mobs.torch.setTile(6,6)
			this.areas.dungeonroom.mobs.gallagher.setTile(0,2)
			break
		case 1:
			this.areas.dungeonroom.mobs.torch.setTile(6,5)
			this.areas.dungeonroom.mobs.gallagher.setTile(1,2)
			break
		case 2:
			this.areas.dungeonroom.mobs.torch.setTile(6,6)
			this.areas.dungeonroom.mobs.gallagher.setTile(2,2)
			break
		case 3:
			this.areas.dungeonroom.mobs.torch.setTile(6,5)
			this.areas.dungeonroom.mobs.gallagher.setTile(1,2)
			break
		}
		this.frame++
		if(this.frame>3) this.frame = 0
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

	addMob(name, assetName, areaName, offsetX, offsetY, tileX, tileY) {
		this.mobDefs[name] = { assetName: assetName, areaName: areaName, offsetX: offsetX, offsetY: offsetY, tileX: tileX, tileY: tileY }
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
			this.areas[t.areaName].addMob(i, new Mob(Object.assign(t, { asset: this.getAsset(t.assetName) })))
		}
		callback()
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
		callback()	
	}
}