/* global vsprintf */

const vsprintf = require('sprintf-js')
const Browser = require('Browser')

var _defaultLogger

class Logger {
	constructor(options) {
		options = options || {}
		this.logLevel = options.logLevel || 0
		this.Browser = options.Browser || Browser
	}
	
	debug() {
		if(this.logLevel>0) return
		this.log('DEBUG', Array.from(arguments))
	}

	info() {
		if(this.logLevel>1) return
		this.log('INFO', Array.from(arguments))
	}

	warn() {
		if(this.logLevel>2) return
		this.log('WARN', Array.from(arguments))
	}

	error() {
		this.log('ERROR', Array.from(arguments))
	}

	log(type,args) {
		var d = new Date().toISOString()
		var fmt = args.shift()
		var s = vsprintf(fmt,args)
		if(type=='ERROR') return this.Browser.console.error(d+' [ERROR] '+s)
		this.Browser.console.log(d+' ['+type+'] '+s)
	}

	static stringToLogLevel(str) {
		return {
			'debug': 0,
			'info': 1,
			'warn': 2,
			'error': 3,
		}[str.toLowerCase()] || -1
	}

	static logLevelToString(logLevel) {
		return {
			0: 'debug',
			1: 'info',
			2: 'warn',
			3: 'error',
		}[logLevel] || 'unknown'
	} 
	
	static getDefaultLogger() {
		return _defaultLogger = _defaultLogger || new Logger()
	}
}


module.exports = Logger


