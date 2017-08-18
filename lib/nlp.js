let stopwords_spa = require('../data/stopwords_es.json');
let stopwords_eng = require('../data/stopwords_en.json');
const tm = require('text-miner');
// Detecting Language
//const franc = require('franc');
const tools = require('./tools');
const fs = require('fs');
var log = require('debug')('summary');


const DEFAULT_CONF = {
 fieldNames : ["title", "description","authorsGender", "authors","language"],
 ocurrencesThreshold : 5,
 rank : 10,
 toJson : false
};

var words2filter = {
  spa : ["re","qué", "ñ"],
  eng : []
};

function createCorpusesfromArr(arr) {
  let corpus = {
    spa : new tm.Corpus([]),
    eng : new tm.Corpus([])
  }
  arr.map(function(obj) {
     if (["spa","eng"].includes(obj.language)) {
       if(typeof(obj.description.join) === "function") {
         for(let desc of obj.description) {
           corpus[obj.language].addDoc(desc);
         }
       } else {
         corpus[obj.language].addDoc(obj.description);
       }

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

function findMatches (corpus,term, word) {
  let wordIndex = term.vocabulary.indexOf(word);
  var resultList = new Set();
  for(let i = 0; i < term.data.length ; i++) {
    if (term.data[i][wordIndex] !== undefined) {
      resultList.add(corpus.documents[i].text);
    }
  }
  return Array.from(resultList);
}

function onlySingleWords (arr, str) {
  return [].concat.apply([],arr.map((cad) => cad.split(" "))).filter((cad) => cad === str).length
}

function mapTerms (corpus, terms) {
  return function(obj) {
    let hits = findMatches(corpus,terms,obj.word);
    return {
      word : obj.word,
      onlySingleWords : onlySingleWords(hits,obj.word),
      count : obj.count,
      sentences : hits.length,
    };
  }
}

// Main Function SUMMARY

function summary(arr, params = {}) {

  let conf = Object.assign({},DEFAULT_CONF,params);
  log("%o", params);
  log("%o" , conf);
  let NUMBER_OF_OCCURRENCES_IN_CORPUS = conf.ocurrencesThreshold;  // Indicates n or more ocurrences

  let Talks = conf.hasOwnProperty("topic")
           ? arr.filter(tools.filters.byTopic(conf.topic))
           : arr.slice(); // Clone arr, to avoid side-effects
  let totalTalks = Talks.length;
  Talks =  conf.hasOwnProperty("gender")
     ? Talks.filter(tools.filters.byGender(conf.gender))
     : Talks;

  let [corpus_spa, corpus_eng] = createCorpusesfromArr(Talks);

  let [terms_spa, terms_eng] = [tm.DocumentTermMatrix(corpus_spa),tm.DocumentTermMatrix(corpus_eng)];
  // log("%o", terms_spa.vocabulary);
  // log("%o", terms_eng.vocabulary);
  let rankSpa =
    tools.rank(terms_spa.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS)
      .map(mapTerms(corpus_spa,terms_spa)),"onlySingleWords",conf.rank );
  let rankEng =
    tools.rank(terms_eng.findFreqTerms(NUMBER_OF_OCCURRENCES_IN_CORPUS)
        .map(mapTerms(corpus_eng,terms_eng)),"onlySingleWords",conf.rank)

  if (conf.toJson) {

    const FOLDER = conf.outputFolder || "./results";

    let RESULTS_FILENAME = conf.filename
       ? `${FOLDER}/${conf.filename}`
       : [`${FOLDER}/stats`, conf.topic , (conf.hasOwnProperty("gender") ? conf.gender : "ALL"), ".json"].join("_");
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
       data : Talks,
       corpus_spa : corpus_spa.documents.map((doc) => doc.text),
       corpus_eng : corpus_eng.documents.map((doc) => doc.text)
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
