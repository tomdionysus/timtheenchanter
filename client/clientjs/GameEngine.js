/* global Asset, async, TileBackground */

class GameEngine {
	constructor(options) {
		options = options || {}
		this.targetId = options.targetId || 'game'

		this.assetNames = {}
		this.tiledBackgroundDefs = {}
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
			(cb) => { this.tileBackgrounds.dungeonroom.draw(this.element.getContext('2d'), cb) },
		], 
		(err) => {
			console.log("Started")
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

	addTiledBackground(name, assetName, tileData) {
		this.tiledBackgroundDefs[name] = { assetName: assetName, tileData: tileData }
	}

	init(callback) {
		// TileBackgrounds
		this.tileBackgrounds = {}
		for(var i in this.tiledBackgroundDefs) {
			var t = this.tiledBackgroundDefs[i]
			this.tileBackgrounds[i] = new TileBackground({ tilesAsset: this.getAsset(t.assetName), tileData: t.tileData })
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