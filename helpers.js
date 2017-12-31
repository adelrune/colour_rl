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