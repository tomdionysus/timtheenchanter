module.exports = function (type, ref) {
	type = Object.assign({}, type)
	type.ref = ref
	return type
}

module.exports.order = {
	not_found: { code: 'NOT_FOUND', message: 'Order does not exist' },
	conflict: { code: 'CONFLICT', message: 'Order exists' },
	session_error: { code: 'SESSION_ERROR', message: 'Error saving session' },
}