const fs = require('fs')
const path = require('path')

module.exports = {
	get: function(req,res) {
		fs.readFile(path.join(__dirname,'../../gameMaps/map.js'),function(err, data) {
			if (err) { res.status(500).send(JSON.stringify(err)); return }
			res.json = JSON.parse(data)
			res.status(200).set('content-type','application/json').send(JSON.stringify(res.json)).end()
		})
	},

	post: function(req,res) {
		this.gameMap = req.body
		this.gameMap = this.gameMap || {}
		this.gameMap.map = this.gameMap.map || []
		fs.writeFile(path.join(__dirname,'../../gameMaps/map.js'), JSON.stringify(this.gameMap), function(err, data) {
			if (err) { res.status(500).send(JSON.stringify(err)); return }
			res.status(200).set('content-type','application/json').send(JSON.stringify({status:"OK"})).end()
		})
	}
}