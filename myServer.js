const application_root=__dirname,
    express = require("express"),
    path = require("path"),
    bodyparser=require("body-parser");

const ctrl = require('./controllers');

var app = express();
app.use(express.static(path.join(application_root,"public")));
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());

//Cross-domain headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/',ctrl.sendStatic);

app.get('/streams',ctrl.sendDatasets);

//app.get('/dataset/:name',ctrl.sendLastPosts);

app.get('/stream/:name/polarity',ctrl.sendPolarity);

app.get('/stream/:name/words',ctrl.sendHistograma);

app.get('/stream/:name/geo',ctrl.sendGeolocalizacion);

//app.get('/stream/:name',ctrl.sendReturnTweetsIds);

app.post('/stream',ctrl.newStream);

app.get('/stream/graph', ctrl.getGraphs);

app.get('/stream/graphII', ctrl.getGraphsII);

app.listen(3030, function () {
  console.log("the server is running!");
  });

ctrl.warmup.once("warmup", _ => {
   console.log("Web server running on port 8080");
   app.listen(8080);
});

