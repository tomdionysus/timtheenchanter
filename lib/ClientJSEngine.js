const _ = require('underscore')
const path = require('path')
const fs = require('fs')
const esprima = require('esprima')
const compressor = require('uglify-es')

const Logger = require('./Logger')
const ScopedLogger = require('./ScopedLogger')

class ClientJSEngine {
	constructor(options) {
		options = options || {}
		this.logger = new ScopedLogger('ClientJS', options.logger || new Logger())
		this.fs = options.fs || fs
		this.path = options.path || path
		this.beautify = !!options.beautify 
		this._compiled = null
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

		var files = this.kahnSort()

		var result = compressor.minify(files,{
			compress: !!this.beautify,
			output: {
				preamble: '/* Vincent ClientJSEngine v1.0 */',
				beautify: this.beautify,
			}
		})

		if(result.error) {
			self.logger.error('Compiler Error', result.error)
			if(cb) cb(result.error)
			return 
		}

		self.logger.debug('Recompiled Client JS')

		this._compiled = result.code
		if(cb) cb()
	}

	load() {
		this.sources = {}
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

			var source = fs.readFileSync(fullPath).toString()
			try {
				var parsed = esprima.parseModule(source)
				var deps =  this.getDependencies(parsed)
				var modulename = path.basename(file,'.js')
				this.sources[modulename] = {
					source: source,
					dependencies: deps,
					relpath: relpath
				}
			} catch(e) {
				this.logger.warn('%s - %s',relpath,e)
			}
		}
	}

	getDependencies(parsed, deps) {
		deps = deps || {}
		for(var k in parsed.body) {
			var node = parsed.body[k]
			if(node.type=='ClassDeclaration') {
				if(node.superClass && node.superClass.type=='Identifier') deps[node.superClass.name]=true
				this.getDependencies(node.body, deps)
			}
		}
		return deps
	}

	kahnSort() {
		var todo = []
		var content = []
		var included = {}
		for(var k in this.sources) { todo.push(k) }

		while(todo.length>0) {
			var next = todo.shift()
			var src = this.sources[next]
			for(var i in included) { delete src.dependencies[i] }

			if(_.keys(src.dependencies).length == 0) {
				this.logger.debug('Loading '+src.relpath)
				content.push(src.source)
				included[next] = true
				continue
			}
			todo.push(next)
		}

		return content
	}
}

module.exports = ClientJSEngine