$(function() {
    var force,
        chart_window,
        canvas,
        bg,
        fg;
    var w = 500,
        h = 500,
        c = 10;
    var bg_color = '#ECEFF1',
        line_color = '#546E7A';
    var nodes = [],
        links = [],
        cached_data = {};
    var palette = {
        "yellow": "#F9A825",
        "red": "#FF1744",
        "pink": "#F48FB1",
        "purple": "#E040FB",
        "blue": "#29B6F6",
        "green": "#00E676",
    };

    drawBG();
    initialize();
    function drawBG() {
        force = d3.layout.force()
            .charge(-.0000001)
            .gravity(0.2)
            .linkDistance(function(datum) {
                return parseInt(300/datum.weight);
            })
            .size([w, h])
            .on("tick", tick);

        chart_window = d3.select('#chart')
            .append('svg')
            .attr("viewBox", "0 0 500 500")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr('width', w)
            .attr('height', h)
            .attr('class', 'chart');

        canvas = chart_window.append('g')
            .attr('id', 'canvas');
        fg = canvas.append('g')
            .attr('id', 'fg');
        bg = canvas.append('g')
            .attr('id', 'bg');

        bg.selectAll('.bubble_main').remove();
        bg.selectAll('.bubble_tail').remove();
        bg.append('circle')
            .attr('class', 'bubble_main')
            .attr('cx', 250)
            .attr('cy', 250)
            .attr('r', 200)
            .style('stroke', line_color)
            .style('stroke-width', 4)
            .style('fill', 'none');
        bg.append('path')
            .attr('class', 'bubble_tail')
            .attr('d', function(d) {
                var x = 250, y = 486;
                return 'M ' + x + ' ' + y + ' l -40 -40 l 80 0 z';
            })
            .style('stroke', line_color)
            .style('stroke-width', 4)
            .style('fill', bg_color);
        bg.append('path')
            .attr('class', 'bubble_tail')
            .attr('d', function(d) {
                var x = 250, y = 483;
                return 'M ' + x + ' ' + y + ' l -40 -40 l 80 0 z';
            })
            .style('stroke', bg_color)
            .style('stroke-width', 0)
            .style('fill', bg_color);
    };
    function initialize() {
        force.stop();
        updateData(function(err, data) {
            if (err) {
                console.log (err);
                return;
            }
            reset();
            flatten_data(data);
            update();
        });
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
    function reset() {
        nodes = [];
        links = [];
        node_parent = fg.selectAll('.circle_group');
    }
    function flatten_data(data) {
        build_nodes(data);
        build_links(data);
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
    function update() {
        endHover();
        node_parent.remove();
        node_parent = fg.selectAll('.circle_group')
                .data(nodes)
                .enter().append('g').attr('class', 'circle_group')
                .on("mouseover", hover)
                .on("mouseout", endHover)
        node = node_parent
                .append('circle')
                .attr('id', function(datum) {
                    return datum.name;
                })
                .attr('class', 'node')
                .attr('r', c)
                .attr('fill', function(datum) {
                    var colors = Object.keys(palette);
                    var color_key = colors[parseInt(Math.random() * colors.length)];
                    var color = palette[color_key];
                    datum.color = color;
                    return color;
                });
        node_parent
            .append('circle')
            .attr('r', function(datum) {
                if (datum.name === window.highlighted_name) {
                    return c * 1.5;
                }
                return 0;
            })
            .style('fill', 'none')
            .style('stroke', function(datum) {
                return datum.color || palette.blue;
            })
            .style('stroke-width', 2);
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
        if (!datum && !index) {
            fg.selectAll('text').remove();
        } else {
            var g = d3.select(this);
            g.select('text').remove();
        }
    }

    window.__vis__updateGraph = initialize;
});
