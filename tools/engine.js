var fs = require('fs');

function Node(name) {
    this.name = name;
    this.neighbors = {};    // favor weights of neighboring sounds
}

// takes a list of song names to generate graph
function Selector(data, meta_path) {
    var curSelector = this;
    var nodes = {};
    var lastSelected = undefined;
    var currentSelected = undefined;
    var initial_ranking = 5;
    var meta_data = undefined;
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
        for (var i = 0; i < list.length; i++) {
            if (rand <= list[i].accumulation) { return list[i].node}
        }
    }
    function initializeGraph() {
        if (data) {
            for (var i = 0; i < data.length; i++) {
                curSelector.addNode(data[i]);
            }
        }
    }

    this.rateSelection = function(rating) {
        if (lastSelected && currentSelected) {
            var prev = nodes[lastSelected];
            if (rating == 1 && prev.neighbors[currentSelected] < 50) { prev.neighbors[currentSelected] += 1;}
            if (rating == 0 && prev.neighbors[currentSelected] >= 2)  { prev.neighbors[currentSelected] -= 1;}
        } else {
            console.log('Okay! *continues to ignore you*');
        }
    }
    this.findNode = function(name) {
        return nodes[name];
    }
    this.addNode = function(new_name) {     // maintains complete, bi-directional graph
        var newNode = new Node(new_name);
        for (var node_name in nodes) {
            if (meta_data && meta_data[new_name] && meta_data[new_name].neighbors && meta_data[new_name].neighbors[node_name]) {
                newNode.neighbors[node_name] = meta_data[new_name].neighbors[node_name];
            } else {
                newNode.neighbors[node_name] = initial_ranking;
            }

            if (meta_data && meta_data[node_name] && meta_data[node_name].neighbors && meta_data[node_name].neighbors[new_name]) {
                nodes[node_name].neighbors[newNode.name] = meta_data[node_name].neighbors[new_name];
            } else {
                nodes[node_name].neighbors[newNode.name] = initial_ranking;
            }
        }
        nodes[newNode.name] = newNode;
    }
    this.selectFrom = function(origin) {
        var file;
        if (origin === '' || origin === undefined) {    // initially just pick a random node
            file = nodes[Object.keys(nodes)[parseInt(Math.random() * Object.keys(nodes).length)]].name;
            // console.log(sampleWeighted(nodes[Object.keys(nodes)[parseInt(Math.random() * Object.keys(nodes).length)]].neighbors));
        }
        else {
            var originNode = this.findNode(origin);
            // var files = originNode.neighbors;
            // file = Object.keys(files)[parseInt(Math.random() * Object.keys(files).length)];     // TODO: implement better picking
            var file = sampleWeighted(originNode.neighbors);
        }

        lastSelected = currentSelected;
        currentSelected = file;

        return file;
    }
    this.saveMetadata = function() {
        fs.writeFileSync(meta_path + 'sound_meta.json', JSON.stringify(nodes));
    }

    try {
        meta_data = JSON.parse(fs.readFileSync(meta_path + 'sound_meta.json', {encoding: 'utf8'}));
        initializeGraph();
    }
    catch (err) {
        console.log('Valid sound metadata not found, generating new...');
        nodes = {};
        initializeGraph();
        curSelector.saveMetadata();
        console.log('[SUCCESS] ' + meta_path + 'sound_meta.json');
    }

    console.log(nodes);
}

module.exports = Selector;