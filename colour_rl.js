function Game() {
    this.player = null;
    this.current_scheduler = null;
    this.current_map = new Map(grid);
    // action that should be called. This is basically the controller.
    this.next_player_action = {name:"", args:{}};
    // This is the lock used to know if we are waiting for user input to continue
    this.waiting_for_player = true;
    this.current_actor = null;

    this.init = function() {
        this.current_scheduler = this.current_map.scheduler;
        this.player = new Actor([2,2], 100, "@");
        ennemy = new NPC([1,1], 21, "e");
        this.current_map.entities.push(this.player);
        this.current_map.entities.push(ennemy);
        this.current_scheduler.add("player", true, 0);
        this.current_scheduler.add(ennemy, true, 1);
        this.current_actor = this.current_scheduler.next();
    }
}

var message_log = ["Welcome to colour_rlfrf"];

var game = new Game();

function game_loop() {
    if(game.current_actor === "player") {
        if(game.next_player_action.name === "") {
            return;
        }
        var duration = game.player[game.next_player_action.name](game.next_player_action.args);
        // null means invalid action
        if (duration === null) {
            game.next_player_action.name = "";
            return;
        }
        game.current_scheduler.setDuration(duration);
        game.next_player_action.name = "";
        game.current_actor = game.current_scheduler.next();
    } else {
        var duration = game.current_actor.get_next_action()
        game.current_scheduler.setDuration(duration);
        game.current_actor = game.current_scheduler.next();
    }
    update_display();
    game.current_map.update_state();
}

game.init();

setInterval(game_loop, 1);
