const sass = require('node-sass')
const fs = require('fs')
const _ = require('underscore')

const Logger = require('./Logger')
const ScopedLogger = require('./ScopedLogger')

class SassEngine {
	constructor(options) {
		options = options || { recompile: false }
		this.options = options
		this.logger = new ScopedLogger('Sass', options.logger || new Logger())
		this.sassOptions = this.sassOptions || {}
		this.fs = options.fs || fs
		this.sass = options.sass || sass
		this._compiled = null

		this.express = this.express.bind(this)
	}

	register(sourceFile) {
		this.sourceFile = sourceFile
		if (this.options.recompile) this.watch.apply(this)
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

	_doOutput(res) {
		res.set('content-type','text/css').status(200).send(this._compiled.css).end()
	}

	watch() {
		var self = this
		self.fs.watch(self.sourceFile, _.debounce(function() {
			self.compile(function(err) {
				if(err) { self.logger.error('Compiler Error', err) }
			})
		}),1000)
	}

	compile(callback) {
		var self = this
		self.sass.render({ file: this.sourceFile }, function(err, result) {
			if (err) { callback(err); return }
			self._compiled = result
			self.logger.info('CSS %s Compiled', self.sourceFile) 
			callback(null)
		})
	}
}

module.exports = SassEngine