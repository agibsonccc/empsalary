/*
 * jQuery File Upload Plugin JS Example 6.7
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, unparam: true, regexp: true */
/*global $, window, document */
function renderHistory(id) {

}

$(function() {'use strict';

	// Initialize the jQuery File Upload widget:
	$('#fileupload').fileupload();

	// Enable iframe cross-domain access via redirect option:
	$('#fileupload').fileupload('option', 'redirect', window.location.href.replace(/\/[^\/]*$/, '/cors/result.html?%s'));

	if (window.location.hostname === 'blueimp.github.com') {
		// Demo settings:
		$('#fileupload').fileupload('option', {
			url : '//jquery-file-upload.appspot.com/',
			maxFileSize : 5000000,
			acceptFileTypes : /(\.|\/)(csv)$/i,
			process : [{
				action : 'load',
				fileTypes : /^\/(csv)$/,
				maxFileSize : 20000000 // 20MB
			}, {
				action : 'resize',
				maxWidth : 1440,
				maxHeight : 900
			}, {
				action : 'save'
			}]
		});
		// Upload server status check for browsers with CORS support:
		if ($.support.cors) {
			$.ajax({
				url : '//jquery-file-upload.appspot.com/',
				type : 'HEAD'
			}).fail(function() {
				$('<span class="alert alert-error"/>').text('Upload server currently unavailable - ' + new Date()).appendTo('#fileupload');
			});
		}
	} else {
		// Load existing files:
		$('#fileupload').fileupload('option', {
			url : '/upload',
			maxFileSize : 5000000,
			acceptFileTypes : /(\.|\/)(csv)$/i,
			process : [{
				action : 'load',
				fileTypes : /^\/(csv)$/,
				maxFileSize : 20000000 // 20MB
			}, {
				action : 'resize',
				maxWidth : 1440,
				maxHeight : 900
			}, {
				action : 'save'
			}],
			done : function(e, data) {
				loadTable();
			}
		});
	}

	// Initialize the Image Gallery widget:
	$('#fileupload .files').imagegallery();

	// Initialize the theme switcher:
	$('#theme-switcher').change(function() {
		var theme = $('#theme');
		theme.prop('href', theme.prop('href').replace(/[\w\-]+\/jquery-ui.css/, $(this).val() + '/jquery-ui.css'));
	});
	$('.emphistorylink').colorbox();
	function getCols(data) {
		var ret = [];
		console.log(data);
		for (var i = 0; i < data.length; i++) {
			if (i > 0)
				ret.push({
					'sTitle' : data[i],
					"asSorting" : ["asc"]
				});
			else {
				ret.push({
					'sTitle' : data[i],
					"asSorting" : ["asc"],
					'fnRender' : function(oobj) {
						return '<a class="emphistorylink" href="/graphhistory/' + oobj.aData[0] + '?id=' + oobj.aData[0] + '">' + oobj.aData[0] + '</a>';
					}
				})
			}
		}
		return ret;
	}

	function loadTable() {
		$.getJSON('/columns', {}, function(data) {
			if (!data) {
				return;
			}

			var cols = getCols(data);
			console.log(cols);
			$('#employees').dataTable({
				"bProcessing" : true,

				"bServerSide" : true,
				"sAjaxSource" : "/employeesdatatable",
				"aoColumns" : getCols(data),
				"bRetrieve" : true,
				"bJQueryUI" : true,
				"fnInitComplete" : function(oSettings, json) {
					$('.emphistorylink').colorbox({
						width : 500,
						height : 500
					});
					$('#aggregatestats').html('');
					$.getJSON('/employees/aggregate/average/M', {}, function(data) {
						$('#aggregatestats').append('<p> Average for males: ' + data['average'] + '</p>');
					});
					$.getJSON('/employees/aggregate/average/F', {}, function(data) {
						$('#aggregatestats').append('<p> Average for females: ' + data['average'] + '</p>');
					});

				}
			});

		});
	}

});
