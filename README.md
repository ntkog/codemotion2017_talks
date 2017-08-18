# codemotion2017_talks
Playing with codemotion talks data.

# Description

This is just a consolidation of the data, an a little module to play with

# Dependencies

Just [jsonfile](https://www.npmjs.com/package/jsonfile), for saving the output of the calculations.

# How to use it

Take a look to [examples folder](https://github.com/ntkog/codemotion2017_talks/blob/master/examples/stats.js) and [nlp.js](https://github.com/ntkog/codemotion2017_talks/blob/master/nlp.js) .

You have a good start point to play with the data.

# Examples

Get all Talks without filters

```js
const Listing = require('./lib/listing');
let allTalks = Listing.allTalks();
```

Get a list of talks based on *topic* (Programming Language)

```js
const Listing = require('./lib/listing');
let jsTalks = Listing.allTalks({ topic : "javascript"});

```

Filter talks by gender speakers ("men", "women", "mix")

```js
const Listing = require('./lib/listing');
let allTalks = Listing.allTalks({ topic : "javascript"}).filter(byGender("women"));
```

Add your own filters to talks descriptions  ( for further NLP analysis)

```js
const Listing = require('./lib/listing');
let stopwords = ["from","to", "by"];
function myOwnFilter (str) {
  return cad.toLowerCase().split(/\s+/).filter((str) => !stopwords.includes(str)).join(" ");
}
let allTalks = Listing.allTalks({
  fieldNames : ["title", "description"],
  topic : "javascript",
  descFilterCb : [myOwnFilter]
}).filter(byGender("women"));
```

# TODO
Playing with NLP

Inspired in @jdonsan idea. Check his [repo](https://github.com/jdonsan/abismo-words-cloud)
