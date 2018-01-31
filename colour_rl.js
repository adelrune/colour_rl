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
// which are {text:"", description:"", value:""}
// A menu has a selected item for which description is displayed.
// when the game.select() the callback function is called
function Menu(title, options) {
    this.title = title
    // an option is an object of the format {text:"", description:"", value:""}
    this.options = options;
    // selected item is 0 by default
    this.selection = 0;
    this.move_selection = function(amount) {
        this.selection += amount;
        if (this.selection < 0) {
            this.selection = this.options.length - this.selection;
        }
        this.selection %= this.options.length;
        console.log(this.selection);
    }
    // converts letter to array index, if its out of bound return false
    // else sets the selection to the right thing.
    this.char_select = function(char) {
        var num = char.charCodeAt(0) -97;
        if (num > this.options.length) {
            return false;
        }
        this.selection = num;
        return true;
    }
}

function Game() {
    this.player = null;
    this.current_scheduler = null;
    this.current_map = generate_first_map();
    // action that should be called. This is basically the controller.
    this.next_action = {name:"", args:{}};
    // This is the lock used to know if we are waiting for user input to continue
    this.waiting_for_player = true;
    this.current_actor = null;
    this.focus = null;
    this.message_log = [];
    this.current_mode = GAME;
    this.menu_stack = [];

    // seeds and setups the rng.
    this.seed = Math.random()*10e17;
    this.rng = ROT.RNG.clone();
    this.rng.setSeed(this.seed);

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
        } else if (mode === MENU) {
            this.menu_stack.push(args.menu);
        }
        this.selection_callback = callback;
        this.current_mode = mode;
        // resets the next action
        this.next_action.name = "";
    }
    this.move_menu = function(args) {
        if (this.current_mode !== MENU) {
            return;
        }
        var active_menu = this.menu_stack[this.menu_stack.length-1];
        active_menu.move_selection(args.direction);
    }
    this.menu_char_select = function(args) {
        if (this.current_mode !== MENU) {
            return;
        }
        var active_menu = this.menu_stack[this.menu_stack.length-1];
        if (active_menu.char_select(args.char)) {
            // if the letter is in the options, we select it.
            this.select();
        }
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
    var that = this;
    this.init = function() {
        this.current_scheduler = this.current_map.scheduler;
        this.player = new Actor([7,23], 100, "@", "player");
        this.focus = this.player;
        ennemy = new NPC([1,1], 21, "e", "ennemy");
        this.current_map.add_entity(this.player);
        this.current_map.add_entity(ennemy);
        this.current_actor = this.current_scheduler.next();
        this.current_map.update_state();
        this.change_mode(MENU, function(){that.change_mode(GAME);that.menu_stack.pop()}, null, {"menu": new Menu("Welcome to colour_rl", [{text:"Option 1",description:"A description",value:"aaa"},{text:"Option 2",description:"Another description",value:"bbb"}])});
    }
}

game = new Game();
// dummy function, needs to be defined by the view.
var update_display = function(){return};

function game_mode_loop() {
    // waits for end of animation before doing a move.
    if(!game.current_map.animation_finished()) {
        return false;
    }
    if (game.current_actor === game.player) {
        if(game.next_action.name === "") {
            return false;
        }
        var duration = game.player[game.next_action.name](game.next_action.args);
        // null means invalid action
        if (duration === null) {
            game.next_action.name = "";
            return false;
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
    return true;
}

function selection_mode_loop() {
    if(game.next_action.name === "") {
        return false;
    }
    game[game.next_action.name](game.next_action.args);
    game.next_action.name = "";
    game.current_map.update_state();
    return true;
}

var mode_funcs = [];
mode_funcs[GAME] = game_mode_loop;
mode_funcs[SELECTION] = selection_mode_loop;
// Unless it gets more complex, the handling is the same for both in the loop :
// just do whatever the controlle tells you to.
mode_funcs[MENU] = selection_mode_loop;

function game_loop() {
    var state_changed = mode_funcs[game.current_mode]();
    update_display(state_changed);
}

game.init();

setInterval(game_loop, 14);
