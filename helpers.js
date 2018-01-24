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

function divide_colours(col1, col2) {
    var col = [];
    for (var i=0; i<3; i++) {
        col[i] = col1[i] / col2[i];
        col[i] = Math.floor(col[i]);
    }
    return col;
}