const util = require('util');
const jsonfile = require('jsonfile');

// Módulo que abstrae la lógica de consolidación de los datos
const Listing = require('./lib/listing');

function myOwnFilter (desc) {
  let res = desc.replace(/[aeiou]/g, "");
  return res;
}

let RESULTS_FILENAME = `nlp.json`;
let allTalks = Listing.allTalks({
   topic : "jvm",
   descFilterCb : myOwnFilter
 }).filter(byGender());
console.log(Listing.defaults);

function byGender (gender = "mix") {
  return (t) => t.authorsGender === gender
}


jsonfile.writeFile( RESULTS_FILENAME, allTalks, {spaces: 2}, function(err) {
  if(err){
    console.error(err)
  } else {
    console.log(`Results save in [${RESULTS_FILENAME}]`);
  }
});
