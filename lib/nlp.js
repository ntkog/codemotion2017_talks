let stopwords_spa = require('../data/stopwords_es.json');
let stopwords_eng = require('../data/stopwords_en.json');
const tm = require('text-miner');
// Detecting Language
const franc = require('franc');
const tools = require('./tools');
const fs = require('fs');
var log = require('debug')('summary');


const DEFAULT_CONF = {
 fieldNames : ["title", "description","authorsGender", "authors"],
 topic : "Javascript",
 ocurrencesThreshold : 5,
 rank : 10,
 toJson : false
};

var words2filter = {
  spa : ["re","qué"],
  eng : []
};

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

// Main Function SUMMARY

function summary(arr, params = {}) {

  let conf = Object.assign({},DEFAULT_CONF,params);
  log("%o", params);
  log("%o" , conf);
  let NUMBER_OF_OCCURRENCES_IN_CORPUS = conf.ocurrencesThreshold;  // Indicates n or more ocurrences
  // Clone arr, to avoid side-effects
  let Talks = arr.slice();
  let totalTalks = Talks.length;
  Talks =  conf.hasOwnProperty("gender")
     ? arr.filter(tools.filters.byGender(conf.gender))
     : arr;

  let [corpus_spa, corpus_eng] = createCorpusesfromArr(Talks.map((t) => t.description));

  let [terms_spa, terms_eng] = [tm.Terms(corpus_spa),tm.Terms(corpus_eng)];
  // log("%o", terms_spa.vocabulary);
  // log("%o", terms_eng.vocabulary);
  let rankSpa = tools.rank(terms_spa.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS),conf.rank);
  let rankEng = tools.rank(terms_eng.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS),conf.rank)

  if (conf.toJson) {

    const FOLDER = conf.outputFolder || "./results";
    let RESULTS_FILENAME = [`${FOLDER}/stats`, conf.topic , (conf.hasOwnProperty("gender") ? conf.gender : "ALL"), ".json"].join("_");
    let resultObj = {
       meta : {
         talks : conf.hasOwnProperty("gender") ? `(${Talks.length} / ${totalTalks})`: totalTalks,
         authorsGender : conf.hasOwnProperty("gender") ? conf.gender : "ALL",
         repeatWordThreshold : NUMBER_OF_OCCURRENCES_IN_CORPUS,
         topic : conf.topic,
       },
       termsRank : {
         spanish : rankSpa,
         english : rankEng
       },
       data : Talks
    };

    if (fs.existsSync(FOLDER)) {
      tools.saveFile(RESULTS_FILENAME,resultObj);
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
   tools.prettyPrint(rankSpa);
   console.log(["-".repeat(20), ` ENGLISH TERMS (n >= ${NUMBER_OF_OCCURRENCES_IN_CORPUS}) `, "-".repeat(20)].join(""));
   tools.prettyPrint(rankEng);
   console.log("*".repeat(80));
  }
}


module.exports = {
  createCorpusesfromArr : createCorpusesfromArr,
  summary : summary
}
