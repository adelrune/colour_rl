function GameObject(position, has_collision, has_default_interaction, repr, animation) {
    // Will the player trigger an action by trying to walk in that thing.
    this.has_default_interaction = has_default_interaction;
    this.position = position;
    this.has_collision = has_collision;
    // This will generally be false for things that moves a lot
    this.persistent_memory = true;
    this.visible = false;
    // repr this was last seen as
    this.remembered_as = null;
    this.repr = repr;
    this.animation = animation !== undefined ? animation : null;
    if (typeof(this.repr) === "string") {
        // If no colour is set, its white.
        this.repr = {"symbol":this.repr, "colour":[255,255,255]}
    }

    // gets the next repr in the animation (or the static repr otherwise)
    this.next_repr = function() {
        return this.animation !== null ? this.animation.next() : this.repr;
    }

    this.light_passes = function() {
        return ! this.has_collision;
    }
    // deals with remembered_as and visible.
    this.set_visible = function() {
        this.visible = true;
        // We don't remember things that aren't persistent
        this.remembered_as = this.persistent_memory ? this.repr : null;
    }
}

// An animated thing
var Animation = function(frames, loop) {
    this.frames = frames;
    this.index = 0;
    this.loop = loop;
    this.finished = false;
}

Animation.prototype.next = function() {
    var repr = this.frames[this.index];
    this.index += 1;
    this.finished = this.index == this.frames.length && !this.loop;
    this.index %= this.frames.length;
    return repr;
}

var Ability = function(base_delay, apply) {
    this.base_delay = base_delay;
    this.apply = apply;
}

var Particle = function(frames, next_func, position) {
    Animation.call(this, frames, false);
    this.position = position;
    this.next_func = next_func;
    this.next = function() {
        repr = Animation.prototype.next.call(this);
        this.next_func();
        return repr;
    };
}

// spells are going to be made on the fly like that
// right now it does nothing interesting.
function make_ability(args) {
    return new Ability(5, function(args) {
        console.log(args);
        var affected = args.map.get_entities_at_position(args.position);
        for (var i = 0; i < affected.length; i++) {
            affected[i].health -= 5;
        }
        p = new Particle (
            [{"symbol": '§', "colour":[13,0,0]}, {"symbol": '§', "colour":[26,0,0]}],
            function(){
                if (this.frames.length == 2) {
                    for (var i = 0; i < 45; i++) {
                        this.frames.push({"symbol":'§',"colour":[13 + 5*i,0,0]});
                    }
                }
            },
            args.position
        );
        args.map.particles.push(p);
    });
}



/*var Spell = function(primary, modifier, shape) {

}*/

function Floor(repr) {
    GameObject.call(this, null, false, false, repr);
}

function Wall(repr) {
    GameObject.call(this, null, true, false, repr);
}

function Actor(position, health, repr, name) {
    // Actor has collision and default interaction
    GameObject.call(this, position, true, true, repr);
    this.health = health;
    this.move_delay = 10;
    this.name = name;
    this.persistent_memory = false;
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
    this.use_ability = function(args) {
        var ability = make_ability(args);
        ability.apply(args);
    }
}

function NPC(position, health, repr, name) {
    Actor.call(this, position, health, repr, name);
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