/**
 * Module dependencies.
 *
 * Add command line support for indicating headers for csv files or not.
 */

var express = require('express'), routes = require('./routes'), http = require('http'), filehandler = require('./lib/uploadhandler.js'), dataprocessor = require('./lib/dataprocessor.js'), dataservice = require('./lib/dataservice.js'), dataService = new dataservice.DataService({
	'joinKey' : 'employee_id'
}), path = require('path');

var app = express();
// prevent bodyParser from handling multipart forms)
//delete express.bodyParser.parse['multipart/form-data'];
app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	//app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(require('less-middleware')({
		src : __dirname + '/public'
	}));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
	app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/upload', function(req, res) {
	var dir = __dirname + '/uploads', fileUpload = new filehandler.FileUploadHandler({
		'uploadDir' : dir,
		'onFinish' : function(fullpath) {
			console.log('invoking on finish on ' + fullpath);
			//load csv file
			var dp = new dataprocessor.DataProcessor({
				'basepath' : dir,
				'headers' : true
			});
			//base file name
			var name = path.basename(fullpath);

			//load the data with the given callback
			dp.load(name, function(data) {
				//send data down to the client for rendering
				//quick hack here: I'm aware it isn't optimized, it's just the way the data is loaded being: data
				//is an object with key value pairs such that:
				//{col1\tcol2\t : val1\tval2\t}
				var keys = Object.keys(data), arr = [];
				for (var i = 0; i < data.length; i++) {
					var obj = data[i], key = Object.keys(obj)[0], val = obj[key], cols = key.split('\t'), vals = val.split('\t');

					var build = {};

					for (var j = 0; j < cols.length; j++) {
						var objKey=cols[j],objVal=vals[j];
						build[objKey]=objVal;
					}
					arr.push(build);
					
				}
				//load in to the data service for storage and processing
				dataService.add(arr);
			});

		}
	});
	req.on('error', function(err) {
		if (err)
			res.json(500, err);
	});

	fileUpload.process(req, res);
	res.json(200,JSON.stringify({'message' : 'done'}));
	//res.end();
	//res.send(JSON.stringify({'message' : 'thank you'}));
});
/* Meant for use with data tables server side processing */
app.get('/employeesdatatable', function(req, res) {
	//data needs to be manipulated to conform to data tables server side processing
	var data = dataService.getData(),keys=Object.keys(data),tableData=[];
	for(var i=0;i<keys.length;i++) {
		var obj=data[keys[i]],objKeys=Object.keys(obj),add=[];
		//convert keyed values in to an indexed array.
		for(var j=0;j<objKeys.length;j++) {
			add.push(obj[objKeys[j]]);
		}
		//add to table data for display
		tableData.push(add);
	}
	
	var ret = {
		'sEcho' : req.query.sEcho,
		'iTotalRecords' : data.length,
		'iTotalDisplayRecords' : data.length,
		'aaData' : tableData
	};
	res.json(200, ret);
});

app.get('/graphhistory/:id',function(req,res){
	res.render('graph', {title : 'Graph',id : req.params.id});
});
/* return an individual row for an employee, no aggregate data attached */
app.get('/employees/:id', function(req, res) {
	var ret = dataService.rowFor(req.params.id, false);
	res.json(200, ret);
});
/* get employee history */
app.get('/employees/history/:id', function(req, res) {
	var arr = dataService.dataPoints(req.params.id,'start_of_salary','salary');
	for(var i=0;i<arr.length;i++) {
		var obj=arr[i],x=obj['x'],y=obj['y'];
		obj['x']=parseFloat(new Date(obj['x']).getDate());
		obj['y']=parseFloat(obj['y']);
	}
	res.json(200, arr);
});
/* average by gender */
app.get('/employees/aggregate/average/:gender',function(req,res){
	var avg=dataService.averageBy('sex','salary',req.params.gender);
	console.log('average ' + avg);
	res.json(200,{'average' : avg});
});
/* statistics about employee salary, ie mean mode. */
app.get('/employees/history/stats/:id',function(req,res){
	var stats=dataService.stats(req.params.id,'salary');
	res.json(200,stats);
});
/* retrieve current table headers */
app.get('/columns', function(req, res) {
	var columns = dataService.getColumns();
	if (columns) {
		res.json(200, columns);
	} else
		res.json(200, []);
});

http.createServer(app).listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});
