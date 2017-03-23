
var EXT_REG =  new RegExp (/^[A-z0-9]+\.+/);

var appendChild = function(row) {
	var i = 0,
		j = 0,
		isLast = true,
		key = null,
		extKey = null;

	for (key in row) {
		if (row.hasOwnProperty(key)) {
			extKey = EXT_REG.exec(key);
			
			if (extKey) {
				isLast = false;
				
				extKey = extKey[0].substring(extKey[0].length - 1, 0);
				if (!row[extKey]) {
					row[extKey] = {};					
				}
				
				row[extKey][key.replace(EXT_REG, '')] = row[key];
				delete row[key];
				
				row[extKey] = appendChild(row[extKey]);
			}
		}
	}
	
	return row;
};

var recursive = function(row) {
	var i = 0,
		j = 0,
		key = null,
		extKey = null;
	
	for (;i < row.length ; i++) {
		if (Array.isArray(row[i])) {
			for (j = 0; j < row.length; j++) {
				row[i] = recursive(row[i]);
			}
		}
		else {
			row[i] = appendChild(row[i]);
		}
	}
	
	return row;
};

var extractSubObjects = function(results) {
	return recursive(results);
};

module.exports = extractSubObjects;