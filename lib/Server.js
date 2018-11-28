const express = require('express')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')
const Busboy = require('busboy')
const async = require('async')
const tmp = require('tmp')
const _ = require('underscore')
const querystring = require('querystring')
const compression = require('compression')
const request = require('request')

const Logger = require('./Logger')
const ScopedLogger = require('./ScopedLogger')

require('./HandlebarsHelpers')

class Server {
	constructor(options) {
		options = options || {}

		var self = this

		this.port = options.port || 8080
		this.env = options.env || 'prod'

		// IoC depedencies
		this.logger = new ScopedLogger('HTTP', options.logger || new Logger())
		this.i18nEngine = options.i18nEngine || null
		this.sassEngine = options.sassEngine || null
		this.clientJSEngine = options.clientJSEngine || null
		this.notAuthorisedRedirect = options.notAuthorisedRedirect || '/login'
		this.systemStatusPath = options.systemStatusPath || path.join(__dirname,'../client/views/system')

		// Partials
		self.registerAllPartials(path.join(__dirname,'../client/partials'))

		// Views & Controllers
		this.mvc = {}

		// The main HTTP server
		self.app = express()
		self.app.disable('x-powered-by')

		// Public healthcheck route for Load Balancer
		self.app.get('/healthcheck', function(req,res) { res.status(200).end() })

		// In production, redirect HTTP to HTTPS
		if(this.env=='prod') {
			self.app.use(function(req,res,next) { self.httpsRedirect(req,res,next) })
		}

		// Logger
		self.app.use(self.httpLogger.bind(self))

		// System Status Pages
		self.loadSystemStatusTemplates(this.systemStatusPath)

		// Body Parser for forms/json
		self.app.use(self.formParser.bind(self))

		// i18n
		if (self.i18nEngine) self.app.use(self.i18nEngine.express.bind(self.i18nEngine))

		// Compression
		self.app.use(compression())
	}

	loadSystemStatusTemplates(templatePath) {
		this.systemStatusTemplates = {}
		var status = [ 401, 500 ]
		for(var i in status) {
			var statusCode = status[i]
			var viewTemplate = fs.readFileSync(path.join(templatePath,statusCode+'.hbs'),'utf8')
			this.systemStatusTemplates[statusCode] = handlebars.compile(viewTemplate)
		}
	}

	registerStatic(route, filepath) {
		this.app.use(route, express.static(path.join(__dirname, '../client/public', filepath)))
	}

	registerSaas(route, filepath) {
		this.sassEngine.register(path.join(__dirname, '../client', filepath))
		this.app.use(route, this.sassEngine.express)
	}

	registerClientJS(route, filepath) {
		this.clientJSEngine.register(path.join(__dirname, '../client', filepath))
		this.app.use(route, this.clientJSEngine.express)
	}

	start() {
		var self = this

		// Finally, return not found
		self.app.use(function(req,res) {
			self.statusEnd(req, res, 404)
		})

		// Catch All Error Handler
		self.app.use(function (err, req, res) {
			self.status500End(req, res, err)
		})

		self.app.listen(self.port, function() {
			self.logger.info('Server listening on port %d', self.port)
		})
	}

	register(route, fileName) { this._register(route, fileName, false) }
	registerPublic(route, fileName) { this._register(route, fileName, true) }

	_register(route, fileName, isPublic) {
		if (!fileName) {
			fileName = route
			while (fileName[0]=='/') { fileName=fileName.substr(1) }
		}
		var self = this
		var viewFile =  path.join(__dirname, '../client/views/'+fileName+'.hbs')
		var controllerFile =  path.join(__dirname, '../client/views/'+fileName)
		var view, controller

		self.mvc[route] = {}
		if (fs.existsSync(viewFile)) { 
			var viewTemplate = fs.readFileSync(viewFile,'utf8')
			self.mvc[route].view = handlebars.compile(viewTemplate)
			// In dev mode, watch the files and reload them when they change
			if(self.env=='dev') {
				fs.watch(viewFile,_.debounce(function(eventType){
					delete self.mvc[route]['view']
					if(eventType!='rename') {
						self.mvc[route].view = handlebars.compile(fs.readFileSync(viewFile,'utf8'))
						self.logger.info('DEV: Reloading view on route '+route)
					}
				}),1000)
			}
		}
		if (fs.existsSync(controllerFile+'.js')) { 
			self.mvc[route].controller = require(controllerFile)
			// In dev mode, watch the files and reload them when they change
			if(self.env=='dev') {
				fs.watch(controllerFile+'.js',_.debounce(function(eventType){
					delete self.mvc[route]['view']
					if(eventType!='rename') {
						self.mvc[route].controller = require(controllerFile)
						self.logger.info('DEV: Reloading controller on route '+route)
					}
				}),1000)
			}
		}
		self.logger.debug('Registering '+(isPublic ? '(Public) ':'')+'route '+route+(controller ? ' controller':'')+' '+(view ? ' view':''))

		// Add the route
		self.app.all(route, function(req,res) {
			if(!isPublic && !req.session.user) { return res.redirect(self.notAuthorisedRedirect+'?'+querystring.stringify({redir: req.originalUrl})) }

			try {
				// self.logger.debug("handling route "+route)
				var method = req.method.toLowerCase()
				var context = {
					request: req,
					params: req.params,
					session: req.session,
					message: req.message
				}

				var view = self.mvc[route].view
				var controller = self.mvc[route].controller

				// Save the message
				var oldmsg = req.message

				var doEnd = function() {
					res.set('content-type','text/html')
					res.send(view(context))
					res.end()
					return
				}

				var doSend = function() {
					if(method == 'get' && view) {
						if(!oldmsg || req.message != oldmsg) { doEnd(); return }
						delete req.message
						self.clearMessage(res, req.session ? req.session.id : null, function() { doEnd() })
						return
					}
					if(controller && controller[method]) {
						doEnd()
						return
					}
					self.statusEnd(req, res, 200)
				}

				if(controller && controller[method]) {
					return controller[method].call(self, req, res, context, doSend)
				}

				doSend()
			} catch (err) {
				self.status500End(req, res, err)
			}
		})
	}

	// HTTPS redirect middleware
	httpsRedirect(req, res, next) {
		var forwardedProto = req.get('x-forwarded-proto')
		if(forwardedProto && forwardedProto!='https') { return res.redirect('https://'+req.hostname+req.originalUrl) }
		next()
	}

	// Redirect
	redirect(res, url) {
		res.redirect(url)
	}

	// HTTP logger middleware
	httpLogger(req, res, next) {
		this.logger.info(req.method+' '+req.url)
		next()
	}

	// Multipart Form/File parser middleware
	formParser(req, res, next) {
		if(['POST','PATCH'].indexOf(req.method)==-1) { next(); return }
		var ct = req.get('content-type') || ''
		switch (ct) {
		case 'application/json':
			req.setEncoding('utf8')
			var data = ''
			req.on('data', function(chunk) { data += chunk })
			req.on('end', function() {
				try {
					req.body = JSON.parse(data)
				} catch(e) {
					res.status(422).send(JSON.stringify({code: 'JSON_ERROR', message: 'Error decoding JSON'})).end()
					return
				}
				next()
			})
			return
		case 'application/x-www-form-urlencoded':
			req.body = {}
			var busboy = new Busboy({ headers: req.headers })
			busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
				var tmpFile = tmp.fileSync()
				req.body[fieldname] = {
					filename: filename,
					encoding: encoding,
					mimetype: mimetype,
					stream: fs.createWriteStream(null, {fd: tmpFile.fd}),
					length: 0
				}
				file.on('data', function(data) {
					req.body[fieldname].stream.write(data)
					req.body[fieldname].length += data.length
				})
				file.on('end', function() {
					req.body[fieldname].stream.end()
					req.body[fieldname].stream = fs.createReadStream(tmpFile.name)
				})
			})
			busboy.on('field', function(fieldname, val) {
				if(req.body[fieldname]) {
					if(!_.isArray(req.body[fieldname])) req.body[fieldname] = [ req.body[fieldname] ]
					req.body[fieldname].push(val)
				} else {
					req.body[fieldname] = val
				}
			})
			busboy.on('finish', function() {
				next()
			})
			req.pipe(busboy)
			break
		default:
			res.status(415).send(JSON.stringify({code: 415, message: 'Unsupported Content-Type `'+ct+'`'})).end()
			break
		}

	}

	statusEnd(req, res, status) {
		status = status.toString()
		if(this.systemStatusTemplates[status]) {
			res.send(this.systemStatusTemplates[status]({
				request: req,
				params: req.params,
				session: req.session,
				message: req.message
			}))
		}
		res.status(status).end()
	}

	status500End(req, res, err) {
		this.logger.error('Exception: '+err+': '+err.stack)
		this.statusEnd(req, res,  500)
	}

	status404End(req, res, err) {
		this.logger.error('Exception: '+err+': '+err.stack)
		this.statusEnd(req, res,  404)
	}

	registerAllPartials(partialsPath) {
		var self = this
		var files = fs.readdirSync(partialsPath)
		for(var i=0; i<files.length; i++) {
			var filepath = path.join(partialsPath,files[i])
			var stats = fs.statSync(filepath)
			if(stats.isDirectory()) {
				self.registerAllPartials(filepath)
				continue
			} 
            
			if(path.extname(filepath)!='.hbs') continue

			self.registerPartial(path.basename(filepath,'.hbs'),filepath)
		}
	}

	registerPartial(name, fileName) {
		var self = this

		handlebars.registerPartial(name, fs.readFileSync(fileName,'utf8'))
		self.logger.debug('Registered partial '+name)

		// In dev mode, watch the file and reload it when it changes
		if(self.env=='dev') {
			fs.watch(fileName,_.debounce(function(eventType){
				handlebars.unregisterPartial(name)
				if(eventType!='rename') {
					handlebars.registerPartial(name, fs.readFileSync(fileName,'utf8'))
					self.logger.info('DEV: Reloaded partial '+name)
				}
			}),1000)
		}
	}

	serveAndExit(res, file, code) {
		res.set('Content-Type','text/html')
		res.send(fs.readFileSync(path.join(__dirname,file))).status(code).end()
	}
}

module.exports = Server