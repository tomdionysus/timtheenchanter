class Asset {
	constructor(options) {
		options = options || {}
		this.src = options.src
	}

	load(callback) {
		this.element = document.createElement('img')
		this.element.onload = () => callback()
		this.element.src = this.src
	}
}

module.exports = Asset