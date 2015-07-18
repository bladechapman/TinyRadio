$(function() {
    var w = 1000,
        h = 500,
        c = 15;

    var nodes = [],
        links = [];

    var palette = {
        "lightgray": "#819090",
        "gray": "#708284",
        "mediumgray": "#536870",
        "darkgray": "#475B62",

        "darkblue": "#0A2933",
        "darkerblue": "#042029",

        "paleryellow": "#FCF4DC",
        "paleyellow": "#EAE3CB",
        "yellow": "#A57706",
        "orange": "#BD3613",
        "red": "#D11C24",
        "pink": "#C61C6F",
        "purple": "#595AB7",
        "blue": "#2176C7",
        "green": "#259286",
        "yellowgreen": "#738A05"
    };

    var force = d3.layout.force()
        .charge(-.0000001)
        .gravity(0.2)
        .linkDistance(function(datum) {
            return parseInt(700/datum.weight);
        })
        .size([w, h])
        .on("tick", tick);

    var chart_window = d3.select('#chart')
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('class', 'chart');

    var canvas = chart_window.append('g')
        .attr('id', 'canvas');

    initialize();
    function initialize() {
        updateData(function(err, data) {
            if (err) { console.log (err); return; }
            reset();
            build_nodes(data);

            update();
        });
    }
    function reset() {
        nodes = [];
        links = [];
        node = canvas.selectAll('circle');
    }
    function build_nodes(data) {
        for (var node_name in data) {
            var new_node = { name: node_name };
            nodes.push(new_node);
            data[node_name].node = new_node;
        }
        for (var i = 0; i < nodes.length; i++) {
            var cur_node = nodes[i];
            var cur_node_neighbors = data[cur_node.name].neighbors;

            for (var cur_node_neighbor_name in cur_node_neighbors) {
                links.push({
                    source: cur_node,
                    target: data[cur_node_neighbor_name].node,
                    weight: cur_node_neighbors[cur_node_neighbor_name]
                });
            }
        }
    }
    function update() {
        node.remove();
        node = canvas.selectAll('circle')
                .data(nodes)
                .enter().append('g').attr('class', 'circle_group')
                .on("mouseover", hover)
                .on("mouseout", endHover)
                .append('circle')
                .attr('r', c)
                .attr('fill', palette.blue)

        force
            .nodes(nodes)
            .links(links)
            .start();
    }
    function tick() {
        d3.selectAll('.circle_group').attr('transform', function(datum) {
            return 'translate(' + datum.x + ', ' + datum.y + ')';
        });
    }
    function hover(datum, index) {
        var g = d3.select(this);
        g.append('text')
            .attr('x', -30)
            .attr('y', 30)
            .attr('class', 'info')
            .text(datum.name);
    }
    function endHover(datum, index) {
        var g = d3.select(this);
        g.select('text').remove();
    }
    function updateData(callback) {
        var dataReq = new XMLHttpRequest();
        dataReq.open('GET', '/nodes', true);
        dataReq.responseType = 'json';

        dataReq.send();
        dataReq.onreadystatechange = function() {
            if (dataReq.readyState == 4 && dataReq.status == 200) {
                var data = dataReq.response.data;
                callback(null, data);
            }
            else if (dataReq.readyState == "complete" && dataReq.status != 200) {
                callback({
                    'message' : 'Error retrieving node data'
                }, null);
            }
        }
    }

    window.__vis__initializeGraph = initialize;
    window.__vis__updateGraph = update;
});
