const Listing = require('../lib/listing');
const tools = require('../lib/tools');
const nlp = require('../lib/nlp');
const fs = require('fs');
const TOPICS = require('../data/topics.json');

var log = require('debug')('summary')

let allTalks = Listing.allTalks({
  descFilterCb : [tools.filters.cleanDescription]
});

/* Uncomment this if you want to play with your own descFilters

let allTalks = Listing.allTalks();
*/

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

// Any topic any gender
nlp.summary(allTalks,{
  ocurrencesThreshold : 5,
  toJson : true,
  outputFolder : `${process.env["HOME"]}/Desktop/stats_all`,
  filename : 'all_talks.json'
});

// all authors Description

let authorsDescription = Listing.allTalks({ fieldNames: ["authors","language","title"] })
   .map((t) => ({
     description: t.authors.map((author) => author.description).filter((desc) => desc),
     language : t.language,
     title: t.title
   }));

nlp.summary(authorsDescription, {
  ocurrencesThreshold : 5,
  toJson : true,
  outputFolder : `${process.env["HOME"]}/Desktop/stats_all`,
  filename : 'all_authors_description.json'
})
