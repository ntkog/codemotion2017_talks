const Listing = require('../lib/listing');
const tools = require('../lib/tools');
const nlp = require('../lib/nlp');
const fs = require('fs');
const TOPICS = require('../data/topics.json');

var log = require('debug')('summary')

let allTalks = Listing.allTalks();

TOPICS.map(function (topic) {
   ["women","men","mix"].map(function (gender) {
     nlp.summary(allTalks,{
       topic : topic,
       gender : gender,
       ocurrencesThreshold : 5,
       toJson : true,
       outputFolder : `${process.env["HOME"]}/Desktop/stats`
     });
   });
   nlp.summary(allTalks,{
     topic : topic,
     ocurrencesThreshold : 5,
     toJson : true,
     outputFolder : `${process.env["HOME"]}/Desktop/stats_all`
   });
});
