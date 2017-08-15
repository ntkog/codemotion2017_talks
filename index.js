const util = require('util');
const jsonfile = require('jsonfile');

const RESULTS_FILENAME = 'results.json';
// Módulo que abstrae la lógica de consolidación de los datos
const Listing = require('./lib/listing');

// list -> Todas las charlas con los campos indicados en el array que se pasa como parámetro a allTalks
let list = Listing.allTalks(["id","title","description","totalLikes","authors","tags"]);

/*

If you prefer your custom Description filter for transforming it, here it is an example
let listOwnDescFilter = Listing.allTalks(["title","description","authors","tags"], function(desc) {
  let res = desc.replace(/[aeiou]/g, "");
  return res;
});

console.log(util.inspect(listOwnDescFilter, { showHidden: true, depth: null, colors: true }));

*/


// Talks summary by Gender
var summary = list.reduce(function(acc,cur) {
  let currentAuthors = cur.authors.map((a) => a.gender);
  currentAuthors.includes("Female") && !currentAuthors.includes("Male") && (acc.womenTalks++);
  currentAuthors.includes("Male") && !currentAuthors.includes("Female") && (acc.menTalks++)
  currentAuthors.includes("Male") && currentAuthors.includes("Female") && (acc.mix++);
  return acc;
},{ womenTalks : 0, menTalks: 0, mix : 0});

// Women Talks info
let womenTalks = list.filter(function(talk){
   let currentAuthors = talk.authors.map((a) => a.gender);
   return currentAuthors.includes("Female") && !currentAuthors.includes("Male");
});

// Men Talks info
let menTalks = list.filter(function(talk){
   let currentAuthors = talk.authors.map((a) => a.gender);
   return currentAuthors.includes("Male") && !currentAuthors.includes("Female");
});

// Mix Talks info
let mixTalks = list.filter(function(talk){
   let currentAuthors = talk.authors.map((a) => a.gender);
   return currentAuthors.includes("Female") && currentAuthors.includes("Male");
});


jsonfile.writeFile(RESULTS_FILENAME, {
  summary : summary,
  talks : {
    women : womenTalks,
    men : menTalks,
    mix : mixTalks
  }
}, {spaces: 2}, function(err) {
  if(err){
    console.error(err)
  } else {
    console.log(`Results save in [${RESULTS_FILENAME}]`);
  }

})
