const _ = require('underscore')
const path = require('path')
const fs = require('fs')
const browserify = require('browserify')
const Logger = require('./Logger')
const ScopedLogger = require('./ScopedLogger')

class ClientJSEngine {
	constructor(options) {
		options = options || {}
		this.logger = new ScopedLogger('ClientJS', options.logger || new Logger())
		this.fs = options.fs || fs
		this.path = options.path || path
		this.beautify = true
		this.express = this.express.bind(this)
	}

	register(sourceDir) {
		this.sourceDir = sourceDir

		this.load()
		this.compile()

		this.fs.watch(this.sourceDir, { recursive: true }, _.debounce(function(){
			this.load()
			this.compile()
		}.bind(this),1000))
	}

	_doOutput(res) {
		res.set('content-type','application/javascript').status(200).send(this._compiled).end()
	}

	express(req, res, next) {
		var self = this

		if (self._compiled) {
			self._doOutput(res)
			return
		}

		self.compile(function(err) {
			if(err) { 	
				self.logger.error('Compiler Error', err)
				res.status(500)
				next()
				return
			}
			self._doOutput(res)
		})
	}

	compile(cb) {
		var self = this

		this._compiled = ''

		try {
			var result = browserify({ debug: true })

			// Load Files
			for(var i in this.sources) {
				var file = this.sources[i]
				result.require(path.join(this.sourceDir, file), { expose: file.substr(0, file.length-3) })
			}

			result
				.bundle()
				.on('error', function(err) {
					self.logger.error('Compiler Error', err.toString())
					if(cb) cb(err)
					return 
				}).on('data', function(d) {
					self._compiled += d.toString()
				}).on('end', function() {
					self.logger.debug('Recompiled Client JS')
				
					if(cb) cb()
				})
		
		} catch(err) {
			self.logger.error('Compiler Error', err)
			if(cb) cb(err)
			return 
		}
	}

	load() {
		this.sources = []
		this._load('', this.sourceDir)
	}

	_load(filePath, base) {
		var files = fs.readdirSync(path.join(base, filePath))
		for(var i in files) {
			var file = files[i]
			var relpath = path.join(filePath, file)
			var fullPath = path.join(base, relpath)
			var stats = fs.statSync(fullPath)
			if (stats.isDirectory()) { 
				this._load(relpath, base)
				continue 
			}
			if (path.extname(file)!='.js') continue

			this.sources.push(relpath)
		}
	}
}

module.exports = ClientJSEngine