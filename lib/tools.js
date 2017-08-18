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

function filterContainsTopic (topic = "ALL") {
   return topic === "ALL"
     ? function(talk) { return true; }
     : function(talk) {
     return [].concat.apply([],talk.tags["Programming language"]
       .map((t) => /\s+/.test(t)
                     ? t.toLowerCase().split(" ")
                     : /\//.test(t)  // "HTML/CSS"
                         ? t.toLowerCase().split("/")
                         : [t.toLowerCase()]))
       .includes(topic.toLowerCase())
   }
};

/*
cleanDescription -> Removes urls , markdown sintax
input : str : string
output : string

*/
function cleanDescription(str) {
  let cleaned = str.replace(/\*+/g, "")
      .replace(/!?\[(.*)\]\(.*\)/g, "$1")
      .replace(/[\?\¿]/g, "")
      .replace(/[\(\)]/g, "")
      .replace(/\s[a-z]\s/g, "")
      .replace(/#+/g, "")
      .replace(/\n+/g,"")
      .replace(/(https?:\/\/(\w|\.|\/|\-)+((?=\s))?)/g, "")
      .replace(/([\[\]]|\(\))/g, "");
  return cleaned;

}

module.exports = {
  prettyPrint : prettyPrint,
  saveFile : saveFile,
  filters : {
    byGender : byGender,
    byTopic : filterContainsTopic,
    cleanDescription : cleanDescription
  },
  rank : rank
}
