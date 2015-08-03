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
        for (var i = 1; i <= list.length; i++) {
            if (rand <= list[i].accumulation) { return list[i].node}
        }
    }
    this.initializeGraph = function() {
        nodes = {};
        if (data) {
            for (var i = 0; i < data.length; i++) {
                curSelector.addNode(data[i]);
            }
        }
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
    this.getNodes = function() {
        return nodes;
    }
    this.findNode = function(name) {
        return nodes[name];
    }
    this.getCurrentFile = function() {
        return currentSelected;
    }
    this.getLastFile = function() {
        return lastSelected;
    }
    this.addNode = function(name) {
        var newNode = new Node(name);
        for (var node_name in nodes) {
            if (meta_data && meta_data[name] && meta_data[name].neighbors && meta_data[name].neighbors[node_name]) {
                newNode.neighbors[node_name] = meta_data[name].neighbors[node_name];
            } else {
                newNode.neighbors[node_name] = initial_ranking;
            }

            if (meta_data && meta_data[node_name] && meta_data[node_name].neighbors && meta_data[node_name].neighbors[name]) {
                nodes[node_name].neighbors[newNode.name] = meta_data[node_name].neighbors[name];
            } else {
                nodes[node_name].neighbors[newNode.name] = initial_ranking;
            }
        }
        nodes[newNode.name] = newNode;
    }
    this.removeNode = function(name) {
        delete nodes[name];
        for (var node in nodes) {
            delete nodes[node].neighbors[name];
        }
    }
    this.selectNext = function() {
        var file;
        if (currentSelected === '' || currentSelected === undefined) {    // initially just pick a random node
            file = nodes[Object.keys(nodes)[parseInt(Math.random() * Object.keys(nodes).length)]].name;
        }
        else {
            var originNode = this.findNode(currentSelected);
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
        curSelector.initializeGraph();
    }
    catch (err) {
        console.log('Valid sound metadata not found, generating new...');
        curSelector.initializeGraph();
        console.log('[SUCCESS] ' + meta_path + 'sound_meta.json will be created upon server restart. Internal states currently being used.');
    }
}

module.exports = Selector;