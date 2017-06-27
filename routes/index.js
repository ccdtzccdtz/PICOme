var express = require('express');
//var async = require('async');
var router = express.Router();

// psql package import
var pg = require("pg");
 

var conString = "caworkhorse2://postgres:postgres@192.168.116.156/national_db_2016";
var links = {'major':null, 'major_counts':null, 'county':null};
var zones = null;
var rbush = require("rbush");
var tree = null;
var idx = null;




/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {});
});


//routes/index.js
/* GET map page. */
router.get('/map', function(req, res) {
	if(JSON.stringify(req.query)==="{}"){
        res.end();
	}
	else{
		console.log(req.query);
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query("SELECT row_to_json(fc) "
			+ "FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features "
			+ "FROM (SELECT 'Feature' As type "
				+ ", ST_AsGeoJSON(lg.geom)::json As geometry "
				+ ", row_to_json( (select l from (select feat_id) as l))  As properties "
				+ "FROM tiles.national_priority0 as lg) "
					+ "As f )  As fc") ;
		console.log(query.text);
		query.on("row", function (row, links) {
			links.addRow(row);
			console.log(query);
		});
		query.on("end", function (links) {
			res.send(links.rows[0].row_to_json);
			client.end();
			res.end();
		});
	}	
});

router.get('/grids', function(req,res){
	if(JSON.stringify(req.query)==="{}"){
        res.end();
	}
	else{
		console.log(req.query);
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query("SELECT row_to_json(l) "
				+ "FROM tiles.render_xy_grids('national_all', 450, 180, $1,$2,$3,$4) "
					+ " as l", [req.query.xmin, req.query.ymin, req.query.xmax, req.query.ymax]) ;
		console.log(query.text);
		query.on("row", function (row, links) {
			links.addRow(row);
		});
		query.on("end", function (links) {
			res.send(links.rows[0].row_to_json);
			client.end();
			res.end();
		});
	}	
});

router.post('/refreshmap', function(req, res) {
	if(JSON.stringify(req.body)==="{}"){
        res.end();
	}
	else{
		console.log(req.body);
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query("SELECT row_to_json(fc) "
			+ "FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features "
			+ "FROM (SELECT 'Feature' As type "
				+ ", ST_AsGeoJSON(lg.geom)::json As geometry "
				+ ", row_to_json( (select l from (select link_id, a_id, b_id, func_class, tollway,direction) as l))  As properties "
				+ "FROM tiles.render_vts_byextent($7::varchar, $5, $6, $1,$2,$3,$4) as lg) "
					+ "As f )  As fc", [req.body.xmin, req.body.ymin, req.body.xmax, req.body.ymax, req.body.cols, req.body.rows, req.body.table]) ;
		console.log(query.text);
		query.on("row", function (row, links) {
			links.addRow(row);
			console.log(query);
		});
		query.on("end", function (links) {
			res.send(links.rows[0].row_to_json);
			client.end();
			res.end();
		});
	}	
});



router.post('/updatelink', function(req, res) {
	if(JSON.stringify(req.body)==="{}"){
        res.end();
	}
	else{

		var client = new pg.Client(conString);
		client.connect();
		var query = client.query("select tolls.addtoll($1,$2, $3)", [req.body.aid, req.body.bid, req.body.toll]) ;

		query.on("end", function (result) {
			console.log(result.rows[0]['addtoll']);
			res.send(result);
			client.end();
			res.end();
		});
	}	
});


module.exports = router;




















