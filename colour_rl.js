// input modes
// GAME is the default rl gameplay mode
var GAME = 0;
// SELECTION is a tile selection mode where the navigation is in the game map
var SELECTION = 1;
// MENU is when navigating in a menu \o/
var MENU = 2;

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
    this.current_mode = GAME;
    //
    this.selection_callback = null;

    // The default state is GAME, other states uses the select method to go back to game
    // and to execute the callback that takes the thing that was selected (either in menu or selection mode)
    this.change_mode = function(mode, callback) {
        if (mode === GAME) {
            this.focus = this.player;
        } else if (mode === SELECTION) {
            this.focus = {"position":this.player.position};
        }
        this.selection_callback = callback;
        this.current_mode = mode;
    }
    // moves the focus of the game in selection mode.
    this.move_focus = function(movement) {
        if (this.current_mode !== SELECTION) {
            return;
        }
        var new_pos = [];
        for (var i = 0; i < args.movement.length; i++) {
            new_pos.push(movement[i] + this.focus.position[i]);
        }
        this.focus.position = new_pos;
    }

    this.select = function(args) {
        // default return mode is GAME, I guess MENU could return in SELECTION too.
        args.return_mode = args.return_mode === undefined ? GAME : args.return_mode;
        this.change_mode(args.return_mode);
        this.selection_callback(args);
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

var message_log = ["Welcome to colour_rl"];

var game = new Game();
// dummy function, needs to be defined by the view.
var update_display = function(){return};

function game_mode_loop() {
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
