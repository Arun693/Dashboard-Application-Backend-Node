print("ip,name,DC/DR,Live/UAT");
db.serverinfos.find().forEach(function(server){
db.applicationtypes.find({channelID: 1, application: ObjectId(server.application) }).forEach(function(data){
 if(server && server.serverArray && server.serverArray.length > 0) {
	 for(var i = 0; i< server.serverArray.length; i++) {
		  if(server.serverArray[i]) {
			print(server.serverArray[i].liveIP+","+data.name+"-"+server.serverArray[i].serverName+",DC, LIVE");
			print(server.serverArray[i].drIP+","+data.name+"-"+server.serverArray[i].serverName+",DR, LIVE")
			print(server.serverArray[i].uatIP+","+data.name+"-"+server.serverArray[i].serverName+",, UAT")
		}
	 }
 }

});
});