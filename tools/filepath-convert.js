module.exports = {
    convertTo : function(path) {
        path = path.replace(/\s/g, '\\ ');
        path = path.replace(/\(/g, '\\(');
        path = path.replace(/\)/g, '\\)');
        path = path.replace(/\&/g, '\\&');
        path = path.replace(/\'/g, '\\\'');
        return path;
    },
    convertFrom : function(path) {
        path = path.replace(/\\\s/g, ' ');
        path = path.replace(/\\\(/g, '(');
        path = path.replace(/\\\)/g, ')');
        path = path.replace(/\\\&/g, '&');
        path = path.replace(/\\\'/g, '\'');
        return path;
    }
}