const _ = require('lodash');
const util = require('util');
const jsonfile = require('jsonfile');

// saveFile wrapper
function saveFile (filename,obj) {
  jsonfile.writeFile( filename, obj, {spaces: 2}, function(err) {
    if(err){
      console.error(err)
    } else {
      console.log(`Results save in [${filename}]`);
    }
  });

}

function prettyPrint(obj) {
  console.log(util.inspect(obj, { showHidden: false, depth: null, colors: true }));
}

function rank(arr, numItems) {
  return _.take(_.sortBy(arr, ["count"]).reverse(), numItems);
}

function byGender (gender = "mix") {
  return (t) => t.authorsGender === gender
}

module.exports = {
  prettyPrint : prettyPrint,
  saveFile : saveFile,
  filters : {
    byGender : byGender
  },
  rank : rank
}
