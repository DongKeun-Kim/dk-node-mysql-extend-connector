var fs				= require('fs'),
	path			= require('path'),
    xml2js			= require('xml2js');

var Promise			= require('promise');
var logging 			= function(){};

function checkPath(dirName, cb) {
	var dirFullPath = path.resolve(dirName);
		
	fs.exists(dirFullPath, (exists) => {
		if (exists) {
			cb(null, dirFullPath);
		}
		else {
			cb(new Error(dirFullPath + "is not Directory"));
		}
	});
}

function fileLoad(filePath) {
	return new Promise((resolved, rejected) => {
		var parser = new xml2js.Parser({
			trim : true,
			explicitArray : false
		});
		
		fs.readFile(filePath, (err, data) => {
			if (err) {
				return rejected(err);
			}
			
			parser.parseString(data, (err, result) => {
				if (err) {
					return rejected(err);
				}
				
				logging("[MySQL-Init]XML File Load -> " + filePath);
				
				return resolved(result);
			});
		});
	});
}

module.exports = function load(dirPath, cb) {
	
	checkPath (dirPath, (err, fullPath) => {
		if (err) {
			return cb(err);
		}
		
		fs.readdir(fullPath, (err, files) => {
			var tasks = [];
			
			if (err) {
				return cb(err);
			}
			
			files.forEach(file => {
				if (file.toLowerCase().lastIndexOf(".xml") === file.length - 4) {
					tasks.push(fileLoad (fullPath + path.sep + file));
				}
			});
			
			Promise.all(tasks).then(results => {
				var obj = {};
				
				results.forEach(result => {
					if (result) {
						for (var key in result) {
							if (result.hasOwnProperty(key)) {
								obj[key] = result[key];
							}
						}
					}
				});
				
				cb(null, obj);
				
			}).catch(err => {
				cb(err);
			});  
		});
	});
};

module.exports.setLogger = function(logger) {
	logging = logger;
};