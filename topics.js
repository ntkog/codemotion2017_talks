const util = require('util');
const jsonfile = require('jsonfile');
const Listing = require('./lib/listing');
const tm = require('text-miner');
let stopwords_spa = require('./data/stopwords_es.json');
let stopwords_eng = require('./data/stopwords_en.json');
const _ = require('lodash');
const fs = require('fs');

// Detecting Language
const franc = require('franc');

var log = require('debug')('summary')


var words2filter = {
  spa : ["re","qué"],
  eng : []
};

// saveFile wrapper
function createCorpusesfromArr(arr) {
  let corpus = {
    spa : new tm.Corpus([]),
    eng : new tm.Corpus([])
  }
  arr.map(function(line) {
     let detectedLanguage = franc(line);
     if (["spa","eng"].includes(detectedLanguage)) {
       corpus[detectedLanguage].addDoc(line);
     }
  });
  return [cleanCorpus(corpus.spa, "spa"), cleanCorpus(corpus.eng, "eng")];
};

function cleanCorpus (corpus, lang) {
  let words2remove = lang === "spa"
    ? Array.from(new Set(tm.STOPWORDS.ES.concat(stopwords_spa).concat(words2filter.spa)))
    : Array.from(new Set(tm.STOPWORDS.EN.concat(stopwords_eng).concat(words2filter.eng)));

  return corpus
    .clean()
  	.trim()
  	.toLower()
    .removeInterpunctuation()
    .removeDigits()
    .removeInvalidCharacters()
  	.removeWords(words2remove);

}

function prettyPrint(obj) {
  console.log(util.inspect(obj, { showHidden: false, depth: null, colors: true }));
}

function saveFile (filename,obj) {
  jsonfile.writeFile( filename, obj, {spaces: 2}, function(err) {
    if(err){
      console.error(err)
    } else {
      console.log(`Results save in [${filename}]`);
    }
  });

}


function rank(arr, numItems) {
  return _.take(_.sortBy(arr, ["count"]).reverse(), numItems);
}

function byGender (gender = "mix") {
  return (t) => t.authorsGender === gender
}

 const DEFAULT_CONF = {
  fieldNames : ["title", "description","authorsGender", "authors"],
  topic : "Javascript",
  ocurrencesThreshold : 5,
  rank : 10,
  toJson : false
}

// Main Function SUMMARY

function summary(params = {}) {

  let conf = Object.assign({},DEFAULT_CONF,params);
  log("%o", params);
  log("%o" , conf);
  let NUMBER_OF_OCCURRENCES_IN_CORPUS = conf.ocurrencesThreshold;  // Indicates n or more ocurrences
  let Talks = Listing.allTalks(conf);
  let totalTalks = Talks.length;
  Talks =  conf.hasOwnProperty("gender")
     ? Talks.filter(byGender(conf.gender))
     : Talks;



  let [corpus_spa, corpus_eng] = createCorpusesfromArr(Talks.map((t) => t.description));

  let [terms_spa, terms_eng] = [tm.Terms(corpus_spa),tm.Terms(corpus_eng)];
  // log("%o", terms_spa.vocabulary);
  // log("%o", terms_eng.vocabulary);

  if (conf.toJson) {

    const FOLDER = "./results";
    let RESULTS_FILENAME = [`${FOLDER}/stats`, conf.topic , (conf.hasOwnProperty("gender") ? conf.gender : "ALL"), ".json"].join("_");
    let resultObj = {
       meta : {
         talks : conf.hasOwnProperty("gender") ? `(${Talks.length} / ${totalTalks})`: totalTalks,
         authorsGender : conf.hasOwnProperty("gender") ? conf.gender : "ALL",
         repeatWordThreshold : NUMBER_OF_OCCURRENCES_IN_CORPUS,
         topic : conf.topic,
       },
       termsRank : {
         spanish : rank(terms_spa.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS),conf.rank),
         english : rank(terms_eng.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS),conf.rank)
       },
       data : Talks
    };

    if (fs.existsSync(FOLDER)) {
      saveFile(RESULTS_FILENAME,resultObj);
    } else {
      console.error(`Have you already created a folder [${FOLDER}] ? `);
      console.log("Aborting...");
      process.exit(20);
    }


  } else {
   console.log("*".repeat(80));
   console.log(`Total Talks about [${conf.topic}] : [${totalTalks}]`);
   if (conf.hasOwnProperty("gender")) {
      console.log(`Talks from gender [${conf.gender}] selected : [${Talks.length}]`);
   }
   console.log(`spanish [${terms_spa.nDocs}]`);
   console.log(`english [${terms_eng.nDocs}]`);

   console.log(["-".repeat(20), ` SPANISH TERMS (n >= ${NUMBER_OF_OCCURRENCES_IN_CORPUS}) `, "-".repeat(20)].join(""));
   prettyPrint(rank(terms_spa.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS),conf.rank));
   console.log(["-".repeat(20), ` ENGLISH TERMS (n >= ${NUMBER_OF_OCCURRENCES_IN_CORPUS}) `, "-".repeat(20)].join(""));
   prettyPrint(rank(terms_eng.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS),conf.rank));
   console.log("*".repeat(80));
  }
}


// Iterate thru Topics

["javascript","html","python","java","other"].map(function (topic) {
   ["women", "men","mix"].map(function (gender) {
     summary({
       topic : topic,
       gender : gender,
       ocurrencesThreshold : 5,
       toJson : true
     });
   });
   summary({
     topic : topic,
     ocurrencesThreshold : 5,
     toJson : true
   });
})
