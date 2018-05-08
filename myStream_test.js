const SM = require('./myStream.js');
const util = require('util');

let st = new SM.StreamManager();

st.dB.events.once("warmup", _ =>{
	  // CreateStreams
	  st.createStream('barcelona', 'Barcelona,barcelona,barna,Barna');
	  st.createStream('valencia', 'valencia,Valencia,València,valència');
	  st.createStream('castellon', 'castellon,Castellon,castellón,Castellón,castello,Castello,castelló,Castelló');


	  // DestroyStreams a los 10 Segundos
	  setTimeout(_ => st.destroyStream('barcelona'), 10000);
	  setTimeout(_ => st.destroyStream('valencia'), 10000);
	  setTimeout(_ => st.destroyStream('castellon'), 10000);

		st.dB.getLastObjects('valencia', 10, data => console.log(data));
		console.log(st.dB.getDatasets());
		console.log(util.inspect(st.dB.getCounts()));

});
