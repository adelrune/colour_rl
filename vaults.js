//Thanks to dcss for the vaults concept

// A vault consists of terrain that is shortcoded in only ascii (may need a theme system for coloring/tiling different levels)
// a spawner function that dictates what entities are immediately present at vault generation
// and an item layer ?
intro_vaults = {

    "map":[
        ['+—————————————+']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|......✶......|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['|.............|']
        ['+—————————————+']

    ]
}

tile_correspondance = {
    // magic portal, should probably be something else.

    transformation = "✶✸✷✹✺";
    frames = []

    '✶': function portal() {
        var animation = new Animation([repr('✶'), repr('✸'), ], true);
        var portal = new Floor(repr('✶'), )
    },


}

function get_tile_from_shorthand(symbol) {
    return tile_correspondance[symbol]();
}

// this is the mapping from a simple character to a

