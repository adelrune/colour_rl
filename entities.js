// shorthand constructor for creating reprs. Long form is more readable...

var rgb_constants = {
    default_bg:[35,35,35],
    black:[0,0,0],
    white:[255,255,255]
}

function repr(symbol, colour, bg) {
    colour = colour === undefined ? rgb_constants.white : colour;
    bg = bg === undefined ? rgb_constants.default_bg : bg;
    return {"symbol": symbol, "colour":colour, "bg":bg}
}

function GameObject(position, has_collision, repr, animation) {
    this.position = position;
    this.has_collision = has_collision;
    // This will generally be false for things that moves a lot
    this.persistent_memory = true;
    this.visible = false;
    // changes the repr, false if not selected, is a number for the selection level.
    this.selected = false;
    // repr this was last seen as
    this.remembered_as = null;
    // Entities that are linked to that thing.
    this.linked_entities = [];
    this.repr = repr;
    this.status = [];
    this.animation = animation !== undefined ? animation : null;
    // Animation generated when this entity is superposed with others.
    this.superposition_animation = null;
    if (typeof(this.repr) === "string") {
        // If no colour is set, its white.
        this.repr = {"symbol":this.repr, "colour":[255,255,255], "bg":[35,35,35]}
    }

    // gets the next repr in the animation (or the static repr otherwise)
    this.next_repr = function() {
        var repr;
        if (this.visible) {
            var animation = this.superposition_animation || this.animation;
            repr = animation !== null ? animation.next() : this.repr;

            repr.memory = false;
        } else if (this.remembered_as) {
            repr = this.remembered_as;
            // we tell the thing its a memory, display is up to the view.
            repr.memory = true;
        } else {
            // returns null if it doesn't have a valid display
            return null;
        }
        return repr;
    }

    this.light_passes = function() {
        return ! this.has_collision;
    }

    // asks the question "can the entity pass over this"
    this.can_pass = function(entity) {
        return ! this.has_collision;
    }

    this.has_status = function(status) {
        return this.status.indexOf(status) !== -1;
    }

    this.add_status = function(status) {
        if (this.status.indexOf(status) === -1)
            this.status.push(status);
    }

    this.remove_status = function(status) {
        remove_from_array(this.status, status);
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
    this.last_time_called = performance.now();
    this.finished = false;
}

var framerate = 16;
Animation.prototype.next = function() {
    var repr = this.frames[this.index];
    var now = performance.now();
    var elapsed = now - this.last_time_called;
    if (elapsed >= framerate) {
        this.index += Math.floor(elapsed/framerate);
        this.last_time_called += Math.floor(elapsed/framerate) * framerate;
    }
    this.finished = this.index == this.frames.length && !this.loop;
    this.index %= this.frames.length;
    return repr;
}


// TODO : maybe cache this.
function create_static_animation(char, colour, bg, frames) {
    var animation_frames = [];
    colour = colour === undefined : rgb_constants.white;
    bg = bg === undefined : rgb_constants.default_bg;

    for (var i = 0; i < frames; i++) {
        var char = successive_chars[Math.floor(i / frames_per_char)];
        animation_frames.push(repr(char, colour, bg));
    }
    return animation_frames;
}

function create_transition_frames(successive_chars, frames_per_char, fg_tints_array, bg_tints_array, add_reverse_transition) {

    var animation_frames = [];
    var animation_len = successive_chars.length * frames_per_char;
    var fg_rainbow = new Rainbow();
    var bg_rainbow = new Rainbow();
    fg_rainbow.setSpectrumByArray(fg_tints_array.map(rgb_to_hex));
    fg_rainbow.setNumberRange(0, successive_chars.length * frames_per_char);
    bg_rainbow.setSpectrumByArray(bg_tints_array.map(rgb_to_hex));
    bg_rainbow.setNumberRange(0, successive_chars.length * frames_per_char);

    for (var i = 0; i < animation_len; i++) {
        var char = successive_chars[Math.floor(i / frames_per_char)];
        animation_frames.push(repr(char, hex_to_rgb(fg_rainbow.colourAt(i)), hex_to_rgb(bg_rainbow.colourAt(i))));
    }
    if (add_reverse_transition) {
        animation_frames = animation_frames.concat(animation_frames.slice().reverse());
    }
}

// creates a transition animation between chars in a string and between different colours.
function create_transition_animation(successive_chars, frames_per_char, fg_tints_array, bg_tints_array, add_reverse_transition, loop) {
    return new Animation(create_transition_frames(successive_chars, frames_per_char, fg_tints_array, bg_tints_array, add_reverse_transition), loop);
}

function create_superposition_animation(main_entity, other_entities) {
    if (!other_entities.length) {
        return null;
    }
    first_frame = main_entity.animation.frames[0] || main_entity.repr;
    last_frame = main_entity.animation.frames[main_entity.animation.frames.length] || main_entity.repr;
    fadein_frames = create_transition_animation(first_frame.symbol, 6, [black_colour, first_frame.colour], [black_colour, first_frame.bg]);
    fadeout_frames = create_transition_animation(last_frame.symbol, 6, [black_colour, last_frame.colour], [black_colour, last_frame.bg]);

}

var Ability = function(base_delay, apply) {
    this.base_delay = base_delay;
    this.apply = apply;
}

var Particle = function(frames, next_func, position) {
    Animation.call(this, frames, false);
    this.position = position;
    this.next_func = next_func;
    this.next = function() {
        repr = Animation.prototype.next.call(this);
        this.next_func();
        return repr;
    };
}

// spells are going to be made on the fly like that
// right now it does nothing interesting.
function make_ability(args) {
    function effect() {
        var positions = game.current_map.get_selected_positions();
        var affected = game.current_map.get_selected_entities();
        for (var i = 0; i < positions.length; i++) {
            p = new Particle (
                [{"symbol": '§', "colour":[13,0,0]}, {"symbol": '§', "colour":[26,0,0]}],
                function() {
                    if (this.frames.length == 2) {
                        // No need for identical seed for particle animations
                        factor = Math.floor(Math.random() * 15) + 5;
                        for (var i = 0; i < factor; i++) {
                            var ichelou = i-5;
                            ichelou = ichelou < 0 ? 0 : ichelou;
                            this.frames.push({"symbol":'§',"colour":[55 + 10*i,0,0], "bg":[255 - 9*i,10*(factor-5) - ichelou*9,0]});
                        }
                    }
                },
                positions[i]
            );
            game.current_map.particles.push(p);
        }
        for (var i = 0; i < affected.length; i++) {
            affected[i].health -= 5;
            game.message_log.push(affected[i].name + " is engulfed in flames " + " for "+5+" damage");
        }
        game.change_mode(GAME)
        return 5
    }
    return new Ability(5, function(args) {
        game.change_mode(SELECTION, effect, make_round_selection(3), {limit:"sight"});
    });
}



/*var Spell = function(primary, modifier, shape) {

}*/

function Floor(repr, animation) {
    GameObject.call(this, null, false, repr, animation);
}

function Wall(repr, animation) {
    GameObject.call(this, null, true, repr, animation);
}

function Wall(repr, animation) {
    GameObject.call(this, null, true, repr, animation);
}

function Void(repr, animation) {
    GameObject.call(this, null, false, repr, animation);
    this.can_pass = function(entity) {
        return entity.has_status("flying");
    }
}

var move_function = function (args) {
    // [0,0] is wait
    if(args.movement[0] == 0 && args.movement[1] == 0) {
        return this.move_delay;
    }
    // args : movement, map, move_others

    // move_others means it also moves the other non-flying entities at the same position
    var new_pos = [];
    for (var i = 0; i < args.movement.length; i++) {
        new_pos.push(args.movement[i] + this.position[i]);
    }

    var collided = check_collisions(args.map, new_pos, this);
    var move_delay = (!collided || collided.can_pass(this)) && args.map.grid[new_pos[0]][new_pos[1]] ? this.move_delay : null;
    var interaction_delay = collided && collided.default_interaction ? collided.default_interaction(this) : null;

    if (move_delay) {
        // If this thing moves other to, we set them their new pos.
        if (args.move_others) {
            args.map.get_entities_at_position(this.position).forEach(function(entity) {
                entity.position = new_pos;
            });
        }
        // also moves the thing
        this.position = new_pos;
        //
        this.animation = get_entities_at_position(new_pos);
    }

    return move_delay || interaction_delay;
}
// prop is a thing that has infinite health and a default interaction and optionally an action selection function
function Prop(position, collision, default_interaction, repr, animation, name, action_function) {
    GameObject.call(this, position, collision, repr, animation);
    this.default_interaction = default_interaction;
    this.name = name;
    this.move_delay = 10;
    this.get_next_action = action_function ? action_function : function(args){return 100000000};
    this.health = Infinity;
}

function Actor(position, health, repr, name, animation) {
    // Actor has collision and default interaction
    GameObject.call(this, position, true, repr, animation);
    this.health = health;
    this.move_delay = 10;
    this.name = name;
    this.persistent_memory = false;
    this.move = move_function;
    this.use_ability = function(args) {
        var ability = make_ability(args);
        return ability.apply(args);
    }
    this.say = function (args) {
        game.message_log.push(args["message"]);
        return this.move_delay;
    }
}

function NPC(position, health, repr, name, animation, get_next_action) {
    Actor.call(this, position, health, repr, name, animation);
    this.move_delay = 10;
    this.get_next_action = get_next_action !== undefined ? get_next_action : function() {
        if(!check_collisions(game.current_map, [1+this.position[0],0+this.position[1]], this)) {
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
    game.message_log.push(attacker.name + " attacks " +attacked.name + " for " + damage);
    // TODO: change by attack delay
    return attacker.move_delay
}