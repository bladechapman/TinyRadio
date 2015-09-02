var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('tinyradio');

function Node(name) {
    this.name = name;
    this.neighbors = {};    // favor weights of neighboring sounds
}

// takes a list of song names to generate graph
function Selector(data, meta_path, data_path) {
    var curSelector = this;
    // var nodes = {};
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
    this.getNodes = function() {
        // use DB query to return nodes
        return nodes;
    }
    this.findNode = function (name) {
        // DB query
        return nodes[name];
    }
    this.addNode = function(name) {
        // DB query - change to adding edges
        // var newNode = new Node(name);
        // for (var node_name in nodes) {
        //     if (path_meta_data && path_meta_data[name] && path_meta_data[name].neighbors && path_meta_data[name].neighbors[node_name]) {
        //         newNode.neighbors[node_name] = path_meta_data[name].neighbors[node_name];
        //     } else {
        //         newNode.neighbors[node_name] = initial_ranking;
        //     }

        //     if (path_meta_data && path_meta_data[node_name] && path_meta_data[node_name].neighbors && path_meta_data[node_name].neighbors[name]) {
        //         nodes[node_name].neighbors[newNode.name] = path_meta_data[node_name].neighbors[name];
        //     } else {
        //         nodes[node_name].neighbors[newNode.name] = initial_ranking;
        //     }
        // }
        // nodes[newNode.name] = newNode;
    }
    this.removeNode = function(name) {
        // DB query
        delete nodes[name];
        for (var node in nodes) {
            delete nodes[node].neighbors[name];
        }
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
    this.saveMetadata = function() {
        meta_data[fs.realpathSync(data_path)] = nodes;
        fs.writeFileSync(meta_path + 'sound_meta.json', JSON.stringify(meta_data));
    }

    // open a connection to the DB
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS paths( \
                path_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, \
                path TEXT NOT NULL \
            )");
        db.run("CREATE TABLE IF NOT EXISTS nodes( \
                node_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, \
                full_path TEXT NOT NULL, \
                FOREIGN KEY(parent_path) REFERENCES paths(path_id) \
            )");
        db.run("CREATE TABLE IF NOT EXISTS edges( \
                edge_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, \
                FOREIGN KEY(start) REFERENCES nodes(node_id), \
                FOREIGN KEY(end) REFERENCES nodes(node_id), \
                weight INTEGER NOT NULL \
            )");
    });
    db.initializeGraph();

    // try {
    //     meta_data = JSON.parse(fs.readFileSync(meta_path + 'sound_meta.json', {encoding: 'utf8'}));
    //     path_meta_data = meta_data[fs.realpathSync(data_path)];
    //     curSelector.initializeGraph();
    // }
    // catch (err) {
    //     console.log('Valid sound metadata not found, generating new...');
    //     curSelector.initializeGraph();
    //     console.log('[SUCCESS] ' + meta_path + 'sound_meta.json will be created upon server restart. Internal states currently being used.');
    // }
}

module.exports = Selector;
