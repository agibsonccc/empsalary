
/*
 * GET home page.
 */

var express=require('express'),util=require('util')
,app=express(),uploader=require('../lib/uploadhandler.js');
app.use(express.bodyParser());

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
exports.graph = function(req,res) {
	res.render('graph', {title : 'Graph'});
};
