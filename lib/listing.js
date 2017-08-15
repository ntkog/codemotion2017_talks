let stopwords_es = require('../data/stopwords_es.json');
let stopwords_en = require('../data/stopwords_en.json');
var stopwords = stopwords_en.concat(stopwords_es);

var IndexedAuthors = require('../data/authors.json')
   .reduce(function(acc,cur){
     if (!acc.hasOwnProperty(cur)) {
       acc[[cur.id].join("")] = cur;
     }
     return acc;
   }, {});


function authorsBy(config,projectionArr) {
  return require('../data/authors.json')
      .filter((obj) => obj[config.fieldName] === config.fieldValue)
      .map(function pick(obj) {
        var res = {};
        for(let field of projectionArr) {
          res[field] = field === "id" ? [obj[field]].join("") : obj[field];
        }
        return res;
      });
}

/*
allTalks -> return an augmented list of all Talks from agenda.json including authors info
input : projectionArr : list of strings. Each string must match with fieldNames
output : return an array of objects whose keys are specified on projectionArr

Ex : allTalks(["id","title","description","totalLikes","authors","tags"])
*/
function allTalks(projectionArr, filterCb) {
  return [].concat.apply([],require('../data/agenda.json').days
    .map((day) => [].concat.apply([],day.tracks.map((t) => t.slots))))
    .filter((slot) => slot.hasOwnProperty("contents") ? slot.contents.type === "TALK" : false)
    .map((slot) => slot.contents)
    .map(function pick(obj) {
      var res = {};
      for(let field of projectionArr) {

        res[field] = field === "description" ? cleanDescription(obj[field]) :obj[field];
      }
      return res;
    })
    .map((talk) => ({
      talkId : [talk.id].join(""),
      title: talk.title,
      description : filterCb === undefined ? talk.description : filterCb(talk.description),
      authors : talk.authors.map((el) =>  IndexedAuthors[[el.id].join("")]),
      tags : talk.tags["Programming language"],
      likes : talk.totalLikes
    }));
}

/*
cleanDescription -> Removes urls , markdown sintax
input : str : string
output : string

*/
function cleanDescription(str) {
  let cleaned = str.replace(/\*+/g, "")
      .replace(/!?\[(.*)\]\(.*\)/g, "$1")
      .replace(/#+/g, "")
      .replace(/\n+/g,"")
      .replace(/(https?:\/\/(\w|\.|\/|\-)+((?=\s))?)/g, "")
      .replace(/([\[\]]|\(\))/g, "");
  return cleaned;

}

/*
removeStopWords -> remove stopwords setup in (data/stopwords_en.json, data/stopwords_es.json)
input : string
output : string

*/
function removeStopWords (cad) {
  return cad.toLowerCase().split(/\s+/).filter((str) => !stopwords.includes(str)).join(" ");
}

module.exports = {
  allTalks : allTalks,
  authorsBy : authorsBy
};
