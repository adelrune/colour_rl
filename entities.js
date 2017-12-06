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

function Actor(position, health, symbol, name) {
    // Actor has collision and default interaction
    GameObject.call(this, position, true, true);
    this.health = health;
    this.symbol = symbol;
    this.move_delay = 10;
    this.name = name;
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

function NPC(position, health, symbol, name) {
    Actor.call(this, position, health, symbol, name);
    this.move_delay = 10;
    this.get_next_action = function() {
        if(!check_collisions(game.current_map, [1+this.position[0],0+this.position[1]])) {
            return this.move({"map":game.current_map, movement:[1,0]});
        } else {
            return this.move_delay;
        }
    }

    this.default_interaction = function(entity) {
        return resolve_attack(entity, this);
    }
}

function resolve_attack(attacker, attacked) {
    // TODO: stats and all that bullshit
    var damage = 10;
    attacked.health -= damage;
    message_log.push(attacker.name + " attacks " +attacked.name + " for " + damage);
    if (attacked.health <= 0) {
        message_log.push(attacked.name + " dies");
    }
    // TODO: change by attack delay
    return attacker.move_delay
}