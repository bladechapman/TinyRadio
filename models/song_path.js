var mongoose = require('mongoose');

var PathSchema = new mongoose.Schema({
    path: String,
    nodes: {}
}, {minimize: false});

module.exports = mongoose.model('Path', PathSchema);