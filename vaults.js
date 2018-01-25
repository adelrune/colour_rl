//Thanks to dcss for the vaults concept

// A vault consists of terrain/entities that are shortcoded in only ascii (may need a theme system for coloring/tiling different levels)
// a spawner function that dictates what additional entities are immediately present at vault generation (for when
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
    '✶': function portal() {
        var animation = create_transition_animation("✶✸✷✹✺", 3, [[255,0,0], [0,255,0], [0,0,255]], [[0,0,0]], true, true);
        var portal = new Floor(repr('✶'), animation);
        // TODO: add the actual teleportation mechanics of the portal
    }
}

function get_tile_from_shorthand(symbol) {
    return tile_correspondance[symbol]();
}

// this is the mapping from a simple character to a

