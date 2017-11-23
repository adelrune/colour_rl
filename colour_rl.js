function GameObject(position, has_collision, has_default_interaction) {
    // Will the player trigger an action by trying to walk in that thing.
    this.has_default_interaction = has_default_interaction;
    this.position = position;
    this.has_collision = has_collision;
}

function Floor(symbol) {
    GameObject.call(this, null, false, false);
    this.symbol = symbol;
}

function Wall(symbol) {
    GameObject.call(this, null, true, false);
    this.symbol = symbol;
}

function Actor(position, health, symbol) {
    // Actor has collision and default interaction
    GameObject.call(this, position, true, true);
    this.health = health;
    this.symbol = symbol;
    this.move_delay = 10;
    this.move = function (args) {
        // args : movement, map
        var new_pos = [];
        for (var i = 0; i < args.movement.length; i++) {
            new_pos.push(args.movement[i] + this.position[i]);
        }

        var collided = check_collisions(args.map, new_pos);

        if(collided && collided.has_default_interaction) {
            return collided.default_interaction(this);
        } else if (collided) {
            // collision with non interactable things are only permitted for players.
            // we don't want to penalise a missinput so we return a null as a sign that nothing should happen
            return null
        } else if (args.map.grid[new_pos[0]][new_pos[1]]) {
            this.position = new_pos;
        }
        // 10 arbitrary units of time
        return this.move_delay;
    }
}

function NPC(position, health, symbol) {
    Actor.call(this, position, health, symbol);
    this.move_delay = 10;
    this.get_next_action = function() {
        return this.move({"map":map, movement:[1,0]});
    }

    this.default_interaction = function(entity) {
        return resolve_attack(entity, this);
    }
}

function resolve_attack(attacker, attacked) {
    // TODO: stats and all that bullshit
    attacked.health -= 10;
    console.log(attacked.health);
    // TODO: change by attack delay
    return attacker.move_delay
}

function check_collisions(map, new_pos) {
    // If something is in the entities list, it takes precedence over map elements.
    for (var i = 0; i < map.entities.length; i++) {
        if(JSON.stringify(new_pos) === JSON.stringify(map.entities[i].position)) {
            return map.entities[i]
        }
    }
    //Returns the thing it collides with if it collides
    if (map.grid[new_pos[0]][new_pos[1]].has_collision) {
        return map.grid[new_pos[0]][new_pos[1]];
    }
    return false;
}

var pre_grid = [['#','#','#','#','#'],['#','·','·','·','#'],['#','·','·','·','#'],['#','·','·','·','#'],['#','#','#','#','#']];

var grid = [];
for (var i = 0; i < pre_grid.length; i++) {
    grid.push([]);
    for (var j = 0; j < pre_grid[i].length; j++) {
        if(pre_grid[i][j] === '#')
            grid[i].push(new Wall('#'));
        else
            grid[i].push(new Floor('·'));
    }
}

var map = {
    "grid": grid,
    entities:[],
    //TODO: classify this thing
    update_state: function() {
        this.entities = this.entities.filter(function(entity) {
            return entity.health > 0;
        });
    }
}

var player = new Actor([2,2], 100, "@");
map.entities.push(player);
var scheduler = new ROT.Scheduler.Action();

// This is the lock used to know if we are waiting for user input to continue
var waiting_for_player = true;
var ennemy;
// action that should be called.
var next_player_action = {name:"", args:{}};

function game_loop() {
    if(current_actor === "player") {
        if(next_player_action.name === "") {
            return;
        }
        var duration = player[next_player_action.name](next_player_action.args);
        // null means invalid action
        if (duration === null) {
            next_player_action.name = "";
            return;
        }
        scheduler.setDuration(duration);
        next_player_action.name = "";
        current_actor = scheduler.next();
    } else {
        scheduler.setDuration(current_actor.get_next_action());
        current_actor = scheduler.next();
    }
    update_display();
    map.update_state();
}

function init_game() {
    ennemy = new NPC([1,1], 21, "e");
    map.entities.push(player);
    map.entities.push(ennemy);
    scheduler.add("player", true, 0);
    scheduler.add(ennemy, true, 1);
    current_actor = scheduler.next();
    // wooow, a game loop.
    setInterval(game_loop, 5);
}

init_game();

var display;
$(document).ready(function($) {
    //vue
    var status_colors = new Rainbow();
    status_colors.setSpectrum("red", "yellow", "green");
    update_display = function () {
        for (var i = 0; i < map.grid.length; i++) {
            for (var j = 0; j < map.grid[i].length; j++) {
                display.draw(i+2, j+3, map.grid[i][j].symbol);
            }
        }
        for (var i = 0; i < map.entities.length; i++) {
            display.draw(map.entities[i].position[0]+2, map.entities[i].position[1]+3, map.entities[i].symbol);
        }
        display.drawText(10, 3, "health");
        display.draw(12,4,'❤', "#"+status_colors.colourAt(player.health));
    }

    var init = function() {
        document.body.appendChild(display.getContainer());
        bind_keys();
    }

    bind_keys = function(){
        // up, down, left, right
        var keys_to_movement = {"38":[0, -1],"40":[0, 1], "37":[-1, 0], "39":[1, 0]};

        $("body").keydown(function(e) {
            if(!waiting_for_player) {
                return
            }

            if (keys_to_movement[""+e.keyCode] !== undefined) {
                //player.move(map, keys_to_movement[""+e.keyCode]);
                next_player_action = {name:"move", args:{"map":map, "movement": keys_to_movement[""+e.keyCode]}}
            }
            //update_display();
        });
    }

    var options = {
        width: 17,
        height: 9,
        fontSize: 18,
        forceSquareRatio:true,
    }
    display = new ROT.Display(options);

    var str = "colour_rl";
    display.drawText(1,  1, str);

    update_display();
    init();
});

