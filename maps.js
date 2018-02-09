function Map(grid, entities) {
    this.grid = grid;
    // size in x and y
    this.dimensions = [grid.length, grid[0].length];

    this.scheduler = new ROT.Scheduler.Action();

    entities = entities === undefined ? [] : entities;
    this.entities = [];

    this.add_entity = function(entity) {
        this.entities.push(entity)
        this.scheduler.add(entity, true);
    }

    this.remove_entity = function(entity) {
        remove_from_array(this.entities, entity);
        this.scheduler.remove(entity);
    }

    for (var i = 0; i < entities.length; i++) {
        this.add_entity(entities[i]);
    }

    // Particle effects that have yet to be played.
    this.particles = [];
    // The animation is finished if there are no particles to play.
    this.animation_finished = function() {
        return !!this.particles;
    }
    // javascriiiiiiiipt
    var that = this;
    this.fov = new ROT.FOV.PreciseShadowcasting(function(x, y) {
        if(that.grid[x] && that.grid[x][y] && ! that.grid[x][y].light_passes) {
            console.log(that.grid[x][y])
        }
        return that.grid[x] && that.grid[x][y] ? that.grid[x][y].light_passes() : false;
    });

    this.get_entity_square = function(entity) {
        return this.grid[entity.position[0]][entity.position[1]];
    }
    this.get_entities_at_position = function(pos) {
        return this.entities.filter(function(ent){return JSON.stringify(pos) == JSON.stringify(ent.position)});
    }
    this.get_selected_positions = function() {
        var selected = []
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[i].length; j++) {
                if (this.grid[i][j].selected) {
                    selected.push([i,j]);
                }
            }
        }
        return selected;
    }
    this.get_grid_at_position = function(pos) {
        if (this.grid[pos[0]] && this.grid[pos[0]][pos[1]]) {
            return this.grid[pos[0]][pos[1]];
        }
        return null;
    }
    this.get_selected_entities = function() {
        var selected = this.get_selected_positions()
        var ret_val = [];
        for (var i = 0; i < selected.length; i++) {
            ret_val = ret_val.concat(this.get_entities_at_position(selected[i]));
        }
        return ret_val;
    }
    this.update_state = function() {
        // Resets visibility states
        for (var i = 0; i < that.grid.length; i++) {
            for (var j = 0; j < that.grid[i].length; j++) {
                that.grid[i][j].visible = false;
                that.grid[i][j].selected = false;
            }
        }
        this.fov.compute(game.player.position[0], game.player.position[1], 6, function(x, y) {
            if (typeof(that.grid[x]) !== "undefined" && typeof(that.grid[x][y]) !== "undefined") {
                that.grid[x][y].set_visible();
            }
        });
        var alive = [];
        // This section is for tile selection in SELECTION mode
        if(game.current_mode === SELECTION) {
            game.selection_function(function(pos, level){
                that.grid[pos[0]][pos[1]].selected = level;
            });
        }
        // visibility, selection and health in the same loop for entities
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].health > 0 || this.entities[i].health === null) {
                alive.push(this.entities[i]);
                this.entities[i].visible = false;
                var square = this.get_entity_square(this.entities[i]);
                if (square.visible) {
                    this.entities[i].set_visible();
                }
                this.entities[i].selected = square.selected;
            } else {
                game.message_log.push(this.entities[i].name + " dies");
                this.scheduler.remove(this.entities[i]);
            }
        }
        this.entities = alive;
    }
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

function check_collisions(map, new_pos, entity) {
    // If something is in the entities list, it takes precedence over map elements.
    for (var i = 0; i < map.entities.length; i++) {
        if(JSON.stringify(new_pos) === JSON.stringify(map.entities[i].position)) {
            return map.entities[i];
        }
    }
    //Returns the thing it collides with if it collides
    if (!map.grid[new_pos[0]][new_pos[1]].can_pass(entity)) {
        return map.grid[new_pos[0]][new_pos[1]];
    }
    return false;
}

// var rgen = new ROT.Map.Cellular(60, 30);
// rgen.randomize(0.5);

// grid = get_layout_from_rot_generator(rgen,2);

// grid = get_layout_from_rot_generator(new ROT.Map.EllerMaze(600,310));
// grid = get_layout_from_rot_generator(new ROT.Map.Arena(600,310));


// this is going to be some ugly declarative code.
function generate_first_map() {
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


//lol
function generate_second_map() {
    // intro vaults are (for now) full map vaults.
    var grid = [];
    var entities = [];
    var map = map_2_vaults[0]

    for (var j = 0; j < map["map"][0].length; j++) {
        grid.push([]);
        for (var i = 0; i < map["map"].length; i++) {
            objs = get_objects_from_shorthand(map["map"][i].charAt(j), [j,i]);
            grid[j].push(objs["terrain"]);
            if (objs["entity"]) {
                entities.push(objs["entity"]);
            }
        }
    }
    return new Map(grid, entities);
}

var second_map = generate_second_map();