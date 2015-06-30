function Node(name) {
    this.name = name;
    this.neighbors = {};    // favor weights of neighboring sounds
}

// takes a list of song names to generate graph
function Selector(data) {
    var nodes = {};

    this.rateSelection = function(rating) {
        console.log('Okay! *continues to ignore you*');

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
        if (origin === '' || origin === undefined) {
            return nodes[Object.keys(nodes)[parseInt(Math.random() * Object.keys(nodes).length)]].name;
        }

        var originNode = this.findNode(origin);
        var files = originNode.neighbors;
        var ret = Object.keys(files)[parseInt(Math.random() * Object.keys(files).length)];
        return ret;
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