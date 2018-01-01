// input modes
// GAME is the default rl gameplay mode
var GAME = 0;
// SELECTION is a tile selection mode where the navigation is in the game map
var SELECTION = 1;
// MENU is when navigating in a menu \o/
var MENU = 2;

var game = undefined;

// Default selection function, only calls the callback for the games
// focus current position.
var single_tile_selection = function(callback) {
    // Don't call with position for compatibility with rot.js line of sight functions.
    callback(game.focus.position, 1)
}

// should switch to ray casting for better !ignore_walls. right now its a bit silly
// this algorithm is probably more performant than ray casting for smite targeting.
function make_round_selection(radius, ignore_walls) {
    return function(callback) {
        // nighbours we are checking.
        var directions = [[1,0], [-1,0], [0,1], [0,-1]];
        // tiles that are selected.
        var center = game.focus.position;
        var open_tiles = [game.focus.position];
        var idx = 0;
        // while our list grows, adds neighbours that exist and that aren't too far.
        while(open_tiles.length > idx) {
            var level = JSON.stringify(open_tiles[idx]) == JSON.stringify(game.focus.position) ? 4 : 1;
            callback(open_tiles[idx], level);
            for (var i = 0; i < directions.length; i++) {
                var pos = add_positions(directions[i], open_tiles[idx]);
                if (game.current_map.get_grid_at_position(pos) &&
                    !obj_in_array(pos, open_tiles) &&
                    euclidian_distance(pos, center) <= radius &&
                    (ignore_walls || !game.current_map.get_grid_at_position(pos).has_collision)) {
                    open_tiles.push(pos);
                }
            }
            idx+=1;
        }
    }
}

// A menu is some header text displayed in columns, some options
// which are {text:[], description:"", value:""}
// A menu has a selected item for which description is displayed.
// when the game.select() function is called, the
function Menu(title, options) {
    this.title = title
    // an option is an object of the format {text:[], }
    this.options = options;
    // selected item is 0 by default
    this.selection = 0;
}

function Game() {
    this.player = null;
    this.current_scheduler = null;
    this.current_map = new Map(grid);
    // action that should be called. This is basically the controller.
    this.next_action = {name:"", args:{}};
    // This is the lock used to know if we are waiting for user input to continue
    this.waiting_for_player = true;
    this.current_actor = null;
    this.focus = null;
    this.message_log = ["Welcome to colour_rl"];
    this.current_mode = GAME;
    this.selection_callback = null;
    // Function that calls a callback with the positions selected by the cursor.
    this.selection_function = null;
    // this is either "memory", "sight" or undefined. Limits what square can be moved to.
    this.selection_limit = null;
    // The default state is GAME, other states uses the select method to go back to game
    // and to execute the callback that takes the thing that was selected (either in menu or selection mode)
    this.change_mode = function(mode, callback, select_func, args) {
        args = args === undefined ? {} : args;
        if (mode === GAME) {
            this.focus = this.player;
        } else if (mode === SELECTION) {
            this.focus = {"position":this.player.position};
            this.selection_limit = args.limit
            // default selection is single tile.
            this.selection_function = select_func !== undefined ? select_func : single_tile_selection;
        }
        this.selection_callback = callback;
        this.current_mode = mode;
        // resets the next action
        this.next_action.name = "";
    }
    // moves the focus of the game in selection mode.
    this.move_focus = function(args) {
        if (this.current_mode !== SELECTION) {
            return;
        }
        var new_pos = [];
        for (var i = 0; i < args.movement.length; i++) {
            new_pos.push(args.movement[i] + this.focus.position[i]);
        }
        var can_move = (
            !this.selection_limit ||
            (this.selection_limit === "memory" && this.current_map.grid[new_pos[0]][new_pos[1]].remembered_as) ||
            (this.selection_limit === "sight" && this.current_map.grid[new_pos[0]][new_pos[1]].visible)
        );
        if (can_move) {
            this.focus.position = new_pos;
        }
    }

    this.select = function() {
        // The selection callback is responsible for any mode change resulting from
        // a call to select()
        this.selection_callback();
    }

    this.init = function() {
        this.current_scheduler = this.current_map.scheduler;
        this.player = new Actor([2,2], 100, "@", "player");
        this.focus = this.player;
        ennemy = new NPC([1,1], 21, "e", "ennemy");
        this.current_map.entities.push(this.player);
        this.current_map.entities.push(ennemy);
        this.current_scheduler.add("player", true, 0);
        this.current_scheduler.add(ennemy, true, 1);
        this.current_actor = this.current_scheduler.next();

        this.current_map.update_state();
    }
}

game = new Game();
// dummy function, needs to be defined by the view.
var update_display = function(){return};

function game_mode_loop() {
    // waits for end of animation before doing a move.
    if(!game.current_map.animation_finished()) {
        return;
    }
    if(game.current_actor === "player") {
        if(game.next_action.name === "") {
            return;
        }
        var duration = game.player[game.next_action.name](game.next_action.args);
        // null means invalid action
        if (duration === null) {
            game.next_action.name = "";
            return;
        }
        game.current_scheduler.setDuration(duration);
        game.next_action.name = "";
        game.current_actor = game.current_scheduler.next();
    } else {
        var duration = game.current_actor.get_next_action()
        game.current_scheduler.setDuration(duration);
        game.current_actor = game.current_scheduler.next();
    }
    game.current_map.update_state();
}

function selection_mode_loop() {
    if(game.next_action.name === "") {
        return;
    }
    game[game.next_action.name](game.next_action.args);
    game.next_action.name = "";
    game.current_map.update_state();
}

var mode_funcs = [];
mode_funcs[GAME] = game_mode_loop;
mode_funcs[SELECTION] = selection_mode_loop;
// Unless it gets more complex, the handling is the same for both in the loop :
// just do whatever the controlle tells you to.
mode_funcs[MENU] = selection_mode_loop;

function game_loop() {
    update_display();
    mode_funcs[game.current_mode]();
}

game.init();

setInterval(game_loop, 20);
