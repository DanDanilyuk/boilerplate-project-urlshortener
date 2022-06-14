require('dotenv').config();
const bodyParser = require('body-parser')
const cors = require('cors');
const express = require('express');
const url = require('url');
const dns = require('dns');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mySecret = process.env['MONGO_URI'];

const app = express();
app.use(bodyParser.urlencoded({ extended: true })); 
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

// - Url Prototype -
// --------------------
// url : string [required]
const urlSchema = new Schema({
  url: {type: String, required: true},
  short_url: Number
});

const URL = mongoose.model("URL", urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:id', (req, res) => {
  URL.findOne({ short_url: req.params.id }, function(err, urlFound) {
    if (err) return console.log(err);
    return res.redirect(urlFound.url);
  });
});

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  const reqURL = req.body.url;
  const parsedLookupUrl = url.parse(reqURL);
  dns.lookup(parsedLookupUrl.hostname, (lookupErr, addresses) => {
    if(!addresses) {
      return res.send({ "error": 'invalid url' });
    } else {
      const filter = {url: reqURL }
      const update = {url: reqURL, short_url: Date.now() }
      URL.findOneAndUpdate(filter, update, { upsert: true, new: true }, (err, matchedURL) => {
        if(err) return console.log(err);
        return res.json({ original_url: matchedURL.url, short_url: matchedURL.short_url });
      });
    };
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
