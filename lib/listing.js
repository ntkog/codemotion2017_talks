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

 // var IndexedTalksByTopic = allTalks()
 //    .reduce(function(acc,cur){
 //      if (!acc.hasOwnProperty(cur)) {
 //        acc[[cur.id].join("")] = cur;
 //      }
 //      return acc;
 //    }, {});


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
        by default : ["talkId","title","description","authors","tags","likes"]
output : return an array of objects whose keys are specified on projectionArr

Ex1 : allTalks()
Ex2 : allTalks(["id","title","description","totalLikes","authors","tags"])
Ex3 :
    function myOwnFilter (desc) {
      let res = desc.replace(/[aeiou]/g, "");
      return res;
    }
    var args = [,myOwnFilter];
    let list = Listing.allTalks2(...args);
*/
function determineGender (authorsArr) {
  return authorsArr.includes("Female") && authorsArr.includes("Male")
     ? "mix"
     : authorsArr.includes("Female") && !authorsArr.includes("Male")
        ? "women"
        : "men";
}


// function allTalks(projectionArr = ["talkId","title","description","authors","tags","likes","authorsGender"], filterCb) {
//   return [].concat.apply([],require('../data/agenda.json').days
//     .map((day) => [].concat.apply([],day.tracks.map((t) => t.slots))))
//     .filter((slot) => slot.hasOwnProperty("contents") ? slot.contents.type === "TALK" : false)
//     .map((slot) => slot.contents)
//     .map(function pick(talk) {
//       var res = {};
//       for(let field of projectionArr) {
//         switch(field) {
//           case "talkId" :
//                 res["talkId"] = [talk["id"]].join("");
//                 break;
//           case "description" :
//                 res["description"] = filterCb === undefined ? cleanDescription(talk.description) : filterCb(talk.description);
//                 break;
//           case "authors" :
//                 res["authors"] = talk.authors.map((el) =>  IndexedAuthors[[el.id].join("")]);
//                 break;
//           case "tags" :
//                 res["tags"] = talk.tags["Programming language"];
//                 break;
//           case "likes" :
//                 res["likes"] = talk.totalLikes;
//                 break;
//           case "authorsGender" :
//                 res["authorsGender"] = determineGender(talk.authors.map((el) =>  IndexedAuthors[[el.id].join("")]).map((a) => a.gender));
//                 break;
//           default:
//                res[field] = talk[field];
//         }
//       }
//       return res;
//     });
// }

const allTalksDefaults = {
  projectionArr : ["talkId","title","description","authors","tags","likes","authorsGender"],
  topic : "ALL",
  filterCb : undefined
}

function allTalks(params = {}) {
  var conf = Object.assign(allTalksDefaults, params);
  return [].concat.apply([],require('../data/agenda.json').days
    .map((day) => [].concat.apply([],day.tracks.map((t) => t.slots))))
    .filter((slot) => slot.hasOwnProperty("contents") ? slot.contents.type === "TALK" : false)
    .map((slot) => slot.contents)
    .filter(filterContainsTopic(conf.topic))
    .map(function pick(talk) {
      var res = {};

      for(let field of conf.projectionArr) {
        switch(field) {
          case "talkId" :
                res["talkId"] = [talk["id"]].join("");
                break;
          case "description" :
                res["description"] = conf.filterCb === undefined ? cleanDescription(talk.description) : filterCb(talk.description);
                break;
          case "authors" :
                res["authors"] = talk.authors.map((el) =>  IndexedAuthors[[el.id].join("")]);
                break;
          case "tags" :
                res["tags"] = talk.tags["Programming language"];
                break;
          case "likes" :
                res["likes"] = talk.totalLikes;
                break;
          case "authorsGender" :
                res["authorsGender"] = determineGender(talk.authors.map((el) =>  IndexedAuthors[[el.id].join("")]).map((a) => a.gender));
                break;
          default:
               res[field] = talk[field];
        }
      }
      return res;
    });
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

/*

*/
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

module.exports = {
  allTalks : allTalks,
  byAuthors : authorsBy,
  byTopic : function (projArr,topicPar,filter) {
    return allTalks(projArr,filter).filter(filterContainsTopic(topicPar));
  },
  defaults : allTalksDefaults
};
