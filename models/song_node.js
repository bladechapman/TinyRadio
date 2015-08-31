var mongoose = require('mongoose');

var NodeSchema = new mongoose.Schema({
    name: {type: String, index: true},
    parentPath: String,
    neighbors: {}
}, {minimize: false});

module.exports = mongoose.model('Node', NodeSchema);