module.exports.register = function(svr) {
	// Public Assets
	svr.registerStatic('/images','images')
	svr.registerStatic('/favicon.ico','/favicon.ico')

	// Sass -> CSS
	svr.registerSaas('/css/app.css', 'sass/app.scss')
	
	// Clientside JS Compiler
	svr.registerClientJS('/js/app.js', 'clientjs')

	// Index
	svr.registerPublic('/', 'index')
	svr.registerPublic('/editor', 'editor')

	// Editor API Routes
	svr.registerPublic('/api/map', 'map')
}
