module.exports = {
    convertTo : function(path) {
        return path.replace(/\s/g, '\\ ');
    },
    convertFrom : function(path) {
        return path.replace(/\\\s/g, ' ');
    }
}