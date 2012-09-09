/**
 * @author Adam Gibson
 *
 */

var formidable = require('formidable'), http = require('http'), sys = require('sys'), events = require('events'), express = require('express'), util = require('util'), fs = require('fs'), path = require('path'), jquery = require('jQuery');

var FileUploadHandler = function(opts) {
	var defaultOpts = {
		'overwrite' : true,
		'uploadDir' : __dirname + '/uploads',
		'onFinish' : null,
		'maxuploadsize' : 500 * 1024 * 1024
	};

	this._init_opts(opts);
	this.tmpfiles = [];
	var dir = this.options['uploadDir'];
	fs.mkdir(dir, 0755, function() {
		//recursePathList(paths);
		console.log('created ' + dir);
	});
};

FileUploadHandler.prototype._init_opts = function(opts) {
	var defaultOpts = {
		'overwrite' : true,
		'uploadDir' : __dirname + '/uploads'
	};
	if (opts) {
		this.options = defaultOpts;
		jquery.extend(this.options, opts);

		console.log(this.options);
	}

};
/**
 * Process an expressjs req/res for file uploads.
 * @param req the request to process
 * @param res the response to proess
 */
FileUploadHandler.prototype.process = function(req, res) {
	sys.debug('Processing...');
	this.progress = 0, tmpfiles = this.tmpfiles, callback = this.options['onFinish'] || null;
	var form = new formidable.IncomingForm();
	//upload directory
	form.uploadDir = this.options['uploadDir'];
	//max upload size
	form.maxFieldsSize=this.options['maxuploadsize'] || 500 * 1024 * 1024;

	form.addListener('error', function(err) {
		if (err) {
			console.log(err);
			throw err;
		}
	});
    //callback when a file is uploaded
	form.addListener('file', function(name, file) {

		if (callback) {
			console.log('callback invoked');
			callback(file.path);
		}
	});
	form.addListener('fileBegin', function(name, file) {
		tmpfiles.push(file);
	});
	form.addListener('aborted', function() {
		console.log('file upload aborted');
	});

	console.log('parsing request');

	var that = this;
	form.parse(req, function(err, fields, files) {
		if (err) {
			console.log(err);
			throw err;
		}
		that.parseFile(err, fields, files);
	});

	
};
/**
 * Default options for file handler.
 */
FileUploadHandler.prototype.getDefaultOpts = function() {
	var defaultOpts = {
		'overwrite' : true,
		'uploadDir' : __dirname + '/uploads'
	};
	return defaultOpts;
};
/**
 * Parse file function meant to be used with 
 * formidable's parse file function.
 * @param err an error thrown if it exists
 * @param fields the fields belonging to the parsed file
 * @param files metadata about files parsed
 */
FileUploadHandler.prototype.parseFile = function(err, fields, files) {
	var defaultOpts = {
		'overwrite' : true,
		'uploadDir' : __dirname + '/uploads'
	};
	var opts = this.options || defaultOpts, uploaddir = opts['uploadDir'];
	if (err)
		throw err;
	
	var from = files['files[]'].path, to = uploaddir + path.sep + files['files[]'].name;
	console.log('Moving ' + from + ' to ' + to);
};
/**
 * Return current progress of the upload.
 */
FileUploadHandler.prototype.getCurrentProgress = function() {
	var currentProgress = this.progress || 0;
	return currentProgress;
};

/**
 * Make directory full path akin to: mkdir -p
 * Original author: https://gist.github.com/864454
 * @param {Object} fullPath the full path to create
 * @param {Object} callback the call back function
 */
FileUploadHandler.prototype.mkdir = function(fullPath, callback) {
	var parts = path.dirname(path.normalize(fullPath)).split("/"), working = '/', pathList = [];
	console.log('creating ' + fullPath);
	for (var i = 0, max = parts.length; i < max; i++) {
		working = path.join(working, parts[i]);

		pathList.push(working);
	}

	var recursePathList = function recursePathList(paths) {
		console.log('recursing ' + paths);
		if (0 === paths.length) {
			console.log('invoking 0 length callback');
			callback(null);
			return;
		}

		var working = paths.shift();

		try {
			fs.exists(working, function(exists) {
				if (!exists) {
					console.log('Doesn\'t exist creating ' + working);
					try {
						fs.mkdir(working, 0755, function() {
							recursePathList(paths);
						});
					} catch(e) {
						callback(new Error("Failed to create path: " + working + " with " + e.toString()));
					}
				} else {
					recursePathList(paths);
				}
			});
		} catch(e) {
			callback(new Error("Invalid path specified: " + working));
		}
	}
	if (0 === pathList.length)
		callback(new Error("Path list was empty"));
	else
		recursePathList(pathList);

};
/**
 * Move file from the given destination to the given destination.
 * @param {Object} from the file to move from
 * @param {Object} to the directory to move to
 */
FileUploadHandler.prototype.moveFile = function(from, to) {
	var destExists = fs.existsSync(to);
	if (!destExists) {
		//ensure parent directory exists
		var dir = path.dirname(to), exists = fs.existsSync(dir);
		if (!exists) {
			this.mkdir(to, function(obj) {
				if ( typeof obj == 'Error') {
					console.log(obj);
					throw obj;
				} else {
					console.log('No path specified: returning');
				}

			});
		}

	}
	//else {
	var isDir = false;
	try {
		fs.statSync(to).isDirectory();
	} catch(e) {
		isDir = false;
	}

	if (!isDir) {

		var dest = to, destExists = fs.existsSync(dest), overwrite = this.options['overwrite'];
		//auto replace files if they exist
		if (destExists && overwrite) {

			fs.unlink(dest, function(err) {
				if (err)
					throw err;
				console.log('successfully deleted ' + dest);
				fs.rename(from, dest);
			});

			//doesn't exist; just create
		} else if (!destExists) {
			fs.rename(from, dest);
			console.log('destination ' + dest + ' didn\'t exist');
		}
		//append hash to file name with extension
		else if (destExists && !overwrite) {
			var duplicateName = path.basename(dest, path.extname(dest)), hash = path.basename(dest), dir = this.options['uploadDir'], ext = path.extname(dest), newDest = path.join(dir, duplicateName + hash + ext);
			fs.rename(from, dest);
			console.log('appending hash ' + newDest);
		}

	}
	
};
exports.FileUploadHandler = FileUploadHandler;
