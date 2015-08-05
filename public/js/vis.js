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
    var node_parent,
        line_parent;
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
        force = d3.layout.force()
            .charge(-1)
            .gravity(0.1)
            .linkDistance(function(datum) {
                return parseInt(2000/datum.weight);
            })
            .size([w, h])
            .on("tick", tick);

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
            if (dataReq.readyState === 4 && dataReq.status === 200) {

                var data = dataReq.response.data;
                if (Object.keys(data).length > 3000) {
                    $('#tip').html('Too many songs to display');
                    callback({
                        'message' : 'Too many songs'
                    }, null);
                }
                else {
                    callback(null, data);
                }
            }
            else if (dataReq.readyState === "complete" && dataReq.status !== 200) {
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

        cached_data = data;
    }
    function build_nodes(data) {
        for (var node_name in data) {
            var new_node = { name: node_name };
            if (cached_data[node_name] && cached_data[node_name].node) {
                new_node['x'] = cached_data[node_name].node.x;
                new_node['y'] = cached_data[node_name].node.y;
                new_node['color'] = cached_data[node_name].node.color
            }
            nodes.push(new_node);
            data[node_name].node = new_node;
        }
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

        if (line_parent) { line_parent.remove(); }
        if (window.__vis__previous) {
            line_parent = fg.append('line').style('stroke', line_color).style('stroke-width', 2);
        }

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
                    if (!datum.color) {
                        var colors = Object.keys(palette);
                        var color_key = colors[parseInt(Math.random() * colors.length)];
                        var color = palette[color_key];
                        datum.color = color;
                    }
                    return datum.color;
                });
        node_parent
            .append('circle')
            .attr('r', function(datum) {
                if (datum.name === window.__vis__highlighted) {
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
            .linkDistance(function(datum) {
                return parseInt((40 * Object.keys(cached_data).length)/datum.weight);
            })
            .start();
    }
    function tick() {
        fg.selectAll('.circle_group').attr('transform', function(datum) {
            return 'translate(' + datum.x + ', ' + datum.y + ')';
        });
        if (window.__vis__previous) {
            var source = cached_data[window.__vis__previous].node;
            var target = cached_data[window.__vis__highlighted].node;
            fg.select('line').attr('x1', function() { return source.x });
            fg.select('line').attr('y1', function() { return source.y });
            fg.select('line').attr('x2', function() { return target.x });
            fg.select('line').attr('y2', function() { return target.y });
        }
        fg.attr('transform', function() {
            var bBox = $('#fg')[0].getBBox();

            var orig_width = bBox.width;
            var orig_height = bBox.height;

            var bubble_width = 320/1.414;

            var new_scale_factor = (orig_width > orig_height) ? bubble_width/orig_width : bubble_width/orig_height;

            var new_width = orig_width * new_scale_factor
            var new_height = orig_height * new_scale_factor

            var width_diff = new_width - orig_width;
            var height_diff = new_height - orig_height;

            var anchor_x = -(bBox.x * (new_scale_factor - 1))/new_scale_factor;
            var offset_x = -(width_diff)/(2 * new_scale_factor)

            var anchor_y = -(bBox.y * (new_scale_factor - 1))/new_scale_factor;
            var offset_y = -(height_diff)/(2 * new_scale_factor)

            var scaling_str = 'scale(' + new_scale_factor + ', ' + new_scale_factor + ')';
            var translate_str = 'translate(' + (anchor_x + offset_x) + ', ' + (anchor_y + offset_y) + ')';
            return scaling_str + ' ' + translate_str;
        });

    }
    function hover(datum, index) {
        $('#tip').html(window.filter_filename(datum.name));
    }
    function endHover(datum, index) {
        $('#tip').html('');
    }

    window.__vis__updateGraph = initialize;
});
