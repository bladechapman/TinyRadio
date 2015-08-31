var fs = require('fs');
var mongoose = require('mongoose');
var Node = require('../models/song_node');
var Path = require('../models/song_path');

mongoose.connect('mongodb://localhost:27017/tinyradio');
mongoose.connection.once('open', function() { console.log('connected to mongo instance ') });
mongoose.connection.on('error', function() { console.log('error connecting to mongo instance') });

// function Node(name) {
//     this.name = name;
//     this.neighbors = {};    // favor weights of neighboring sounds
// }

// takes a list of song names to generate graph
function Selector(data, meta_path, data_path) {
    console.log(data);
    console.log(meta_path);
    console.log(data_path);

    var curSelector = this;
    var path;
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
        console.log(path);

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
        return Node.find();
    }
    this.findNode = function (name) {
        // return nodes[name];
    }
    this.addNode = function(name) {
        var newNode = new Node({
            name: name,
            parentPath: path.path,
            neighbors: {}
        });
        path.nodes[newNode.id] = 5;
        // path.update({
        //     nodes: {
        //         $set: {
        //             name: 5
        //         }
        //     }
        // }, function(err, saved_path) {

        // });

        // newNode.save();
        path.markModified('nodes');
        path.save(function(err, path, numAffected) {
            console.log(err);
            console.log(path);
            console.log(numAffected);
            console.log('---');
        });


        // var newNode = new Node(name);
        // var neighbors = {};
        // var nodes = path.nodes;
        // for (var node in nodes) {
        //     var node_id = node.name;
        //     var node_id = node.id;

        //     if (path_meta_data && path_meta_data[name] && path_meta_data[name].neighbors && path_meta_data[name].neighbors[node_id]) {
        //         neighbors[node_id] = path_meta_data[name].neighbors[node_id];
        //     } else {
        //         neighbors[node_id] = initial_ranking;
        //     }

        //     if (path_meta_data && path_meta_data[node_id] && path_meta_data[node_id].neighbors && path_meta_data[node_id].neighbors[name]) {
        //         nodes[node_id].neighbors[name] = path_meta_data[node_id].neighbors[name];
        //     } else {
        //         nodes[node_id].neighbors[name] = initial_ranking;
        //     }
        // }
        // nodes[newNode.name] = newNode;
    }
    this.removeNode = function(name) {
        // delete nodes[name];
        // for (var node in nodes) {
        //     delete nodes[node].neighbors[name];
        // }
    }
    this.addToQueue = function(name) {
        // if (!(name in nodes)) { return -1; }
        // if ((queue.length > 0 && queue[queue.length - 1] === name) ||
        //     (name === currentSelected && queue.length === 0)) {
        //     return 0;
        // }
        // if (queue.length > 0) {
        //     var last = nodes[queue[queue.length - 1]];
        //     if (last.neighbors && last.neighbors[name]) { last.neighbors[name] += 1; }
        // }
        // queue.push(name)

        // return 1;
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
        // var file;
        // if (queue.length !== 0) {
        //     file = this.removeFromQueue();
        // }
        // else if (currentSelected === '' || currentSelected === undefined) {    // initially just pick a random node
        //     file = nodes[Object.keys(nodes)[parseInt(Math.random() * Object.keys(nodes).length)]].name;
        // }
        // else {
        //     var originNode = this.findNode(currentSelected);
        //     file = sampleWeighted(originNode.neighbors);
        // }

        // lastSelected = currentSelected;
        // currentSelected = file;

        // return file;
    }
    // this.rateSelection = function(rating) {
    //     if (lastSelected && currentSelected) {
    //         var prev = nodes[lastSelected];
    //         if (rating === 1) { prev.neighbors[currentSelected] += 1; }
    //         else if (rating === 0 && prev.neighbors[currentSelected] >= 2)  { prev.neighbors[currentSelected] -= 1; }
    //     } else {
    //         console.log('Okay! *continues to ignore you*');
    //     }
    // }
    // this.saveMetadata = function() {
    //     meta_data[fs.realpathSync(data_path)] = nodes;
    //     fs.writeFileSync(meta_path + 'sound_meta.json', JSON.stringify(meta_data));
    // }

    var path_exists_query = Path.findOne({path: fs.realpathSync(data_path)});
    path_exists_query.exec(function(err, path_obj) {
        var path_exists = (path_obj !== null);
        var save_query;
        if (path_exists) {
            console.log('path exists');
            path = path_obj;
            curSelector.initializeGraph();
        }
        else {
            console.log('path does not exist');
            var path_meta = new Path({
                path: fs.realpathSync(data_path),
                nodes: {}
            });
            path_meta.save(function(err, saved) {
                path = saved;
                curSelector.initializeGraph();
            });
        }
    });
}

module.exports = Selector;
