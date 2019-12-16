#!/usr/bin/node

const Server = require("./lib/Server")
const Logger = require("./lib/Logger")
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
	var sassEngine = new SassEngine({ logger: logger, recompile: process.env.ENV=="dev" })
	var clientJSEngine = new ClientJSEngine({ logger: logger, beautify: process.env.ENV=="dev" })

	// Main Server
	var svr = new Server({
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
