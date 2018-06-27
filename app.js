//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    url = require('url');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = 3000 //process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = 'localhost' // process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    sqlURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    sqlURLLabel = "";

if (sqlURL == null && process.env.DATABASE_SERVICE_NAME) {
  var sqlServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      sqlHost = process.env[sqlServiceName + '_SERVICE_HOST'],
      sqlPort = process.env[sqlServiceName + '_SERVICE_PORT'],
      sqlDatabase = process.env[sqlServiceName + '_DATABASE'],
      sqlPassword = process.env[sqlServiceName + '_PASSWORD']
      sqlUser = process.env[sqlServiceName + '_USER'];

  if (sqlHost && sqlPort && sqlDatabase) {
    sqlURLLabel = sqlURL = 'mysql://';
    if (sqlUser && sqlPassword) {
      sqlURL += sqlUser + ':' + sqlPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    sqlURLLabel += sqlHost + ':' + sqlPort + '/' + sqlDatabase;
    sqlURL += sqlHost + ':' +  sqlPort + '/' + sqlDatabase;

  }
}
var con = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (sqlURL == null) return;

  var mysql = require('mysql');
  if (mysql == null) return;

  var con = mysql.createConnection({host: sqlHost, user: sqlUser, password: sqlPassword, database: sqlDatabase});
  
  con.connect(function(err) {
    if (err) {
      callback(err);
      return;
    }
    console.log("Connected to MySQL-Database!");
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = sqlURLLabel;
    dbDetails.type = 'mysql';

    console.log('Connected to mysql at: %s', sqlURL);
  });
};

//Creates a new Link to ARIS Connect based on the Parameters from the old URL (Processworld)
//If no new Link could be created it leads to an default Model in ARIS Connect
function createConnectURL(defaultURL, tempHost, urlValues){
    var temparr = urlValues.split("/");
    //Does the String start with "bicpublish" ?
    if(temparr.length < 4 || temparr[1] != "bicpublish"){
        console.log("Semes to be the wrond URL. Connecting to the default Site..");
        return defaultURL;
    }
    //Does String contain any kind of gid or guid?
    if(urlValues.indexOf("selectedmodelguid=") == -1 && urlValues.indexOf("gid=") == -1){
        console.log("Couldn't find matching URL for ARIS Connect. Connecting to the default Site..");
        return defaultURL;
    }

    //Start checking String for dbname and guid/gid
    var ishealthineers = false;
    var gidString;
    var guidString;
    for(var i = 0; i < temparr.length; i++){
        console.log('String Num: %i, Value: %s', i, temparr[i]);
    }
    temparr = temparr[4].split("?");
    for(var i = 0; i < temparr.length; i++){
        console.log('String Num: %i, Value: %s', i, temparr[i]);
    }
    var oldDBname = temparr[0];
    //TODO: Select corresponding ConnectDBName
    var arisDBname = oldDBname;
    temparr = temparr[1].split("&");
    for(var i = 0; i < temparr.length; i++){
        console.log('String Num: %i, Value: %s', i, temparr[i]);
        var temparr2 = temparr[i].split("=");
        for(var j = 0; j < temparr2.length; j++){
            if(temparr2[j] == "gid") {
                gidString = temparr2[j+1];
                //TODO: Select corresponding GUID
                guidString = gidString;
            }
            if(temparr2[j] == "selectedmodelguid"){
                guidString = temparr2[j+1];
            }
        }
    }
    if(!guidString && !gidString && arisDBname != ""){
        console.log("Couldn't find the right GUID from your Link. Connecting to the default Site..");
        return defaultURL;
    }
    
    if(ishealthineers){
        var newURLValues = "/#healthineers/item/c." + arisDBname + "." + guidString;
    } else {
        var newURLValues = "/#default/item/c." + arisDBname + "." + guidString;
    }
    return tempHost + newURLValues;
}

app.get('/*', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
/*if (!con) {
    initDb(function(err){});
  }
  if (con) {    */

    var defaultURL = 'https://siemens.ariscloud.com';
    var baseHost = 'https://siemens.ariscloud.com';
    console.log('baseHost: %s', baseHost);
    var pathString = req.originalUrl //url.parse(req.url).pathname;
    console.log('pathString: %s', pathString);
    var newUrl = createConnectURL(defaultURL, baseHost, pathString.toLowerCase());
    
    res.send(newUrl); //TODO: Remove and send redirect
    //res.redirect(302, newUrl);
  //}
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened! - Please contact your BPMS Administrator');
});

initDb(function(err){
  console.log('Error connecting to SQL Database - Please contact your BPMS Administrator. Message:\n'+err);
});



app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
