var IndexedAuthors = require('../data/authors.json')
   .reduce(function(acc,cur){
     if (!acc.hasOwnProperty(cur)) {
       acc[[cur.id].join("")] = cur;
     }
     return acc;
   }, {});


function authorsBy(config,fieldNames) {
  return require('../data/authors.json')
      .filter((obj) => obj[config.fieldName] === config.fieldValue)
      .map(function pick(obj) {
        var res = {};
        for(let field of fieldNames) {
          res[field] = field === "id" ? [obj[field]].join("") : obj[field];
        }
        return res;
      });
}


function determineGender (authorsArr) {
  return authorsArr.includes("Female") && authorsArr.includes("Male")
     ? "mix"
     : authorsArr.includes("Female") && !authorsArr.includes("Male")
        ? "women"
        : "men";
}


const allTalksDefaults = {
  fieldNames : ["talkId","title","description","authors","tags","likes","authorsGender"],
  topic : "ALL",
  descFilterCb : undefined
}

/*
allTalks -> return an augmented list of all Talks from agenda.json including authors info
input : fieldNames : list of strings. Each string must match with fieldNames
        by default : ["talkId","title","description","authors","tags","likes"]
output : return an array of objects whose keys are specified on fieldNames

Ex1 : allTalks()
Ex2 : allTalks({ fieldNames : [title","description"], topic : "Javascript" })
Ex3 :
    function myOwnFilter (desc) {
      let res = desc.replace(/[aeiou]/g, "");
      return res;
    }
  let list = Listing.allTalks2({
    topic : "Javascript",
    descFilterCb : [myOwnFilter,removeStopWords]
  });
*/

function allTalks(params = {}) {
  var conf = Object.assign(allTalksDefaults, params);
  if (conf.descFilterCb) {
    conf.descFilterCb = typeof(conf.descFilterCb) === "function"
        ? conf.descFilterCb
        : typeof(conf.descFilterCb.join) === "function"
            ? compose(cleanDescription, ...conf.descFilterCb)
            : undefined;
  }
  return [].concat.apply([],require('../data/agenda.json').days
    .map((day) => [].concat.apply([],day.tracks.map((t) => t.slots))))
    .filter((slot) => slot.hasOwnProperty("contents") ? slot.contents.type === "TALK" : false)
    .map((slot) => slot.contents)
    .filter(filterContainsTopic(conf.topic))
    .map(function pick(talk) {
      var res = {};

      for(let field of conf.fieldNames) {
        switch(field) {
          case "talkId" :
                res["talkId"] = [talk["id"]].join("");
                break;
          case "description" :
                res["description"] = conf.descFilterCb === undefined ? cleanDescription(talk.description) : conf.descFilterCb(talk.description);
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

function compose(fn1,...fns) {
    if (fns.length == 0) {
        return fn1;
    }

    return function composed(...args){
        return fn1(
            compose( ...fns )( ...args )
        );
    };
}

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
