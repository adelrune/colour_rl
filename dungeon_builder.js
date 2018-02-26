function get_layout_from_rot_generator(grid, rot_generator, num_calls, floor_val, wall_val) {
    // populates a grid with a rotjs generator.

    // "wall" or "floor" to have semantic tiles in early generation stages.
    var floor_val = floor_val || "floor";
    var wall_val = wall_val || "wall";

    var num_calls = num_calls === undefined ? 1 : num_calls;
    var grid = [];
    // initialize grid if its not there
    for (var i = 0 ; i < rot_generator._width; i++) {
        if(!grid[i]) {
            grid.push([]);
        }
    }
    for (var i = 0; i < num_calls; i++) {
        rot_generator.create(function(x, y, wall) {
            if(wall) {
                grid[x][y] = new Wall(wall_val);
            } else {
                grid[x][y] = new Floor(floor_val);
            }
        });
    }
    return grid;
}

function fill_with(grid, fill, start_pos, stop_pos) {
    // fills with char starting at start_pos stopping at stop_pos, (optional, otherwise fill all)
    start_pos = start_pos || [0, 0];
    stop_pos = stop_pos || [grid.length, grid[0].length];

    for (var i = start_pos[0]; i < stop_pos[0]; i++) {
        grid[i] = grid[i] || [];
        for (var j = 0; j < .length; j++) {
            grid[i][j] = fill;
        }
    }
}

function fill_from_vaults() {
    // intro vaults are (for now) full map vaults.
    var grid = [];
    var entities = [];
    var map = intro_vaults[0]

    for (var j = 0; j < map["map"][0].length; j++) {
        grid.push([]);
        for (var i = 0; i < map["map"].length; i++) {
            objs = get_objects_from_shorthand(map["map"][i].charAt(j), [j,i]);
            grid[j].push(objs["terrain"]);
            if (objs["entity"]) {
                entities.push(objs["entity"]);
                console.log(entities);
            }
        }
    }
    return new Map(grid, entities);
}

function create_floor(size, args) {
    // args is going to contain a shitton of stuff.
    var grid = [];
    // initialize the grid with nulls
    fill_with(grid, null);



}