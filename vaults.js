// Thanks to dcss for the vaults concept

// A vault consists of terrain/entities that are shortcoded in only ascii (may need a theme system for coloring/tiling different levels)
// a spawner function that dictates what additional entities are immediately present at vault generation (for when
// and an item layer ?
intro_vaults = [{
    "map":[
        ['+—————————————+']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|······✶······|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['|·············|']
        ['+—————————————+']
    ]
}];

// this is the mapping from a simple character to an object {'terrain':terrain, 'entity':entity}.
tile_correspondance = {
    // magic portal, should probably be something else.
    '✶': function portal(position) {
        var animation = create_transition_animation("✶✸✷✹✺", 3, [[255,0,0], [0,255,0], [0,0,255]], [[0,0,0]], true, true);
        var portal = new Prop(position, false, function(entity){console.log("telepooooort")}, repr('✶'), animation);
        return {"terrain":new Floor("·"), "entity" : portal};
        // TODO: add the actual teleportation mechanics of the portal
    }
}

// This function returns the objects genrated by the map shorthand
function get_objects_from_shorthand(symbol, position) {
    return tile_correspondance[symbol](position);
}
