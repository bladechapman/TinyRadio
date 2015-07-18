$(function() {
    var w = 1000,
        h = 500,
        c = 15;

    var nodes = [],
        links = [];

    // var test_data = {"back_c_major(classical).mp3":{"name":"back_c_major(classical).mp3","neighbors":{"gold_dust(electronic).mp3":5,"grans_vals(classical).mp3":5,"love(pop).mp3":5,"moonlight(classical).mp3":5,"pegboards(electronic).mp3":5,"post man(pop).mp3":5,"scientist(electronic).mp3":5,"september(pop).mp3":5}},"gold_dust(electronic).mp3":{"name":"gold_dust(electronic).mp3","neighbors":{"back_c_major(classical).mp3":5,"grans_vals(classical).mp3":5,"love(pop).mp3":5,"moonlight(classical).mp3":5,"pegboards(electronic).mp3":6,"post man(pop).mp3":5,"scientist(electronic).mp3":5,"september(pop).mp3":4}},"grans_vals(classical).mp3":{"name":"grans_vals(classical).mp3","neighbors":{"back_c_major(classical).mp3":5,"gold_dust(electronic).mp3":5,"love(pop).mp3":5,"moonlight(classical).mp3":5,"pegboards(electronic).mp3":5,"post man(pop).mp3":5,"scientist(electronic).mp3":5,"september(pop).mp3":5}},"love(pop).mp3":{"name":"love(pop).mp3","neighbors":{"back_c_major(classical).mp3":5,"gold_dust(electronic).mp3":5,"grans_vals(classical).mp3":5,"moonlight(classical).mp3":4,"pegboards(electronic).mp3":5,"post man(pop).mp3":5,"scientist(electronic).mp3":5,"september(pop).mp3":5}},"moonlight(classical).mp3":{"name":"moonlight(classical).mp3","neighbors":{"back_c_major(classical).mp3":5,"gold_dust(electronic).mp3":4,"grans_vals(classical).mp3":5,"love(pop).mp3":5,"pegboards(electronic).mp3":5,"post man(pop).mp3":5,"scientist(electronic).mp3":5,"september(pop).mp3":5}},"pegboards(electronic).mp3":{"name":"pegboards(electronic).mp3","neighbors":{"back_c_major(classical).mp3":5,"gold_dust(electronic).mp3":6,"grans_vals(classical).mp3":5,"love(pop).mp3":5,"moonlight(classical).mp3":5,"post man(pop).mp3":5,"scientist(electronic).mp3":5,"september(pop).mp3":5}},"post man(pop).mp3":{"name":"post man(pop).mp3","neighbors":{"back_c_major(classical).mp3":5,"gold_dust(electronic).mp3":5,"grans_vals(classical).mp3":5,"love(pop).mp3":5,"moonlight(classical).mp3":5,"pegboards(electronic).mp3":5,"scientist(electronic).mp3":5,"september(pop).mp3":5}},"scientist(electronic).mp3":{"name":"scientist(electronic).mp3","neighbors":{"back_c_major(classical).mp3":5,"gold_dust(electronic).mp3":5,"grans_vals(classical).mp3":5,"love(pop).mp3":4,"moonlight(classical).mp3":5,"pegboards(electronic).mp3":5,"post man(pop).mp3":5,"september(pop).mp3":5}},"september(pop).mp3":{"name":"september(pop).mp3","neighbors":{"back_c_major(classical).mp3":5,"gold_dust(electronic).mp3":5,"grans_vals(classical).mp3":5,"love(pop).mp3":5,"moonlight(classical).mp3":5,"pegboards(electronic).mp3":5,"post man(pop).mp3":5,"scientist(electronic).mp3":3}}};
    // var data = {};

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
        link = canvas.selectAll('line');
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
        link.remove();
        link = canvas.selectAll('line')
                .data(links)
                .enter().append('line')
                .attr('stroke', palette.gray);
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

        // TODO: remove this
        // link
        //     .attr('x1', function(d) {return d.source.x; })
        //     .attr('y1', function(d) {return d.source.y; })
        //     .attr('x2', function(d) {return d.target.x; })
        //     .attr('y2', function(d) {return d.target.y; })
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
});
