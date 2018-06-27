//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    url = require('url');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
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

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!con) {
    initDb(function(err){});
  }
  if (con) {

    con.query("SELECT * FROM customers ORDER BY name", function (err, result) {
      if (err) throw err;
      console.log(result);
    });

    var baseUrl = 'siemens.ariscloud.com';
    var pathString = url.parse(req.url).pathname;
    var newUrl = baseUrl + pathString;

    res.redirect(302, newUrl);
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to SQL Database - Please contact your BPMS Administrator. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
