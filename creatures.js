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
            var h_r = new NPC(position, 300, make_repr("R"), "Head Runist", undefined, next_action);
            h_r.list_of_sentences = ["Today is a great day for <INSERT_NAME_HERE>", "Step through the portal to begin the trial"]
            h_r.sentence_index = 0;
            h_r.move_delay = 20;
            return h_r;
        }
    },
    '⤊' : {
        'moving_platform' : function(position) {
            var next_action = function(args) {
                if (!this.has_status("active")) {
                    return this.move_delay;
                }
                // only moves over voids... Should have a better way to handle this.
                if (game.current_map.grid[this.position[0]][this.position[1] + this.direction].repr.symbol != ' ') {
                    this.master.remove_status("active");
                    // changes status for all the linked platforms.
                    for (var i = 0; i < this.master.linked_entities.length; i++) {
                        var that = this.master.linked_entities[i]
                        that.repr.symbol = that.direction == 1 ? '↑' : '↓';
                        that.direction = -that.direction;
                    }
                    this.master.repr.symbol = that.direction == 1 ? '↑' : '↓';
                    this.master.direction = -that.direction;

                    return this.move_delay;
                }

                if (!check_collisions(game.current_map, [this.position[0],this.position[1] + this.direction], this)) {
                    return this.move({"map":game.current_map, movement:[0, this.direction], move_others:true});
                } else {
                    return this.move_delay;
                }
            }
            var default_interaction = function(entity) {
                this.master.add_status("active");
                game.message_log.push("The platform starts moving.");
                return entity.move_delay;
            }
            var m_m_p = new Prop(position, false, default_interaction, make_repr('↑'), undefined, "moving platform", next_action);
            var l_p = new Prop([position[0]+1, position[1]], false, default_interaction, make_repr('↑'), undefined, "moving platform", next_action);
            var r_p = new Prop([position[0]-1, position[1]], false, default_interaction, make_repr('↑'), undefined, "moving platform", next_action);
            l_p.master = m_m_p;
            r_p.master = m_m_p;
            m_m_p.linked_entities = [l_p, r_p];
            m_m_p.add_status("flying")
            m_m_p.move = move_function;
            l_p.move = move_function;
            r_p.move = move_function;
            m_m_p.direction = -1;
            l_p.direction = -1;
            r_p.direction = -1;
            return m_m_p;
        }
    }
}
