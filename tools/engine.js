var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('tinyradio');

// takes a list of song names to generate graph
function Selector(data, meta_path, data_path) {
    var curSelector = this;
    var queue = [];     // NOTE: implementation is lazy - poor performance for large sets
    var lastSelected;
    var currentSelected;
    var meta_data = {};
    var path_meta_data = {};
    var initial_ranking = 5;
    meta_path = meta_path || './';

    function sampleWeighted(weights) {
        list = [];
        accumulation = 0;
        weights.forEach(function(edge) {
            accumulation += edge['weight'];
            list.push({
                'target_node_id': edge['end_node'],
                'accumulation': accumulation
            })
        })

        var rand = parseInt(Math.random() * accumulation) + 1;
        for (var i = 0; i < list.length; i++) {
            if (rand <= list[i].accumulation) { return list[i].target_node_id}
        }
    }
    this.initializeGraph = function() {
        if (data) {
            for (var i = 0; i < data.length; i++) {
                curSelector.addNode(data[i]);
            }
        }
    }
    this.getCurrentFile = function() {
        return (currentSelected) ? currentSelected : null;
    }
    this.getLastFile = function() {
        return (lastSelected) ? lastSelected : null;
    }
    this.getNodes = function getNodes(callback) {
        // use DB query to return nodes
        db.all("SELECT full_path FROM nodes WHERE parent_path = $parent_path", {
            $parent_path: data_path
        }, function(err, rows) {
            if (err) {
                callback("Error retrieving nodes", null);
            } else {
                paths = rows.map(function(value) {
                    return value['full_path'];
                });
                callback(null, paths);
            }
        });
    }
    this.findNode = function findNode(name, callback) {
        db.get("SELECT * FROM nodes WHERE full_path = $full_path AND parent_path = $parent_path", {
            $full_path: name,
            $parent_path: data_path
        }, function(err, row) {
            if (err) {callback(err, null);}
            else {callback(null, row);}
        });
    }
    this.addNode = function(name) {
        var lastId;
        db.run("INSERT INTO nodes SELECT NULL, $full_path, $parent_path \
            WHERE NOT EXISTS \
            (SELECT 1 FROM nodes WHERE full_path = $full_path AND parent_path = $parent_path)", {
            $full_path: name,
            $parent_path: data_path
        }, function(err) {
            if(err || !this.lastID) {return;}
            var added_node_id = this.lastID
            if (!err && added_node_id !== undefined) {
                db.all("SELECT node_id FROM nodes WHERE parent_path = $parent_path AND node_id != $added_id", {
                    $parent_path: data_path,
                    $added_id: added_node_id
                }, function(err, rows) {
                    if (err) {return;}
                    rows.forEach(function(existing_node) {
                        db.run("INSERT INTO edges SELECT NULL, $start, $end, $weight \
                            WHERE NOT EXISTS \
                            (SELECT 1 FROM edges WHERE start_node = $start AND end_node = $end)", {
                                $start: added_node_id,
                                $end: existing_node.node_id,
                                $weight: 5
                            });
                        db.run("INSERT INTO edges SELECT NULL, $start, $end, $weight \
                            WHERE NOT EXISTS \
                            (SELECT 1 FROM edges WHERE start_node = $start AND end_node = $end)", {
                                $start: existing_node.node_id,
                                $end: added_node_id,
                                $weight: 5
                            });
                    });
                });
            }
        });
    }
    this.removeNode = function(name) {
        // DB query
        db.run("DELETE FROM nodes WHERE full_path = $full_path AND parent_path = $parent_path", {
            $full_path: name,
            $parent_path: data_path
        }, function(err) {
            console.log('REMOVE NODE');
            if (err) {return;}
            if (this.changes !== 1) {return;}

            var removed_node_id = this.lastID;
            console.log('lastID: ' + removed_node_id);
            console.log('changes: ' + this.changes);

            db.run("DELETE FROM edges WHERE start_node = $node_id", {
                $node_id: removed_node_id
            });
            db.run("DELETE FROM edges WHERE end_node = $node_id", {
                $node_id: removed_node_id
            });
        });
    }
    this.addToQueue = function(name, callback) {
        this.findNode(name, function(err, row) {
            if (err) {callback(err, -1);}
            else if (!row || err) {callback(null, -1);}
            else if ((queue.length > 0 && queue[queue.length - 1] === name) ||
                (name === currentSelected && queue.length === 0)) {
                callback(null, 0);
            }
            else {
                if (queue.length > 0) {
                    db.run("UPDATE edges SET weight = weight + 1 WHERE start_node = (SELECT node_id FROM nodes WHERE full_path = $start_node_full_path) AND end_node = $end_node_id", {
                        $start_node_full_path: queue[queue.length - 1],
                        $end_node_id: row['node_id']
                    });
                }
                queue.push(row['full_path']);
                callback(null, 1);
            }
        });
    }
    this.removeFromQueue = function() {
        var ret = queue.shift();
        return ret;
    }
    this.peekInQueue = function() {
        return queue[0];
    }
    this.getQueue = function() {
        return queue;
    }
    this.selectNext = function(callback) {
        var file;
        if (queue.length !== 0) {
            console.log('PICK FROM QUEUE')
            file = this.removeFromQueue();
            select_finally(null, file);
        }
        else if (currentSelected === '' || currentSelected === undefined) {    // initially just pick a random node
            console.log('PICK RANDOM')
            db.get("SELECT * FROM nodes WHERE parent_path = $parent_path ORDER BY RANDOM() LIMIT 1", {
                $parent_path: data_path
            }, function(err, row) {
                select_finally(err, row['full_path']);
            });
        }
        else {
            console.log('PICK WEIGHTED');
            db.all("SELECT * from edges, nodes WHERE edges.start_node = (SELECT node_id FROM nodes WHERE full_path = $start_node_full_path) AND nodes.node_id = edges.end_node", {
                $start_node_full_path: currentSelected
            }, function(err, rows) {
                target_node_id = sampleWeighted(rows);
                db.get("SELECT * FROM nodes WHERE node_id = $target_node_id", {
                    $target_node_id: target_node_id
                }, function(err, row) {
                    select_finally(err, row['full_path']);
                });
            });
        }

        function select_finally(err, file) {
            lastSelected = currentSelected;
            currentSelected = file;
            callback(err, file);
        }
    }
    // this.rateSelection = function(rating) {
    //     if (lastSelected && currentSelected) {
    //         db.run("UPDATE edges SET weight = weight + 1 \
    //             WHERE start_node = $start_node AND end_node = $end_node", {
    //                 $start_node: lastSelected,
    //                 $end_node: currentSelected
    //             })
    //     } else {
    //         console.log('Okay! *continues to ignore you*');
    //     }
    // }

    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS nodes ( \
            node_id INTEGER PRIMARY KEY ASC, \
            full_path TEXT NOT NULL, \
            parent_path TEXT NOT NULL \
        )");
        db.run("CREATE TABLE IF NOT EXISTS edges( \
            edge_id INTEGER PRIMARY KEY ASC, \
            start_node INTEGER NOT NULL, \
            end_node INTEGER NOT NULL, \
            weight INTEGER NOT NULL, \
            FOREIGN KEY(start_node) REFERENCES nodes(node_id), \
            FOREIGN KEY(end_node) REFERENCES nodes(node_id) \
        )");
    });
    curSelector.initializeGraph();
}

module.exports = Selector;