const db=require('./myStorage');
const _=require('underscore');
const Twitter = require('twitter');
let DB = new db.myDB('./data');
const str = require('./myStream.js');
let streams = new str.StreamManager(DB);
const request = require("request");

//mongo mLab api key: vULTUIsefF9I8v8-Iq2p7aDy-tf6UqWs
const moong=require('mongoose');
const my_conn_data="mongodb://al065910:mlabal065910@ds117590.mlab.com:17590/bdbmongo";

moong.connect(my_conn_data);

// Creamos el esquema (los esquemas suelen estar definidos en módulos aparte)
// Usamos los tipos predefinidos de Mongoose: String, Boolean, Date, etc.
var streamSchema = new moong.Schema({
	"@context": String,
	"@type": String,        
	"@id": String,
	"identifier": String,
	"agent": String,
	"query": String,
	"startTime": Date
	});
// Creamos la colección de datos (el nombre de la colección en mlab será items)
var streamModel = moong.model('Stream', streamSchema);


exports.sendStatic    = (req,res) => res.sendFile("public/index.html",{root:application_root});

exports.sendDatasets  = (req,res) => res.send({result: DB.getDatasets()}); 

exports.sendCounts    = (req,res) => res.send({error:"No operativo!"});

exports.sendLastPosts = (req,res) => {
    let n = (req.query.n == null) ? 5 : parseInt(req.query.n);
    DB.getLastObjects(req.params.name,n,data => res.send(data));
};

//Devuelve la polaridad (tweets positivos, negativos y neutrales)
exports.sendPolarity = (req, res) => {
    DB.getLastObjects(req.params.name, 100, lista => { 
        let valoresPolaridad = {"positivos":0, "negativos":0, "neutros":0};
        for (var item in lista.result){
            console.log(lista.result[item].sentimiento);
            if(lista.result[item].sentimiento instanceof String){
                lista.result[item].sentimiento = parseInt(tweet.sentimiento.split(",").slice(-1)[0]);                
            }
            if(lista.result[item].sentimiento > 0)
                valoresPolaridad.positivos = valoresPolaridad.positivos + 1;
            if(lista.result[item].sentimiento == 0)
                valoresPolaridad.neutros = valoresPolaridad.neutros + 1;
            if(lista.result[item].sentimiento < 0)
                valoresPolaridad.negativos = valoresPolaridad.negativos + 1;
        }
        res.send({result:valoresPolaridad});
    });
};

//devuelve el histograma de palabras de los últimos 50 tweets
exports.sendHistograma = (req, res) => {
    let numElem = 50;
    let palabras = [];
    let palabrasOrdenadas = {};
    let top = (req.query.top == null) ? 10 : parseInt(req.query.top);
    if(DB.getCounts()[req.params.name]<50)
        numElem = DB.getCounts()[req.params.name];
    DB.getLastObjects(req.params.name, numElem, histograma => {
        for (let tweet in histograma.result){
            palabras = palabras.concat(histograma.result[tweet].texto.split(" "));
        }
        palabrasOrdenadas= _.sortBy(_.pairs(_.countBy(palabras)), x => -x[1]).slice(0,top);
        res.send({result:palabrasOrdenadas});
    });
};

//devuelve lista de tweets geo-localizados
exports.sendGeolocalizacion = (req, res) => {
    DB.getLastObjects(req.params.name, DB.getCounts()[req.params.name], geolocalizacion => {
        let geoLocalizacion = [];
        var i = 0;
        for (let tweet of geolocalizacion["result"]){
            if(tweet.coord != "" && tweet.coord != null )
                geoLocalizacion[i] = [tweet.id, tweet.coord];  
            else
                geoLocalizacion[i] = [tweet.id,0];
            i++;
        }
        res.send({result:geoLocalizacion});
    });
};

//devuelve los id_str de los últimos n tweets del stream
exports.sendReturnTweetsIds = (req, res) => {
    let lasts = (req.query.limite == null) ? 2 : parseInt(req.query.limite);
    DB.getLastObjects(req.params.name, lasts, tweetsIds => {
        let ids=[];      
        for (let tweet of tweetsIds.result){
            ids.push(tweet.id);
        }
        res.send({result: ids});
    });
};

// Atributos que describen cada stream:
// identificador del stream (nombre)
// la consulta (track)
// creador
// fecha de creación y
// el URI del stream (método del API REST que accede a su descripción).

 function newJSONLD(name, track){
    return {
        "@context": "http://schema.org/",
        "@type":"SearchAction",        
        "@id":"http://localhost:8080/stream/"+name,
        "identifier":name,
        "agent":"AFSM",
        "query":track,
        "startTime": Date()
        };
 }

exports.getGraph = (req, res) => {
    let id = req.params.name;
    DB.getMetaData(id, track =>{
        res.send({
            "@context":"http://schema.org/",
            "@type":"SearchAction",        
            "@id":"http://localhost:8080/stream/"+name,
            "identifier":name,
            "agent":"AFSM",
            "query":track,
            "startTime": Date()
        });
    });
};

exports.getGraphs = (req, res) => {
    
    var lista = DB.getDatasets();
    var proms = lista.map(name => new Promise(
        (resolve, reject) => { 
            DB.getJSONData(name, track => {
                resolve(newJSONLD(name,track));
            });
        })
    );

    Promise.all(proms).then(values => {
        res.send({"@context":"http://schema.org/", "@graph": values});
    });
};

exports.getGraphsII = (req, res) => {
   const url = "https://api.mlab.com/api/1/databases/bdbmongo/collections/streams?apiKey=vULTUIsefF9I8v8-Iq2p7aDy-tf6UqWs";
   request.get(url, (error, response, body) =>{
        res.send({"@graph":body});     
   }); 
   
};

//Función POST
exports.newStream = (req, res) => {
    var name = req.body.name;
    var track = req.body.track;
    console.log(req.body);
    streams.createStream(name, newJSONLD(name, track));

	var item = new streamModel({
		"@context": "http://schema.org/",
		"@type": "SearchAction",        
        "@id":"http://localhost:8080/stream/"+name,
        "identifier":name,
        "agent":"AFSM",
        "query":track,
        "startTime": Date()
	});
    
    item.save(function(err){
        if (err) throw err;
        console.log("Guardado!");
        moong.connection.close(); // cerramos la conexión, si no, no termina
    
    });

};

exports.warmup = DB.events;
