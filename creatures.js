creatures = {
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
    }
}