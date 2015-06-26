function Node(name) {
    var find = '$-$';
    var re = new RegExp(find, 'g');
    name = name.replace(re, '_');

    this.name = name;
    this.edges = {};
}

function Edge(node1, node2) {
    this.names = [node1.name + '$-$' + node2.name, node2.name + '$-$' + node1.name];

    var name1 = node1.name;
    var name2 = node2.name;
    this.nodes = {
        name1 : node1,
        name2 : node2
    }

    var labelName = this.names[0];
    node1.edges[labelName] = this;
    node2.edges[labelName] = this;
}

// takes a list of song names to generate graph
function Selector(data) {
    var nodes = {};
    var edges = {};

    (function construct() {
        // build initial network of songs
        if (data) {
            for (var i = 0; i < data.length; i++) {
                this.addNode(data[i]);
            }
        }
    })

    this.findNode = function(name) {
        return nodes[name];
    }
    this.findEdge = function(name) {
        var secondaryName = name.split('$-$')[1] + '$-$' + name.split('$-$')[0];
        if (edges[name]) { return edges[name];}
        if (edges[secondaryName]) { return edges[secondaryName];}
        return null;
    }

    this.addNode = function(name) {
        var newNode = new Node(name);
        for (var i in nodes) {
            var newEdge = new Edge(newNode, nodes[i]);
            edges[newEdge.names[0]] = newEdge;
        }
        nodes[newNode.name] = newNode;
    }
}

module.exports = Selector;