function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function obj_in_array(object, array) {
    var obj = JSON.stringify(object);
    for (var i = array.length - 1; i >= 0; i--) {
        if (JSON.stringify(array[i]) == obj) {
            return true;
        }
    }
    return false;
}

function remove_from_array(array, thing) {
    array.splice(array.indexOf(thing), 1);
}

// The following functions are helpers for working with positions (points)
// I could have imported a library but no.

function add_positions(pos1, pos2) {
    return [pos1[0]+pos2[0], pos1[1]+pos2[1]];
}

function euclidian_distance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[1] - pos2[1], 2));
}

// colour helpers (thx stackoverflow)
function comp_to_hex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgb_to_hex(rgb) {
    // no colour means black
    if(rgb === undefined) {
        return "#000000";
    }
    return "#" + comp_to_hex(rgb[0]) + comp_to_hex(rgb[1]) + comp_to_hex(rgb[2]);
}

function hex_to_rgb(hex) {
    hex = hex.replace("#", "");
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r,g,b];
}

function add_colours(col1, col2) {
    var col = [];
    for (var i=0; i<3; i++) {
        col[i] = col1[i] + col2[i];
        col[i] = col[i] < 0 ? 0 : col[i];
        col[i] = col[i] > 255 ? 255 : col[i];
    }
    return col;
}

// very stupid but 2X faster than stringifying colours
function rgb_int_encoding(colour) {
    return colour === undefined ? 0 : colour[0]*1000000 + colour[1]*1000 + colour[2];
}

// The is called a lot and used to create new lists every time which is why its memoized now
var divide_colours;
(function () {
    cache = {}
    divide_colours = function (col1, col2) {
        var param_encoding = rgb_int_encoding(col1) + rgb_int_encoding(col2);
        if (cache[param_encoding]) {
            return cache[param_encoding]
        }
        var col = [];
        for (var i=0; i<3; i++) {
            col[i] = col1[i] / col2[i];
            col[i] = Math.floor(col[i]);
        }
        cache[param_encoding] = col;
        return col;
    }
})();