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
                if(!check_collisions(game.current_map, [0+this.position[0],1+this.position[1]])) {
                    return this.move({"map":game.current_map, movement:[0,1], move_others:true});
                } else {
                    return this.move_delay;
                }
            }
            var default_interaction = function(entity) {
                this.add_status("active");
                return entity.move_delay;
            }
            var m_p = new Prop(position, false, default_interaction, repr('↑'), undefined, "moving platform", next_action)
            m_p.move = move_function;
            console.log(m_p);
            return m_p;
        }
    }
}
