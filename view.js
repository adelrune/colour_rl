function view() {
    var camera_size = [30,30];
    var screen_offset = [2,2];
    var camera_corner = [0,0];
    //vue
    var status_colors = new Rainbow();
    status_colors.setSpectrum("red", "yellow", "green");
    var log_len = 6;
    var log_start_pos = 15;
    var max_message_len = 20;
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
        var pos = [];
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
    update_display = function () {
        camera_corner = get_camera_top_left_corner();
        for (var i = camera_corner[0]; i < camera_corner[0] + camera_size[0]; i++) {
            for (var j = camera_corner[1]; j < camera_corner[1] + camera_size[1]; j++) {
                map_display.draw(
                    i - camera_corner[0] + screen_offset[0],
                    j - camera_corner[1] + screen_offset[1],
                    game.current_map.grid[i][j].symbol
                );
            }
        }
        for (var i = 0; i < game.current_map.entities.length; i++) {
            if (position_in_view(game.current_map.entities[i].position)) {
                map_display.draw(
                    game.current_map.entities[i].position[0] - camera_corner[0] + screen_offset[0],
                    game.current_map.entities[i].position[1] - camera_corner[1] + screen_offset[1],
                    game.current_map.entities[i].symbol
                );
            }
        }

        sidebar_display.clear();

        sidebar_display.drawText(0, 3, "health");
        sidebar_display.draw(3 ,4,'❤', "#"+status_colors.colourAt(game.player.health));

        print_logs();

    }

    bind_keys = function() {
        // up, down, left, right
        var keys_to_movement = {"38":[0, -1],"40":[0, 1], "37":[-1, 0], "39":[1, 0]};

        $("body").keydown(function(e) {
            if(!game.waiting_for_player) {
                return
            }
            if (keys_to_movement[""+e.keyCode] !== undefined) {
                game.next_player_action = {name:"move", args:{"map":game.current_map, "movement": keys_to_movement[""+e.keyCode]}}
            }
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
