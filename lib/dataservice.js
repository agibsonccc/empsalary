var date = require('./date.js'), dateparser = date.Date, jquery = require('jQuery');
/**
 * An Employee service handles data validation and storage
 * to return data about employees such as data for a particular employee
 * or various stastics such as averages, maxes.
 * The DataService takes in a few options:
 * joinKey : the key two arrays are joined by. defaults to join_by
 * maxallowed : the max number of times data is allowed to be added
 * set this parameter to be the number of times you wish to collect aggregate data + 1 (account for first upload of indexed data)
 * @param opts the options for the data service
 */
var DataService = function(opts) {
	//the join key to index base information and aggregate
	this.joinKey = typeof opts != 'undefined' ? opts['joinKey'] || 'join_by' : 'join_by';
	//current number of times add has been called
	this.numTimesLoaded = 0;
	//max adds allowed for loading data in to the service.
	this.maxAddsAllowed = typeof opts != 'undefined' ? opts['maxallowed'] || 2 : 2;
	//index for loaded aggregate data
	this.data = {};
	//headers for data
	this.headers = [];
};
/* http://stackoverflow.com/questions/1669190/javascript-min-max-array-values */
Array.prototype.max = function() {
	return Math.max.apply(null, this);
}

Array.prototype.min = function() {
	return Math.min.apply(null, this);
}
/**
 * Add data to the service.
 * An internal count is kept for the number of times
 * data is loaded. Continual adds > 2 will
 * cause a reset of the data.
 * @param {Object} arr the data to add
 */
DataService.prototype.add = function(arr) {
	var numTimesLoaded = this.numTimesLoaded, max = this.maxAddsAllowed;

	//need to reset
	if (numTimesLoaded >= max) {
		//load method has been invoked, resetting to 1 is equivalent to the "first time"
		this.numTimesLoaded = 1;
		//reset data
		this.data = {};
		//reset headers
		this.headers = [];
	}
	//increment
	else
		this.numTimesLoaded++;

	switch(this.numTimesLoaded) {
		/* Initial data, load data indexed by join key. */
		case 1 :
		     //whether the column headers have been added yet
			var added = false;
			for (var i = 0; i < arr.length; i++) {
				var obj = arr[i];
				//add the column headers by grabbing
				//them from the first object
				if (!added) {
					var keys = Object.keys(obj);
					this.headers = keys;

				}
                //add the object indexed by primary key
				var valForJoin = obj[this.joinKey];
				this.data[valForJoin] = obj;

			}
			break;
		/* Load aggregate data */
		default:
			for (var i = 0; i < arr.length; i++) {
				var obj = arr[i], valForJoin = obj[this.joinKey], curr = this.data[valForJoin];
				if (!curr.aggregate)
					curr.aggregate = [];
				/* When performing a reduce operation, load aggregate data in to an array. */

				curr.aggregate.push(obj);

			}
			break;

	}
};

/**
 * Return the aggregate data array for the given key.
 * Note that this method will return null until aggregate data
 * is loaded in to the service.
 * @param {Object} key the key to get aggregate data for
 */
DataService.prototype.aggregateFor = function(key) {
	//ensure aggregate data is loaded
	var loaded = this.numTimesLoaded > 1;
	if (loaded) {
		var ret = this.data[key];
		if (ret)
			return ret.aggregate;
	}
	//force an error when no aggregate data is loaded.
	return null;
};
/**
 * Returns statistics about a particular field:
 * (field is numeric)
 * The following fields will be returned:
 * average,max,min,median
 * @param key the key of the aggregate to get
 * @param field the field to do stats over
 * @return an object keyed by statistic
 */
DataService.prototype.stats = function(key, field) {
	var agg = this.aggregateFor(key);
	if (!agg)
		return {};
	else {
		var average = this.average(key, field), arr = this.valsForField(key, field), max = arr.max(), min = arr.min(), median = this.median(key, field);
		return {
			'average' : average,
			'max' : max,
			'min' : min,
			'median' : median
		};
	}
};

/**
 *  http://caseyjustus.com/finding-the-median-of-an-array-with-javascript
 * @param key the aggregate to get the mean for
 * @param field the field to get the median of
 * @return the median for a given key and field
 * */
DataService.prototype.median = function(key, field) {
	//get the values for a particular aggregate
	//key value in an array
	var arr = this.valsForField(key, field);
	arr.sort(function(a, b) {
		return a - b;
	});
	var half = Math.floor(arr.length / 2);

	if (arr.length % 2)
		return arr[half];
	else
		return (arr[half - 1] + arr[half]) / 2.0;
};
/**
 * Returns an array values for a given key and field.
 * @param key the aggregate to get data for
 * @param field the field to get the array for
 */
DataService.prototype.valsForField = function(key, field) {
	var agg = this.aggregateFor(key);
	if (!agg)
		return [];
	else {
		var arr = [];
		for (var i = 0; i < agg.length; i++) {
			var obj = agg[i], val = obj[field];
			arr.push(val);
		}
		return arr;
	}
};

/**
 * Returns the min number for the given key and field.
 * @param key the key of the aggregate to get data for
 * @param field the field to get the min number for
 */
DataService.prototype.min = function(key, field) {
	var arr = [];
	var agg = this.aggregateFor(key);
	if (!agg)
		return {};
	else {
		//Build the array and find the min
		for (var i = 0; i < agg.length; i++) {
			//aggregate       //value in aggregate by field name
			var obj = agg[i], val = obj[field];
			arr.push(val);
		}
		return arr.min();
	}
};
/**
 * Returns the max number for the given key and field.
 * @param key the key of the aggregate to get data for
 * @param field the field to get the min number for
 */
DataService.prototype.max = function(key, field) {
	var arr = [];
	var agg = this.aggregateFor(key);
	if (!agg)
		return {};
	else {
	     //Build array and find max
		for (var i = 0; i < agg.length; i++) {
			//aggregate       //value in aggregate by field name
			var obj = agg[i], val = obj[field];
			arr.push(val);
		}
		return arr.max();
	}
};
/**
 * Get the data points for an aggregate data for x and y points.
 * The data will be return in the form of:
 * [{'x' : val,  'y': val} ]
 * @param key key the key to get the aggregate for
 * @param x the x attribute to use
 * @param y the y attribute to use
 */
DataService.prototype.dataPoints = function(key, x, y) {
	var agg = this.aggregateFor(key);
      //didn't exist
	if (!agg)
		return [];
	else {
		var ret = [];
		//build the x, y pairs from aggregate
		//values based on the specified x,y pairs
		for (var i = 0; i < agg.length; i++) {
			var obj = agg[i], xVal = obj[x], yVal = obj[y], add = {
				'x' : xVal,
				'y' : yVal
			};
			ret.push(add);

		}

		return ret;

	}
};
/**
 * Return the row for a given key.
 * @param key the key to get the row for
 * @param includeAggregate, whether to include aggregate, defaults to false
 * if nothing passed in
 */
DataService.prototype.rowFor = function(key, includeAggregate) {
	var row = this.data[key], include = includeAggregate || false;
	if (row) {
		//deep copy
		var copy = jquery.extend(true, {}, row);
		//delete aggregate
		if (!includeAggregate)
			delete copy['aggregate'];
		return copy;
	}
	return null;
};

/**
 * Return all of the data directly.
 */
DataService.prototype.getData = function() {
	return this.data;
};
/**
 * Retrieve the columns for the current model stored.
 */
DataService.prototype.getColumns = function() {
	return this.headers;
};
/**
 * See: http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
 */
DataService.prototype.isNumber = function(test) {
	return !isNaN(parseFloat(test)) && isFinite(test);

}
/**
 * Return the sum for an aggregate for a particular field.
 * @param {Object} key the aggregate to get the sum for
 * @param {Object} field the field to get the sum for
 * @return the sum for the given key and field
 */
DataService.prototype.sum = function(key, field) {
	var agg = this.aggregateFor(key);

	//no data
	if (!agg == null) {
		console.log('no data found for : ' + key);
		return 0;
	} else {
		var ret = 0;
		for (var i = 0; i < agg.length; i++) {
			var curr = agg[i], fieldVal = curr[field];
			//undefined or zero
			if (!fieldVal)
				continue;
			//ensure doesn't crash on strange input like invalid strings
			//cast to number if needed
			ret += parseFloat(fieldVal);

		}
		return ret;
	}
};

/**
 * Return the sum for an aggregate for a particular field filtered by a value of
 * a particular attribute in the host object equal to value.
 * @param comp the value to compare when filtering for averages
 * @param field the field to average
 * @param {Object} value the value to filter by
 */
DataService.prototype.sumBy = function(comp, field, value) {
	var data = this.getData(), keys = Object.keys(data);
	var ret = 0;
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i], agg = data[key].aggregate;
		if (!agg || agg.length < 1)
			throw new Error('Couldn\t find aggregate for summing');

		for (var j = 0; j < agg.length; j++) {

			var curr = agg[j];
			//ensure to skip undefined aggregates
			if (!curr)
				continue;
			var fieldVal = curr[field], compVal = data[key][comp];
			//field may be string
			if (value == compVal)
				ret += parseFloat(fieldVal);
		}

	}
	return ret;

};
/**
 * Return the avg for an aggregate for a particular field.
 * @param comp the value to compare when filtering for averages
 * @param field the field to average
 * @param {Object} value the value to filter by
 */
DataService.prototype.averageBy = function(comp, field, value) {
    //account for length of data, (I'm aware this could be O(1) with some tracking, will optimize when necessary)
	var length = Object.keys(this.getData()).length;
	//ensure no floating point integer madness
	var sum = this.sumBy(comp, field, value), average = sum / length;
	return average;

};
/**
 * Return the avg for an aggregate for a particular field.
 * @param {Object} key the aggregate to get the sum for
 * @param {Object} field the field to get the sum for
 */
DataService.prototype.average = function(key, field) {
	var agg = this.aggregateFor(key);
	if (agg == null || agg.length < 1)
		return 0;
	else {
		var sum = this.sum(key, field), average = sum / agg.length;
		
		return average;
	}
};
/**
 * Returns a sorted array of elements sorted by the given key in
 * ascending order
 * (assuming the field value is a date)
 * @param {Object} key the key to get an array for
 * @param {Object} field the field to get aggregate values for
 */
DataService.prototype.orderedByDateAscending = function(key, field) {
	var agg = this.aggregateFor(key);
	if (!agg)
		return null;
	else {
		//copy whole array
		var copy = agg.slice(0);
		//sort by date, descending
		copy.sort(function(a, b) {
			if (a.field > b.field)
				return 1;
			else if (a.field < b.field)
				return -1;
			return 0;
		});
		return copy;
	}
};
/**
 * Returns a sorted array of elements sorted by the given key in
 * descending order
 * (assuming the field value is a date)
 * @param {Object} key the key to get an array for
 * @param {Object} field the field to get aggregate values for
 */
DataService.prototype.orderedByDateDecending = function(key, field) {
	var agg = this.aggregateFor(key);
	if (!agg)
		return null;
	else {
		//copy whole array
		var copy = agg.slice(0);
		//sort by date, descending
		copy.sort(function(a, b) {
			if (a.field < b.field)
				return 1;
			else if (a.field > b.field)
				return -1;
			return 0;
		});
		return copy;
	}
};
exports.DataService = DataService;
