const util = require('util');
const jsonfile = require('jsonfile');
// Módulo que abstrae la lógica de consolidación de los datos
const Listing = require('./lib/listing');
let stopwords_es = require('./data/stopwords_es.json');
let stopwords_en = require('./data/stopwords_en.json');
var stopwords = stopwords_en.concat(stopwords_es);

// Filters

function removeStopWords (cad) {
  return cad.toLowerCase().split(/\s+/).filter((str) => !stopwords.includes(str)).join(" ");
}

function byGender (gender = "mix") {
  return (t) => t.authorsGender === gender
}

// saveFile wrapper

function saveFile (filename,obj) {
  jsonfile.writeFile( filename, obj, {spaces: 2}, function(err) {
    if(err){
      console.error(err)
    } else {
      console.log(`Results save in [${RESULTS_FILENAME}]`);
    }
  });

}

function dinamicFileName(conf) {
  return [
    PREFIX,
    conf.hasOwnProperty("topic") ? conf.topic.replace(/\s+/g,"_")  : "all",
    typeof(conf.descFilterCb) === "undefined" ? "" : "filtered" ,
    ".json"]
  .join("_");
}

// Print Defaults params of allTalks
console.log(Listing.defaults);

const PREFIX = "nlp";
/*
const TALKSCONF = {
  fieldNames : ["title","description"],
  topic : "javascript",
  descFilterCb : [removeStopWords]
}
*/

const TALKSCONF = {};


let jsTalks = Listing.allTalks(TALKSCONF);

// Save results to a JSON File
let RESULTS_FILENAME = dinamicFileName(TALKSCONF);
saveFile(RESULTS_FILENAME,jsTalks);
