const Logger = require('./Logger')
const ScopedLogger = require('./ScopedLogger')
const crypto = require('crypto')
const async = require('async')

class RateLimiterEngine {
	constructor(options) {
		options = options || {}
		this.memcached = options.memcached
		this.logger = new ScopedLogger('RateLimiter', options.logger || new Logger())
		this.rpm = options.rpm || 300
		this.rateKeyPrefix = options.rateKeyPrefix || 'ratelimit_'
		this.useHTTPHeader = typeof(options.useHTTPHeader)!='undefined' ? options.useHTTPHeader : true
		this.ipAddressHeader = options.ipAddressHeader || 'x-forwarded-for'
		this.handlers = []

		this.express = this._express.bind(this)
	}

	_express(req, res, next) {
		var self = this

		var key = this.getKey(req)

		self.memcached.get(key, function(err, data){
			if (err) {
				self.logger.error('Reading Key Error [%s]', key, err) 
				next(err)
				return
			}

			var cb = function(err) {
				if(err) { self.logger.error('Set/Incr Error [%s]', key, err) }
				next()
			}

			if (data==null) {
				self.memcached.set(key, 1, 60, cb)
			} else {
				if(data>=self.rpm) {
					async.eachSeries(
						self.handlers,
						function(handler, cb) {
							handler(req, res, cb)
						},
						function(err) {
							if(err) { self.logger.error('Handler Error [%s]', key, err) }
						})
					return
				} else {
					self.memcached.incr(key, 1, cb)
				}
			}
		})
	}

	register(handler) {
		this.handlers.push(handler)
	}

	getKey(req) {
		var self = this
		var hash = crypto.createHash('md5')
		var val = req.connection.remoteAddress
		if(self.useHTTPHeader && req.headers[self.ipAddressHeader]) {
			hash.update(req.headers[self.ipAddressHeader])
		}
		hash.update(val)
		var key = self.rateKeyPrefix+hash.digest('hex')
		return key
	}
}

module.exports = RateLimiterEngine