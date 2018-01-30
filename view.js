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


    var first_message_colour = rgb_to_hex([255,255,255]);
    var message_colour = rgb_to_hex([170,170,170]);
    function print_logs() {
        var line_skips = 0;
        // we want to paint the first message white and the other grey.
        var first = true;
        for (var i = 0; i + line_skips < log_len; i++) {
            if (game.message_log[game.message_log.length - i]) {
                var colour = first ? first_message_colour : message_colour;
                // floor since we already ++ it whatever the len
                var message = "%c{" + (colour) + "}" + game.message_log[game.message_log.length - i];

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

    var menu_text_bg = rgb_to_hex([35,35,35]);
    var menu_selected_bg = rgb_to_hex([76,76,34]);
    function draw_menu_content(menu) {
        // clears the line.
        for (var i=0; i < menu_size[0] - menu_border[0] * 2 ; i++) {
            for (var j=0; j < menu_size[1] - menu_border[1] * 2 ; j++) {
                menu_display.draw(menu_border[0] + i, menu_border[1] + j, "","#FFFFFF",menu_text_bg);
            }
        }
        // This function displays in hardcoded limits right now, should change it for more dynamic behavior
        menu_display.drawText(menu_border[0] + 1, menu_border[1] + 1, "%b{"+menu_text_bg+"}"+"%c{#FFFFFF}" + menu.title);
        for (var i = 0; i < menu.options.length; i++) {
            selected_colour = menu.selection === i ? menu_selected_bg : menu_text_bg;
            // text is the options letter + the options name
            text = "%b{" + selected_colour + "}" + String.fromCharCode(i+97) + ") " + menu.options[i].text + "%b{}";
            menu_display.drawText(menu_border[0] + 1, menu_border[1] + 3 + i, text);
        }
        menu_display.drawText(menu_border[0] + 1, menu_border[1] + 4 + i, "%b{"+menu_text_bg+"}" + menu.options[menu.selection].description);
    }

    function display_menus() {
        if (game.menu_stack.length > 0) {
            draw_menu_content(game.menu_stack[game.menu_stack.length-1]);
            menu_element.style.zIndex = 1;
            return;
        }
        menu_element.style.zIndex = -1;
    }
    // This is called very often, better have a pre instanciated division than creating a new one everytime.
    var colour_div_factors = [2,2,2];
    // Pre instanciated selection bg colours.
    var selection_colours = []
    for (var i = 0; i < 10; i++) {
        selection_colours.push([100+i*24,100+i*24,100+i*24])
    }
    function draw_game_object(entity, x, y) {
        repr = entity.next_repr();
        if (repr === null) {
            return;
        }
        var colour = repr.colour;
        var bg = repr.bg;
        // sets the bg according to selection amount
        if (entity.selected) {
            bg = selection_colours[entity.selected - 1];
        }
        // if memory, fade the colour
        if (repr.memory) {
            colour = divide_colours(colour, colour_div_factors);
            bg = divide_colours(bg, colour_div_factors);
        }

        map_display.draw(x, y, repr["symbol"], rgb_to_hex(colour), rgb_to_hex(bg));
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
            // after the last one, we refresh the display one last time
            update_display(true);
        }
    }

    // This function is called a loooooot of times. The state changed notifies it that it should reprint everything
    // Otherwise it only refreshes the tiles with animations.
    update_display = function (state_changed) {

        camera_corner = get_camera_top_left_corner();
        // map tiles
        //console.log(state_changed);
        if (state_changed) {
            for (var i = camera_corner[0]; i < camera_corner[0] + camera_size[0]; i++) {
                for (var j = camera_corner[1]; j < camera_corner[1] + camera_size[1]; j++) {
                    // resets dislay
                    //map_display.clear()
                    // can be false if the map is smaller than the camera
                    if (game.current_map.grid[i] && game.current_map.grid[i][j]) {
                        draw_game_object(
                            game.current_map.grid[i][j],
                            i - camera_corner[0] + screen_offset[0],
                            j - camera_corner[1] + screen_offset[1]
                        );
                    }
                }
            }
        }
        // anything else on the map
        for (var i = 0; i < game.current_map.entities.length; i++) {
            if (position_in_view(game.current_map.entities[i].position) && (state_changed || game.current_map.entities[i].animation)) {
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

        if (state_changed) {
            display_menus();
            sidebar_display.clear();
            sidebar_display.drawText(0, 3, "health");
            sidebar_display.draw(3 ,4,'❤', "#"+status_colors.colourAt(game.player.health));
            print_logs();
        }
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

    update_display(true);
    init();
}

$(document).ready(function() {
    view();
});
