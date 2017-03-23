var mysql		= require("mysql");
var Pool		= require("mysql/lib/Pool");

var Sequence	= require("mysql/lib/protocol/sequences/Sequence");
var Query		= require("mysql/lib/protocol/sequences/Query");

var Promise		= require('promise');

var xmlLoader	= require('./xml-loader');
var extractor	= require('./json-extractor');
var queryFormat	= require('./query-format');

Sequence.prototype.__end = Sequence.prototype.end;
Sequence.prototype.end = function(err) {
	if (this instanceof Query) {
		if (Array.isArray(arguments[1])) {
			arguments[1] = extractor(arguments[1]);
		}
	}
	
	Sequence.prototype.__end.apply(this, arguments);
};

var dynamicQuery = function(sql, target) {
	return function(values, cb) {
		if (!cb) {
			cb = values;
			values =  [];
		}
		
		target.query(sql, values, (err, results, field) => {
			cb(err, results, field);
		});
	};
};
	
Pool.prototype.setXmlMapper = function(dirPath, cb) {
	var self = this;
	
	this.logging("[MySQL-Init]Directory Read:", dirPath);
	xmlLoader(dirPath, (err, obj) => {
		if (err) {
			return cb(err);
		}
		
		if (obj.query) {
			for (var key in obj.query) {
				if (obj.query.hasOwnProperty(key)) {
					self.logging("[MySQL-Init]Dynamic Query Added : " + key);
					self[key] = dynamicQuery(obj.query[key], self);
				}
			}
		}
		
		cb(null);
	});
};

Pool.prototype.proc = function(procedureName, params, cb) {
	this.getConnection((err, connection) => {
		var query = 'call ' + procedureName + '(';
		var i = 0;
		
		if (err) {
			return cb(err);
		}
			
		for (; i < params.length; i++) {
			query += "?, ";
		}
		
		query = query.substring(0, query.length - 2) + ")";
			
		connection.query(query, params, 
				(err, results, fields) => {
					try {
						connection.release();
					} catch (e) {}
					
					if (err) {
						return cb(err);
					}
					
					cb(null, results, fields);
				});
	});
};

Pool.prototype.exec = function(procedureName, params) {
	return new Promise((resolved, rejected) => {
		this.proc(procedureName, params, (err, results, fields) => {
			if (err) {
				return rejected(err);
			}
			
			resolved(results);
		});
	});
};


Pool.prototype.promiseQuery = function(query, cb) {
	return new Promise((resolved, rejected) => {
		
		this.getConnection((err, connection) => {
			connection.query(query, 
					(err, results, fields) => {
						try {
							connection.release();
						} catch (e) {}
						
						if (err) {
							return rejected(err);
						}
						
						resolved(results);
					});
		});
	});
	
};
module.exports = Pool;

module.exports.createPool = function createPool(config) {
	config.queryFormat = queryFormat;
	
	var pool = mysql.createPool(config);
	
	if (typeof config.logger === "function") {
		pool.logging = config.logger;
		xmlLoader.setLogger(config.logger);
		queryFormat.setLogger(config.logger);
	}
	else {
		pool.logging = function(){};
	}
	
	return pool;
};

