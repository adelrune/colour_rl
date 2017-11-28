function view() {
    var map_width = 60;
    var map_height = 30;
    var map_x_offset = 2;
    var map_y_offset = 2
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
                console.log(message + " " + (msg_line_len + i));
                if (msg_line_len + i + line_skips < log_len) {
                    sidebar_display.drawText(0, log_start_pos - i - msg_line_len - line_skips, message, 20);
                }

                line_skips += msg_line_len;
            }
        }
    }

    update_display = function () {
        for (var i = 0; i < game.current_map.grid.length; i++) {
            for (var j = 0; j < game.current_map.grid[i].length; j++) {
                map_display.draw(i+map_x_offset, j+map_y_offset, game.current_map.grid[i][j].symbol);
            }
        }
        for (var i = 0; i < game.current_map.entities.length; i++) {
            map_display.draw(game.current_map.entities[i].position[0]+map_x_offset, game.current_map.entities[i].position[1]+map_y_offset, game.current_map.entities[i].symbol);
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
        width: map_width + map_x_offset + 2,
        height: map_height + map_y_offset + 2,
        fontSize: 14,
        forceSquareRatio:true,
    }
    var map_display = new ROT.Display(map_options);

    var sidebar_options = {
        width: 22,
        height: map_height + map_y_offset + 2,
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
