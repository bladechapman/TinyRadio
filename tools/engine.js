function Node(name) {
    this.name = name;
    this.neighbors = {};    // favor weights of neighboring sounds
}

// takes a list of song names to generate graph
function Selector(data) {
    var nodes = {};
    var lastSelected = undefined;
    var currentSelected = undefined;

    this.rateSelection = function(rating) {
        if (lastSelected && currentSelected) {
            var prev = nodes[lastSelected];
            (rating == 1) ? (prev.neighbors[currentSelected] += 1) : (prev.neighbors[currentSelected] -= 1);
            console.log(nodes);
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
            newNode.neighbors[nodes[i].name] = 0;
            nodes[i].neighbors[newNode.name] = 0;
        }
        nodes[newNode.name] = newNode;
    }
    this.selectFrom = function(origin) {
        var file;
        if (origin === '' || origin === undefined) {    // initially just pick a random node
            file = nodes[Object.keys(nodes)[parseInt(Math.random() * Object.keys(nodes).length)]].name;
        }
        else {
            var originNode = this.findNode(origin);
            var files = originNode.neighbors;
            file = Object.keys(files)[parseInt(Math.random() * Object.keys(files).length)];     // TODO: implement better picking
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

    console.log(nodes);
}

module.exports = Selector;