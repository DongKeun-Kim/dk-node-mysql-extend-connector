
var mysql = require("mysql");
var logging 			= function(){};

module.exports = function (query, values) {
	var res = "";
	
	logging("[MySQL]Prev Query->\n" + query);
	if (!values) {
		logging("[MySQL]Convert Query->\n" + query);
		return query;
	}
	
	res = mysql.format(query, values);

	if (!Array.isArray(values) ) {
		res = res.replace(/\:(\w+)/g, function (txt, key) {
			if (values.hasOwnProperty(key)) {
				return this.escape(values[key]);
			}
			
			return txt;
		}.bind(this));
	}
	
	logging("[MySQL]Convert Query->\n" + res);
	return res;
};

module.exports.setLogger = function(logger) {
	logging = logger;
};