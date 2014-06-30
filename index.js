var concat = require('concat-stream');
var hooks = require('level-hooks');
var through = require('through');

function IndexedDb(db, indexDb) {
    this.db = db;
    this.indexDb = indexDb;

    hooks(this.db);

    this.db.pre(function(op, add) {
        if(op.type !== 'put') return;

        var uid = new Date().getTime() + Math.floor(Math.random() * 2000);

        Object.keys(op.value).map(function(property) {
            add({
                key: property + '!' + op.value[property] + '!' + uid,
                value: op.key,
                prefix: this.indexDb,
                type: 'put'
            });
        }.bind(this));
    }.bind(this));
}

// IndexedDb.prototype.ensureIndexes = function(properties, cb) {
//     this.db.createReadStream()
//         .on('data', function(kv) {
//             properties.map(function(property) {
//                 this.indexDb.put();
//             });
//         }.bind(this))
//         .on('error', cb)
//         .on('close', cb.bind(null));
// }

IndexedDb.prototype.query = function(property, value, cb) {
    this.createQueryStream(property, value).pipe(concat(function(rows) {
        cb(null, rows);
    })).on('error', cb);
}

IndexedDb.prototype.createQueryStream = function(property, value) {
    // return this.indexDb.createReadStream();
    var tr = through(function(val) {
        this.db.get(val.value, function(err, obj) {
            if(err) throw err;

            tr.emit('data', obj);
        });
    }.bind(this));
    return this.indexDb.createReadStream({
        start: property + '!' + value + '!!',
        end: property + '!' + value + '!~',
        keys: true,
        values: true
    }).pipe(tr);
}

module.exports = function(db, indexDb) {
    return new IndexedDb(db, indexDb);
}
