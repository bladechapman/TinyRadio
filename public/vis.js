$(function() {
    var w = 1000,
        h = 500,
        c = 15;

    var nodes = [],
        links = [];

    var cached_data = {};

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
            flatten_data(data);
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
            if (cached_data[node_name] && cached_data[node_name].node) {
                new_node['x'] = cached_data[node_name].node.x;
                new_node['y'] = cached_data[node_name].node.y;
            }
            nodes.push(new_node);
            data[node_name].node = new_node;
        }
        cached_data = data;
    }
    function build_links(data) {
        for (var cur_name in data) {
            var cur = data[cur_name];
            var cur_neighbors = data[cur_name].neighbors;

            for (var target_name in cur_neighbors) {
                var target = data[target_name];
                var target_neighbors = target.neighbors;

                var cur_to_target_weight = cur_neighbors[target_name];
                var target_to_cur_weight = target_neighbors[cur_name];

                var new_link = {
                    source: cur.node,
                    target: target.node,
                    weight: (cur_to_target_weight + target_to_cur_weight)/2
                }

                links.push(new_link);
            }

        }
    }
    function flatten_data(data) {
        build_nodes(data);
        build_links(data);
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

    window.__vis__updateGraph = function() {
        updateData(function(err, data) {
            if (err) { console.log(err); return ;}
            // build_nodes(data);
            // for (var i = 0; i < links.length; i++) {
            //     var cur_link = links[i];
            //     var source_node_name = cur_link.source.name;
            //     var target_node_name = cur_link.target.name;

            //     var new_weight = data[source_node_name].neighbors[target_node_name];
            //     if (new_weight && new_weight != cur_link.weight) {
            //         cur_link.weight = new_weight;
            //     }

            // }

            force.stop();
            reset();
            flatten_data(data);
            // build_links(data);
            update();
        });
    };
});
