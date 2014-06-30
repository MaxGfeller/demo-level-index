var test = require('tap').test;
var index = require('../index');
var levelup = require('levelup');
var sublevel = require('level-sublevel');
var db = levelup('./db', {
    valueEncoding: 'json'
});
db = sublevel(db);
var messagesDb = db.sublevel('messages');
var indexDb = db.sublevel('messages-index');

var indexedDb = index(messagesDb, indexDb);

var getRandomUser = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

var insertTestData = function(cb) {
    var users = ['max', 'dominic', 'lukas', 'gordon'];
    var batch = messagesDb.batch();
    for(var i = 0; i < 100; i++) {
        batch.put('' + new Date().getTime() + Math.floor(Math.random() * 2000), {
            user: getRandomUser(users),
            message: 'Hello World'
        });
    }
    batch.write(function(err) {
        if(err) throw err;
        cb();
    });
}

insertTestData(function() {
    test('Test creating index', function(t) {
        indexedDb.query('user', 'max', function(err, results) {
            results.map(function(result) {
                t.equals('max', result.user);
            });
            t.end();
        });
    });
});
