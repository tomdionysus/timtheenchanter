const path = require('path')
const fs = require('fs')
const handlebars = require('handlebars')
const _ = require('underscore')
const util = require('util')
const langparser = require('accept-language-parser')

const Logger = require('./Logger')
const ScopedLogger = require('./ScopedLogger')

class I18n {
	constructor(options) {
		options = options || {}
		this.options = options
		this.logger = new ScopedLogger('i18n', options.logger || new Logger())
		this.langDir = options.langDir || path.join(__dirname,'../client/i18n')
		this.defaultLang = options.defaultLang || 'en'
		this.useCache = options.useCache == undefined ? true : !!options.useCache

		this._cache = {}
	}

	init() {
		var self = this

		this.langs = this.loadLangs()

		handlebars.registerHelper('i18n', function() {
			var args = _.values(arguments)
			var options = args.pop()
			var pargs = [ options.data.root.request.i18n.pri, args.shift().split('.') ]
			return self.findLang.apply(self, pargs.concat(args))
		})
	}

	findLang() {
		var args = _.values(arguments)
		var reqlangs = args.shift()
		var phrasePath = args.shift()

		for(var i=0; i<reqlangs.length; i++) {
			var strName = reqlangs[i]+'.'+phrasePath.join('.')
			var langset = this.langs[reqlangs[i]]
			if(!langset) continue
			if (this.useCache && this._cache[strName]) return util.format.apply(util,[this._cache[strName]].concat(args))
			for(var j=0; j<phrasePath.length; j++) {
				var sel = langset[phrasePath[j]]
				if(!sel) break
				if(_.isString(sel)) {
					if (this.useCache) this._cache[strName] = sel
					return util.format.apply(util,[sel].concat(args))
				}
				langset = sel
			}
		}
		return '['+phrasePath.join('.')+']'
	}

	loadLangs() {
		var langs = {}
		var items = fs.readdirSync(this.langDir)
		for(var i = 0; i<items.length; i++) {
			var langpath = path.join(this.langDir, items[i])
			if (fs.statSync(langpath).isDirectory()) {
				var name = path.parse(items[i]).name
				this.logger.debug('Loading '+name)
				langs[name] = this.loadLang(langpath,name)
			}
		}
		return langs
	}

	loadLang(langDir) {
		var lang = {}
		var items = fs.readdirSync(langDir)
		for(var i = 0; i<items.length; i++) {
			var langpath = path.join(langDir, items[i])
			var name = path.parse(items[i]).name
			if (fs.statSync(langpath).isDirectory()) {
				lang[name] = this.loadLang(langpath)
			} else {
				lang[name] = require(langpath)
			}
		}
		return lang
	}

	// Express middleware
	express(req, res, next) {
		var self = this
		var hdr = req.get('accept-language')
		var langs = langparser.parse(hdr)
		var pri = []
		if (req.query.i18n) {
			var forceLang = langparser.parse(req.query.i18n)
			langs = forceLang.concat(langs)
		}
		var hdrlang = null
		var outlangs = []
		for(var i=0; i<langs.length; i++) {
			if(langs[i].code=='*') continue
			var langstr = langs[i].code+(langs[i].region ? '-'+langs[i].region : '')+(langs[i].script ? '-'+langs[i].script : '')
			pri.push(langstr)
			if (!hdrlang && self.langs[langstr]) hdrlang = langstr
			outlangs.unshift(langs[i])
		}
		if (!hdrlang) hdrlang = self.defaultLang
		if (pri.indexOf(self.defaultLang)==-1) pri.push(self.defaultLang)
		req.i18n = {
			header: hdr,
			langs: outlangs,
			pri: pri,
			get: function() {
				var args = _.values(arguments)
				var phrasePath = args.shift()
				var pargs = [ req.i18n.pri, phrasePath.split('.') ]
				return self.findLang.apply(self, pargs.concat(args)) 
			}
		}
		res.set('Content-Language',hdrlang)
		next()
	}
}

module.exports = I18n