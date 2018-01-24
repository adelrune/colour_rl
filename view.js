function view() {
    var camera_size = [30,30];
    // number of screen square dedicated to black borders
    var screen_offset = [2,2];
    // current top-left corner of the camera
    var camera_corner = [0,0];
    var status_colors = new Rainbow();
    status_colors.setSpectrum("red", "yellow", "green");
    var log_len = 12;
    var log_start_pos = 21;
    var max_message_len = 20;
    var menu_size = [55,25];
    // size of the border of the menu
    var menu_border = [1,1];

    // This prevents getting player actions from keys while an animation is not done yet
    var animation_lock = false;
    // ID of the last displayed menu.
    var displayed_menu = -1;


    function print_logs() {
        var line_skips = 0;
        // we want to paint the first message white and the other grey.
        var first = true;
        for (var i = 0; i + line_skips < log_len; i++) {
            if (game.message_log[game.message_log.length - i]) {
                var colour = first ? [255,255,255] : [170,170,170];
                // floor since we already ++ it whatever the len
                var message = "%c{" + rgb_to_hex(colour) + "}" + game.message_log[game.message_log.length - i];

                var msg_line_len = Math.floor(message.length / max_message_len);
                // If we don't have enough lines, we simply don't display the message.
                // Could be problematic for very long messages
                if (msg_line_len + i + line_skips < log_len) {
                    sidebar_display.drawText(0, log_start_pos - i - msg_line_len - line_skips, message, max_message_len);
                }
                first = false;
                // rotjs does some fancy line breaking, this insures that it does not break.
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

    function draw_menu_content(menu) {
        // clears the line.
        for (var i=0; i < menu_size[0] - menu_border[0] * 2 ; i++) {
            for (var j=0; j < menu_size[1] - menu_border[1] * 2 ; j++) {
                menu_display.draw(menu_border[0] + i, menu_border[1] + j, "","#FFFFFF",rgb_to_hex([35,35,35]));
            }
        }
        // This function displays in hardcoded limits right now, should change it for more dynamic behavior
        menu_display.drawText(menu_border[0] + 1, menu_border[1] + 1, "%b{"+rgb_to_hex([35,35,35])+"}"+"%c{#FFFFFF}" + menu.title);
        for (var i = 0; i < menu.options.length; i++) {
            selected_colour = menu.selection === i ? rgb_to_hex([76,76,34]) : rgb_to_hex([35,35,35]);
            // text is the options letter + the options name
            text = "%b{" + selected_colour + "}" + String.fromCharCode(i+97) + ") " + menu.options[i].text + "%b{}";
            menu_display.drawText(menu_border[0] + 1, menu_border[1] + 3 + i, text);
        }
        menu_display.drawText(menu_border[0] + 1, menu_border[1] + 4 + i, "%b{"+rgb_to_hex([35,35,35])+"}" + menu.options[menu.selection].description);
    }

    function display_menus() {
        if (game.menu_stack.length > 0) {
            draw_menu_content(game.menu_stack[game.menu_stack.length-1]);
            menu_element.style.zIndex = 1;
            return;
        }
        menu_element.style.zIndex = -1;
    }
    function draw_game_object(entity, x, y) {
        repr = entity.next_repr();
        if (repr === null) {
            return;
        }
        if (repr.memory) {
            repr.colour = divide_colours(repr.colour, [2,2,2]);
            repr.bg = divide_colours(repr.bg, [2,2,2]);
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

        display_menus();

        sidebar_display.clear();
        sidebar_display.drawText(0, 3, "health");
        sidebar_display.draw(3 ,4,'❤', "#"+status_colors.colourAt(game.player.health));
        print_logs();
    }

    bind_keys = function() {
        // up, down, left, right
        var keys_to_movement = {"38":[0, -1],"40":[0, 1], "37":[-1, 0], "39":[1, 0]};
        function menu_mode_keys(e) {
            if (keys_to_movement[""+e.keyCode] !== undefined) {
                game.next_action = {name:"move_menu", args:{"direction": keys_to_movement[""+e.keyCode][1]}}
            }
            if (e.keyCode === 13) {
                game.next_action = {name:"select"}
            }
            // 'a' to 'z' maybe change to 'a' to 'Z' eventually
            if (e.charCode >= 97 && e.charCode <= 122) {
                game.next_action = {name:"menu_char_select", args:{"char":String.fromCharCode(e.charCode)}}
            }
        }
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
                game.next_action = {name:"select"}
            }
        }
        var mode_bindings = [game_mode_keys, selection_mode_keys, menu_mode_keys];
        $("body").keydown(function(e) {
            mode_bindings[game.current_mode](e);
        });
    }

    var init = function() {
        var map_container = map_display.getContainer();
        map_container.classList.add("map-display");
        document.body.appendChild(map_container);
        var sidebar_container = sidebar_display.getContainer();
        sidebar_container.classList.add("sidebar-display");
        document.body.appendChild(sidebar_container);
        var menu_container = menu_display.getContainer();
        menu_container.classList.add("menu-display");
        document.body.appendChild(menu_container);
        bind_keys();
    }


    var map_options = {
        width: camera_size[0] + screen_offset[0] + 2,
        height: camera_size[1] + screen_offset[1] + 2,
        fontSize: 14,
        forceSquareRatio:true,
    }
    var map_display = new ROT.Display(map_options);

    var menu_options = {
        width: menu_size[0] + menu_border[0],
        height: menu_size[1] + menu_border[1],
        fontSize: 14,
        forceSquareRatio:false,
    }
    var menu_display = new ROT.Display(menu_options);
    var menu_element = menu_display.getContainer();
    menu_element.style.position = "absolute";
    menu_element.style.top = "27px";
    menu_element.style.left = "27px";
    menu_element.style.zIndex = "-1";
    // draw the borders
    for (var i = 0; i < menu_size[0]; i++) {
        for (var j = 0; j < menu_size[1]; j++) {
            if (i < menu_border[0] || i >= menu_size[0] - menu_border[0] ||
                j < menu_border[1] || j >= menu_size[1] - menu_border[1]) {
                menu_display.draw(i,j,"o", "#999999","#999999");
            }
        }
    }

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
