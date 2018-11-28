#!/usr/bin/node

const Server = require("./lib/Server")
const Logger = require("./lib/Logger")
const I18nEngine = require("./lib/I18nEngine")
const SassEngine = require("./lib/SassEngine")
const ClientJSEngine = require("./lib/ClientJSEngine")

const routes = require('./config/routes')

function main() {
	// ENV and defaults
	var port = parseInt(process.env.PORT || "8080")

	// Logger
	var logger = new Logger()

	// Boot Message
	logger.log("Tim The Enchanter","----")
	logger.log("BlackRaven 2018 (Tom Cully)","----")
	logger.log("v1.0.0","----")
	logger.log("","----")
	logger.log("Logging Level %s","----",Logger.logLevelToString(logger.logLevel))

	// Dependencies
	var i18nEngine = new I18nEngine({ logger: logger })
	var sassEngine = new SassEngine({ logger: logger, recompile: process.env.ENV=="dev" })
	var clientJSEngine = new ClientJSEngine({ logger: logger, beautify: process.env.ENV=="dev" })

	// Init i18n
	i18nEngine.init()

	// Main Server
	var svr = new Server({
		i18nEngine: i18nEngine,
		sassEngine: sassEngine,
		clientJSEngine: clientJSEngine,
		logger: logger,
		port: port,
		env: process.env.ENV || 'prod'
	})

	routes.register(svr)

	// Server Start
	svr.start()
}

main()
