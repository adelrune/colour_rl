// colour helpers (thx stackoverflow)
function comp_to_hex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgb_to_hex(rgb) {
    // no colour means black
    if(rgb === undefined) {
        return "#000000";
    }
    return "#" + comp_to_hex(rgb[0]) + comp_to_hex(rgb[1]) + comp_to_hex(rgb[2]);
}

function hex_to_rgb(hex) {
    hex = hex.replace("#", "");
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r,g,b];
}

function add_colours(col1, col2) {
    var col = [];
    for (var i=0; i<3; i++) {
        col[i] = col1[i] + col2[i];
        col[i] = col[i] < 0 ? 0 : col[i];
        col[i] = col[i] > 255 ? 255 : col[i];
    }
    return col;
}

function view() {
    var camera_size = [30,30];
    var screen_offset = [2,2];
    var camera_corner = [0,0];
    var status_colors = new Rainbow();
    status_colors.setSpectrum("red", "yellow", "green");
    var log_len = 12;
    var log_start_pos = 21;
    var max_message_len = 20;
    // This prevents getting player actions from keys while an animation is not done yet
    var animation_lock = false;

    function print_logs() {
        var line_skips = 0;
        for (var i = 0; i + line_skips < log_len; i++) {
            if (message_log[message_log.length - i]) {
                // floor since we already ++ it whatever the len
                var message = message_log[message_log.length - i];

                var msg_line_len = Math.floor(message.length / max_message_len);
                // If we don't have enough lines, we simply don't display the message.
                // Could be problematic for very long messages
                if (msg_line_len + i + line_skips < log_len) {
                    sidebar_display.drawText(0, log_start_pos - i - msg_line_len - line_skips, message, 20);
                }

                line_skips += msg_line_len;
            }
        }
    }
    function position_in_view(position) {
        var in_view = true;
        for (var i = 0; i < 2; i++) {
            // is it in view for the other dimensions and is it inside the bounds of the camera.
            in_view = in_view && (position[i] >= camera_corner[i] && position[i] < camera_corner[i] + camera_size[i]);
        }
        return in_view;
    }
    function get_camera_top_left_corner() {
        var pos = [];
        for (var i = 0; i < 2; i++) {
            pos[i] = Math.floor(game.focus.position[i] - (camera_size[i] / 2));
            // if the corner gets out of the map, we bring it back.
            if (pos[i] + camera_size[i] > game.current_map.dimensions[i]) {
                pos[i] = game.current_map.dimensions[i] - camera_size[i];
            }
            // if its negative, we bring it to 0.
            if (pos[i] < 0) {
                pos[i] = 0;
            }
        }
        return pos;
    }

    function draw_game_object(entity, x, y) {
        var repr = {"symbol":"", "colour":"#FFFFFF"};
        if (entity.visible) {
            repr = entity.next_repr();
        } else if (entity.remembered_as != null) {
            repr.symbol = entity.remembered_as.symbol;
            repr.colour = add_colours(entity.remembered_as.colour, [-150,-150,-150]);
        } else if (entity.remembered_as == null) {
            // Do nothing if its not remembered and its not visible.
            return
        }
        map_display.draw(x, y, repr["symbol"], rgb_to_hex(repr.colour), rgb_to_hex(repr.bg));
    }

    function draw_particle(particle, x, y) {
        //console.log(particle);
        var repr = particle.next();
        var x = particle.position[0] - camera_corner[0] + screen_offset[0];
        var y = particle.position[1] - camera_corner[1] + screen_offset[1];
        // if we can see the tile, draw the animation
        if (game.current_map.get_entity_square(particle).visible && position_in_view(particle.position)) {
            map_display.draw(x, y, repr["symbol"], rgb_to_hex(repr.colour), rgb_to_hex(repr.bg));
        }
    }

    function play_particles() {
        for (var i = 0; i < game.current_map.particles.length; i++) {
            draw_particle(game.current_map.particles[i]);
        }
        game.current_map.particles = game.current_map.particles.filter(function(particle){return !particle.finished});
        // When this func is entered, length > 0, if it falls to 0 we unlock the animation lock.
        if (game.current_map.particles.length === 0) {
            animation_lock = false;
        }
    }

    update_display = function () {

        camera_corner = get_camera_top_left_corner();
        // map tiles
        for (var i = camera_corner[0]; i < camera_corner[0] + camera_size[0]; i++) {
            for (var j = camera_corner[1]; j < camera_corner[1] + camera_size[1]; j++) {
                // resets dislay
                map_display.draw(
                    i - camera_corner[0] + screen_offset[0],
                    j - camera_corner[1] + screen_offset[1],
                    ""
                );
                draw_game_object(
                    game.current_map.grid[i][j],
                    i - camera_corner[0] + screen_offset[0],
                    j - camera_corner[1] + screen_offset[1]
                );
            }
        }
        // anything else on the map
        for (var i = 0; i < game.current_map.entities.length; i++) {
            if (position_in_view(game.current_map.entities[i].position)) {
                draw_game_object(
                    game.current_map.entities[i],
                    game.current_map.entities[i].position[0] - camera_corner[0] + screen_offset[0],
                    game.current_map.entities[i].position[1] - camera_corner[1] + screen_offset[1]
                );
            }
        }
        // if we have particles to play, we lock the controls and play them. This will be entered multiple times until the list is empty
        if (game.current_map.particles.length > 0) {
            animation_lock = true;
            play_particles();
        }
        sidebar_display.clear();
        sidebar_display.drawText(0, 3, "health");
        sidebar_display.draw(3 ,4,'❤', "#"+status_colors.colourAt(game.player.health));
        print_logs();
    }

    bind_keys = function() {
        // up, down, left, right
        var keys_to_movement = {"38":[0, -1],"40":[0, 1], "37":[-1, 0], "39":[1, 0]};

        function game_mode_keys(e) {
            if(!game.waiting_for_player || animation_lock) {
                return
            }
            if (keys_to_movement[""+e.keyCode] !== undefined) {
                game.next_action = {name:"move", args:{"map":game.current_map, "movement": keys_to_movement[""+e.keyCode]}}
            }
            if (e.keyCode === 90) {
                game.next_action = {name:"use_ability", args:{"map":game.current_map, "position": game.player.position}}
            }
        }
        function selection_mode_keys(e) {
            if (keys_to_movement[""+e.keyCode] !== undefined) {
                game.next_action = {name:"move_focus", args:{"movement": keys_to_movement[""+e.keyCode]}}
            }
            if (e.keyCode === 13) {
                game.next_action = {name:"select", args:{}}
            }
        }
        var mode_bindings = [game_mode_keys, selection_mode_keys];
        $("body").keydown(function(e) {
            mode_bindings[game.current_mode](e);
        });
    }

    var init = function() {
        document.body.appendChild(map_display.getContainer());
        document.body.appendChild(sidebar_display.getContainer());
        bind_keys();
    }


    var map_options = {
        width: camera_size[0] + screen_offset[0] + 2,
        height: camera_size[1] + screen_offset[1] + 2,
        fontSize: 14,
        forceSquareRatio:true,
    }
    var map_display = new ROT.Display(map_options);

    var sidebar_options = {
        width: 22,
        height: camera_size[1] + screen_offset[1] + 2,
        fontSize: 14,
        forceSquareRatio:false,
    }

    var sidebar_display = new ROT.Display(sidebar_options);

    update_display();
    init();
}

$(document).ready(function() {
    view();
});
