/*
 * Create function for handling of data parsing and separation. (event?)
 * Possible statistics:
 * Use rickshaw to display a graph overtime of the user's salary (backbone model/view?)
 * stats:
 * average salaries by sex
 * average salaries by age
 * average salary by birth month?
 * P(raise | age) (MAYBE)
 * P(raise | salary)
 * P(age | birthday)
 */
var 
events = require('events'), 
fs=require('fs'),
jquery = require('jQuery'), 
util = require('util'), 
path = require('path'), 
csv = require('csv');

/**
 *
 * Valid values:
 * headers: whether there are column headers or not, defaults to false
 * if headers is true, the data processor when loading a file will make the assumption
 * that the first row has headers or not, if it does, it will use these as labels, otherwise, it
 * will automatically assign headers based on data type.
 * basepath: a string denoting the base path of every file, defaults to current directory
 * @param opts options for the data processor.
 */
var DataProcessor = function(opts) {

	var defaults = {
		'headers' : false,
		'basepath' : __dirname
	};

	if ( typeof opts == 'undefined') {
		this.options = defaults;
	} else {
		this.options = defaults;
		jquery.extend(this.options, opts);
		console.log('Created data processor for : ');
		console.log(opts);
	}
	events.EventEmitter.call(this);
};

DataProcessor.prototype._updateOptions = function(opts) {
	var defaults = {
		'headers' : false,
		'basepath' : __dirname
	};

	if ( typeof opts == 'undefined') {
		this.options = defaults;
	} else {
		this.options = defaults;
		jquery.extend(this.options, opts);
		console.log('Created data processor for : ' + opts);
	}
};

/**
 * Load data from a csv relative to the name of the file passed in
 * and the base path the processor was initiated with.
 * The delegate will be invoked once data has been collected and parsed.
 * Data will come out one of two ways when headers is true or false.
 * If data is one based all elements of the passed in array will be an array.
 * Otherwise, they will be an array of objects keyed by column name as indicated
 * in the first row of the csv file.
 * @param {Object} path the name of the file to load
 * @param {function} delegate, the delegate to invoke once the data
 * is completely loaded
 */
DataProcessor.prototype.load = function(path, delegate) {
	if ( typeof delegate !== 'function') {
		throw new Error('Delegate isn\'t a function!');
	}
	console.log('Loading ' + path);
	var base = this.options['basepath'], headers = this.options['headers'], arr = [], loadFrom = base + '/' + path;
	fs.exists(loadFrom, function(exists) {
		if (!exists) {
			throw new Error('Attempted to load nonexistant file ' + loadFrom);
		} else {
			//load with columns based on what was specified in the constructor
			csv().fromPath(loadFrom, {
				'columns' : headers
			}).transform(function(data) {
				return data;
			}).on('data', function(data, index) {
				arr.push(data);
			}).on('end', function(count) {
				delegate(arr);
			}).on('error', function(error) {
				console.log(error.message);
				throw error;
			});
		}
	});

};
//util.inherits(DataProcessor, events.EventEmitter);
exports.DataProcessor = DataProcessor;
