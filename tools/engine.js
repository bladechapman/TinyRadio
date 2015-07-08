function Node(name) {
    this.name = name;
    this.neighbors = {};    // favor weights of neighboring sounds
}

// takes a list of song names to generate graph
function Selector(data) {
    var nodes = {};
    var lastSelected = undefined;
    var currentSelected = undefined;
    var initial_ranking = 5;

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
    this.addNode = function(name) {     // maintains complete, bi-directional graph
        var newNode = new Node(name);
        for (var i in nodes) {
            newNode.neighbors[nodes[i].name] = initial_ranking;
            nodes[i].neighbors[newNode.name] = initial_ranking;
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

    // build initial network of songs
    if (data) {
        for (var i = 0; i < data.length; i++) {
            this.addNode(data[i]);
        }
    }

    // console.log(nodes);
}

module.exports = Selector;