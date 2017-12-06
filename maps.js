function Map(grid) {
    this.grid = grid;
    // size in x and y
    this.dimensions = [grid.length, grid[0].length];
    this.entities = [];
    this.update_state = function() {
        var alive = [];
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].health > 0) {
                alive.push(this.entities[i]);
            } else {
                this.scheduler.remove(this.entities[i]);
            }
        }
        this.entities = alive;
    }
    this.scheduler = new ROT.Scheduler.Action();
}

function get_layout_from_rot_generator(rot_generator, num_calls) {
    var num_calls = num_calls === undefined ? 1 : num_calls;
    var grid = [];
    for (var i = 0 ; i < rot_generator._width; i++) {
        grid.push([]);
    }
    for (var i = 0; i < num_calls; i++) {
        rot_generator.create(function(x, y, wall) {
            if(wall) {
                grid[x][y] = new Wall("#");
            } else {
                grid[x][y] = new Floor("·");
            }
        });
    }

    return grid;
}

function check_collisions(map, new_pos) {
    // If something is in the entities list, it takes precedence over map elements.
    for (var i = 0; i < map.entities.length; i++) {
        if(JSON.stringify(new_pos) === JSON.stringify(map.entities[i].position)) {
            return map.entities[i];
        }
    }
    //Returns the thing it collides with if it collides
    if (map.grid[new_pos[0]][new_pos[1]].has_collision) {
        return map.grid[new_pos[0]][new_pos[1]];
    }
    return false;
}

// var rgen = new ROT.Map.Cellular(60, 30);
// rgen.randomize(0.5);

// grid = get_layout_from_rot_generator(rgen,2);

grid = get_layout_from_rot_generator(new ROT.Map.Arena(60,31));