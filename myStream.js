const Twitter = require('twitter')
const myCreds = require('./credentials/my-credential.json');
const client = new Twitter(myCreds);
const sentiment = require('sentiment-spanish');
const dataBase = require('./myStorage.js');

class StreamManager{	
	constructor(){
 		this.dB = new dataBase.myDB('./data');
		this.streams = new Map();										 //Diccionario de streams(nombreStream, objetoStream)
		console.log("constructor de la clase StreamManager")
	}

	createStream(name, JSONLD){
		//console.log(JSONLD);
		let stream = client.stream('statuses/filter', {track:JSONLD.query});
		//console.log("Stream creado e insertado en streams");
		this.dB.createDataset(name,JSONLD);

		stream.on('data', tweet => {
  		if (tweet.lang=="es" || tweet.user.lang=="es"){
				this.streams.set(name, stream);
				console.log(this.streams.get(name));
				let data = {'id':tweet.id_str, 'texto':tweet.text, 'coord':tweet.coordinates, 'sentimiento':sentiment(tweet.text).score};
     		//console.log(tweet.id_str,tweet.coordinates,tweet.text);
     		//console.log("Sentiment score:",sentiment(tweet.text).score);
				console.log(data);
				console.log("-----------------------------------------------------------------------------");
				this.dB.insertObject(name, data);
			}
		});

		stream.on('error', err => console.log(err));
		
		this.streams.set(name, stream);
		//destruimos el stream despues de 20 segundos (solo para pruebas)
		setTimeout( _ => stream.destroy(), 20000);
		
	}

	destroyStream(name){
		this.streams.get(name).destroy(); 
		this.streams.delete(name);
		console.log("Objeto stream %s borrado", name);
	}
}

exports.StreamManager = StreamManager;
