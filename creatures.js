var entities = {
    'R': {
        'head_runist': function(position) {
            var next_action = function() {

                if (this.sentence_index < this.list_of_sentences.length) {
                    var delay = this.say({"message":this.list_of_sentences[this.sentence_index]});
                    this.sentence_index +=1;
                    return delay;
                }
                return this.move_delay;
            }
            var h_r = new NPC(position, 300, repr("R"), "Head Runist", undefined, next_action);
            h_r.list_of_sentences = ["Today is a great day for <INSERT_NAME_HERE>", "Step through the portal to begin the trial"]
            h_r.sentence_index = 0;
            h_r.move_delay = 20;
            return h_r;
        }
    },
    '↑' : {
        'moving_platform' : function(position) {
            var next_action = function(args) {
                if (!this.has_status("active")) {
                    return this.move_delay;
                }
                // only moves over voids... Should have a better way to handle this.
                if (game.current_map.grid[this.position[0]][this.position[1] + this.direction].repr.symbol != ' ') {
                    this.remove_status("active");
                    this.repr.symbol = this.direction == 1 ? '↑' : '↓';
                    this.direction = -this.direction;
                    return this.move_delay;
                }

                if (!check_collisions(game.current_map, [this.position[0],this.position[1] + this.direction], this)) {
                    return this.move({"map":game.current_map, movement:[0, this.direction], move_others:true});
                } else {
                    return this.move_delay;
                }
            }
            var default_interaction = function(entity) {
                this.add_status("active");
                game.message_log.push("The platform starts moving.");
                return entity.move_delay;
            }
            var m_p = new Prop(position, false, default_interaction, repr('↑'), undefined, "moving platform", next_action)
            m_p.add_status("flying")
            m_p.move = move_function;
            m_p.direction = -1;
            console.log(m_p);
            return m_p;
        }
    }
}
