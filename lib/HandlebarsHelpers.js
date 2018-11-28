const handlebars = require('handlebars')
const querystring = require('querystring')
const _ = require('underscore')
const striptags = require('striptags')
const moment = require('moment')
const Case = require('case')

handlebars.registerHelper('isin', function(elem, obj, options) {
	if(elem.indexOf(',' > -1)) {
		var elems = elem.split(',')
		for(var i=0; i<elems.length; i++) {
			if(obj[elems[i]]) { return options.fn(this) }
		}
		return options.inverse(this)
	} else {
		// Single Case
		if(obj[elem]) { return options.fn(this) }
		return options.inverse(this)
	}
})
handlebars.registerHelper('times', function(n, block) {
	var accum = ''
	for(var i = 0; i < n; ++i)
		accum += block.fn(i)
	return accum
})
handlebars.registerHelper('inc', function(value)
{
	return parseInt(value) + 1
})

handlebars.registerHelper('camel', function(one) {
	return Case.camel(one)
})

handlebars.registerHelper('capital', function(one) {
	return Case.capital(one)
})

handlebars.registerHelper('snake', function(one) {
	return Case.snake(one)
})

handlebars.registerHelper('eq', function(one, two, options) {
	if(one == two) {
		return options.fn(this)
	} 
	return options.inverse(this)
})

handlebars.registerHelper('neq', function(one, two, options) {
	if(one != two) {
		return options.fn(this)
	} else {
		return options.inverse(this)
	}
})

handlebars.registerHelper('undef', function(one, options) {
	if(one===undefined) {
		return options.fn(this)
	} else {
		return options.inverse(this)
	}
})

handlebars.registerHelper('notundef', function(one, options) {
	if(one!==undefined) {
		return options.fn(this)
	} else {
		return options.inverse(this)
	}
})

handlebars.registerHelper('limit', function(text, len) {
	if (!text) { return '' }
	var out = text.substr(0,len)
	if (text.length>len) out+='...'
	return out
})

handlebars.registerHelper('each_upto', function(ary, max, options) {
	if(!ary || ary.length == 0)
		return options.inverse(this)

	var result = [ ]
	for(var i = 0; i < max && i < ary.length; ++i)
		result.push(options.fn(ary[i]))
	return result.join('')
})

handlebars.registerHelper('hasprefix', function(val, arr, options) {

	var found = false
	if(!Array.isArray(arr)) arr = arr.toString().split(',')
	for(var i=0; i<arr.length; i++) {
		var item = arr[i].trim()
		if (item == val.substr(0,item.length)) { found = true; break }
	}

	if(found) {
		return options.fn(this)
	} else {
		return options.inverse(this)
	}
})

handlebars.registerHelper('rolename', function(role) {
	switch(role) {
	case 'admin': return 'Administrator'
	case 'user': return 'User'
	}
})

handlebars.registerHelper('subtype', function(subtype) {
	switch(subtype) {
	case 'free': return 'Free'
	case 'bronze': return 'Bronze'
	case 'silver': return 'Silver'
	case 'gold': return 'Gold'
	default: return '-Unknown-'
	}
})

handlebars.registerHelper('isoDate', function(longDate, options) {
	var d
	if (longDate == null && options.hash.nullDate) { 
		return options.hash.nullDate
	}

	try{
		d = new Date(longDate).toISOString().slice(0, 10)
	}catch(e){
		d = options.hash.badDate || '-Unknown-'
	}
	return d
})

handlebars.registerHelper('date', function(date, options) {
	if (date == null && options.hash.nullDate) { 
		return new handlebars.SafeString(options.hash.nullDate)
	}
	var d, n = moment()
	try{
		d = moment(date)
	}catch(e){
		d = options.hash.badDate || '-Unknown-'
	}

	var mins = n.diff(d, 'minutes') 
	var hrs = n.diff(d, 'hours')
	var days = n.diff(d, 'days')

	if(days>0) return days+'d ago' 
	if(mins<5) return 'Just now' 
	if(mins<60) return mins+'m ago' 
	if(hrs==1) return '1hr ago' 
	if(hrs<24) return hrs+'hrs ago' 

	return d.format(options.hash.format || 'MMM Do YYYY h:mma')
})

handlebars.registerHelper('add', function(num, inc) {
	return num+inc
})

handlebars.registerHelper('concat', function() {
	arguments = _.values(arguments)
	return arguments.join('')
})

handlebars.registerHelper('month', function(num) {
	const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }
	return months[num]
})

handlebars.registerHelper('json', function(obj) {
	return new handlebars.SafeString(JSON.stringify(obj))
})


handlebars.registerHelper('urlquery', function(query, options) {
	var current = query

	for(var k in options.hash) {
		current[k] = options.hash[k]
	}
	if(_.keys(current).length==0) { return '' }

	return new handlebars.SafeString('?'+querystring.stringify(current))
})

handlebars.registerHelper('hiddenfields', function(options) {
	var out = ''

	for(var k in options.hash) {
		out += '<input type="hidden" name="'+k+'" value="'+options.hash[k]+'">'
	}

	return new handlebars.SafeString(out)
})

handlebars.registerHelper('sortheader', function(title, field, options) {
	var current = this.request.query

	for(var k in options.hash) {
		current[k] = options.hash[k]
	}
	current.sort_by=field

	if (this.sort_by == field) {
		if (this.sort_dir == 'desc') {
			delete current['sort_dir']
		} else {
			current.sort_dir = 'desc'
		}
	}

	return new handlebars.SafeString('<a href="'+this.request.path+'?'+querystring.stringify(current)+'">'+title+'</a>')
})

handlebars.registerHelper('subtype', function(sub) {
	const subs = { 'free':'Free','bronze':'Bronze','silver':'Silver','gold':'Gold' }
	return subs[sub]
})

handlebars.registerHelper('striptags', function(text, options) {
	if (!text) { return '' }
	if (options.hash.limit) {
		var out = text.substr(0,options.hash.limit)
		if (text.length>options.hash.limit) out+='...'
		text = out
	}

	return new handlebars.SafeString(striptags(text))
})

handlebars.registerHelper('urlencode', function(url) {
	return new handlebars.SafeString(encodeURIComponent(url))
})

handlebars.registerHelper('round', function(num, digits, options) {
	var fac = 10^digits
	var out = Math.round(num*fac)/fac
	if (options.hash.positiveprefix && out>0) { out = options.hash.positiveprefix+out.toString() }
	return out
})

handlebars.registerHelper('yesno', function(sw, options) {
	var yes = options.hash.yes || 'Yes'
	var no = options.hash.no || 'No'
	switch(sw) {
	case true:
	case 'T':
	case 'Y':
		return yes
	case false:
	case 'F':
	case 'N':
		return no
	default:
		return 'Unknown'
	}
})

handlebars.registerHelper('eventType', function(eventType, options) {
	var unknownText = options.hash.unknownText || '-Unknown-'
	switch(eventType) {
	case 'clock_in':
		return 'Clock In'
	case 'clock_out':
		return 'Clock Out'
	default:
		return unknownText
	}
})