function Node(name) {
    var find = '$-$';
    var re = new RegExp(find, 'g');

    name = name.replace(re, '_');

    this.name = name;
    this.neighbors = {};
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
    this.addNode = function(name) {
        var newNode = new Node(name);
        for (var i in nodes) {
            newNode.neighbors[nodes[i].name] = 0;
            nodes[i].neighbors[newNode.name] = 0;
        }
        nodes[newNode.name] = newNode;
    }
    this.selectFrom = function(origin) {
        var files = Object.keys(nodes);
        return files[parseInt(Math.random() * files.length)];

        // var originNode = this.findNode(origin);
        // var files = originNode.edges;

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