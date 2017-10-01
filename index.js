// <('_')>
// jshint esversion:6, node:true
"use strict";

const express = require('express');
var app = express();

const cJSON = require('circular-json');

const reddit = require('redwrap');

const bunyan = require('bunyan');
var log = bunyan.createLogger({name: "reddit-sentiments"});

const cfg = require('./config.js');


app.use(express.static('./public')); // Serve static pages

// TODO make the totalLimit in config.js do something lmao
// TODO make it behave with reddit ratelimit
// TODO maybe some fuzzy matching or matching by relevance or some such for the query
app.get('/:user/:query', (req, res) => {
	log.info({params: req.params}, "GET Request");

	var matched = []; // Comments which contain the query

	reddit.user(req.params.user)
	.comments()
	.limit(cfg.perRequestLimit, (getUserErr, redditResp, rRes) => {
		// TODO handle user not found
		if(getUserErr){
			log.error(getUserErr);
			process.exit(1); // fuck this im out
		}
		redditResp.data.children.forEach((comment)=>{
			if(comment.data.body.includes(req.params.query)){
				matched.push({
					body: comment.data.body,
					link: comment.data.link_permalink + comment.data.id + '/?context=1000'
				});
			}
		});
		var resp = {
			count: matched.length,
			comments: matched
		};
		res.send(cJSON.stringify(resp, null, 2));
	});
	// TODO get comments for req.params.user
	// TODO create list of comments that contain the req.params.query
	// TODO feed each comment into sentiment analysis (or all at once, idk how it works)
	// TODO collect results and average for each metric given
});

log.info({port: cfg.port},"Application started");
app.listen(cfg.port); // open for bidness