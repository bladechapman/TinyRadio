var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('tinyradio');

function async_block(limit, async_finally) {
    var internalCounter = 0;
    var internalLimit = limit;

    return function() {
        internalCounter++;
        if (internalCounter == internalLimit) {
            async_finally();
        }
    }
}

// takes a list of song names to generate graph
function Selector(data, meta_path, data_path) {
    console.log(data);

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
        for (var node in weights) {
            accumulation += weights[node]
            list.push({
                'node' : node,
                'accumulation' : accumulation
            })
        }

        var rand = parseInt(Math.random() * accumulation) + 1;
        for (var i = 1; i <= list.length; i++) {
            if (rand <= list[i].accumulation) { return list[i].node}
        }
    }
    this.initializeGraph = function() {
        // nodes = {};
        if (data) {
            for (var i = 0; i < data.length; i++) {
                curSelector.addNode(data[i]);
            }
        }
    }
    this.getCurrentFile = function() {
        return currentSelected;
    }
    this.getLastFile = function() {
        return lastSelected;
    }
    this.getNodes = function(callback) {
        // use DB query to return nodes
        db.all("SELECT * FROM nodes WHERE parent_path = $parent_path", {
            $parent_path: data_path
        }, function(err, rows) {
            if (err) {
                callback("Error retrieving nodes", null);
            } else {
                callback(null, rows);
            }
        });
    }
    this.findNode = function(name, callback) {
        // DB query
        // return nodes[name];
        db.get("SELECT FROM nodes WHERE full_path = $full_path AND parent_path = $parent_path", {
            $full_path: name,
            $parent_path: data_path
        }, function(err, row) {
            if (err) {return null;}
            else {return row;}
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
            if(err) {return;}
            var added_node_id = this.lastID
            if (!err && added_node_id !== undefined) {
                db.all("SELECT node_id FROM nodes WHERE parent_path = $parent_path", {
                    $parent_path: data_path
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
            var removed_node_id = this.lastID;
            db.run("DELETE FROM rows WHERE start_node = $node_id", {
                $node_id: removed_node_id
            });
            db.run("DELETE FROM rows WHERE end_node = $node_id", {
                $node_id: removed_node_id
            });
        });
    }
    this.addToQueue = function(name) {
        if (!(name in nodes)) { return -1; }
        if ((queue.length > 0 && queue[queue.length - 1] === name) ||
            (name === currentSelected && queue.length === 0)) {
            return 0;
        }
        if (queue.length > 0) {
            var last = nodes[queue[queue.length - 1]];
            if (last.neighbors && last.neighbors[name]) { last.neighbors[name] += 1; }
        }
        queue.push(name)

        return 1;
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
    this.selectNext = function() {
        var file;
        if (queue.length !== 0) {
            file = this.removeFromQueue();
        }
        else if (currentSelected === '' || currentSelected === undefined) {    // initially just pick a random node
            file = nodes[Object.keys(nodes)[parseInt(Math.random() * Object.keys(nodes).length)]].name;
        }
        else {
            var originNode = this.findNode(currentSelected);
            file = sampleWeighted(originNode.neighbors);
        }

        lastSelected = currentSelected;
        currentSelected = file;

        return file;
    }
    this.rateSelection = function(rating) {
        if (lastSelected && currentSelected) {
            var prev = nodes[lastSelected];
            if (rating === 1) { prev.neighbors[currentSelected] += 1; }
            else if (rating === 0 && prev.neighbors[currentSelected] >= 2)  { prev.neighbors[currentSelected] -= 1; }
        } else {
            console.log('Okay! *continues to ignore you*');
        }
    }

    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS nodes ( \
            node_id INTEGER PRIMARY KEY ASC, \
            full_path TEXT NOT NULL, \
            parent_path TEXT NOT NULL)");
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
