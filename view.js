function view() {
    var map_width = 60;
    var map_height = 30;
    var map_x_offset = 2;
    var map_y_offset = 2
    //vue
    var status_colors = new Rainbow();
    status_colors.setSpectrum("red", "yellow", "green");

    function print_logs() {
        for (var i = message_log.length - 1; i >= message_log.length - 5; i--) {

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
        width: 15,
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
