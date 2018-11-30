class Animation {
	constructor(options) {
		options = options || {}
		this.mob = options.mob
		this.frames = options.frames || []
		this.running = false
		this.currentFrame = options.currentFrame || 0
		this.mode = options.mode || Animation.LOOP
		this.tickDelay = options.tickDelay || 10
		this.autoStart = options.autoStart
	}

	start(currentFrame) {
		this.currentFrame = currentFrame || 0
		this.running = true
		setTimeout(()=>{this.loop()}, this.tickDelay)
	}

	stop() {
		this.running = false
	}

	addFrame(x,y) {
		this.frames.push([x,y])
	}

	draw() {
		var f = this.frames[this.currentFrame]
		if(this.mob) this.mob.setTile(f[0],f[1])
	}

	loop() {
		this.draw()
		this.currentFrame++
		if(this.currentFrame >= this.frames.length) {
			this.currentFrame = 0
			if (this.mode==Animation.ONCE) this.stop()
		}
		if(this.running) setTimeout(()=>{this.loop()}, this.tickDelay)
	}
}

Animation.LOOP = 0
Animation.ONCE = 1
