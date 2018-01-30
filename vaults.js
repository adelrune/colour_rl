// Thanks to dcss for the vaults concept

// A vault consists of terrain/entities that are shortcoded in only ascii (may need a theme system for coloring/tiling different levels)
// a spawner function that dictates what additional entities are immediately present at vault generation (for when
// and an item layer ?
var intro_vaults = [{
    "map":[
        '+—————————————+',
        '|·············|',
        '|·············|',
        '|·············|',
        '|·············|',
        '|···ý··ý··ý···|',
        '|·············|',
        '|···ý·ߚ✶ߚ·ý···|',
        '|······~······|',
        '|······~······|',
        '|···ý··~··ý···|',
        '|······~······|',
        '|······~······|',
        '|······~······|',
        '|······~······|',
        '|···ý··~··ý···|',
        '|······~······|',
        '|······~······|',
        '|······~······|',
        '|······~······|',
        '|······~······|',
        '|···ý··~··ý···|',
        '|······~······|',
        '|······~······|',
    ]
}];

// short function for the walls and floors.
function wall(symbol, animation) {
    return function() {
        return {"terrain":new Wall(symbol, animation)};
    }
}

function floor(symbol, animation) {
    return function() {
        return {"terrain":new Floor(symbol, animation)};
    }
}

// this is the mapping from a simple character to an object {'terrain':terrain, 'entity':entity}.
var tile_mapping = {
    // magic portal, should probably be something else.
    '✶': function portal(position) {
        // TODO: add the actual teleportation mechanics of the portal
        var portal = new Prop(position, false, function(entity){console.log("telepooooort")}, repr('✶'), synced_animations['✶']);
        return {"terrain":new Floor("·"), "entity" : portal};
    },
    '·': floor('·'),
    '—': wall('—'),
    '+': wall('+'),
    '|': wall('|'),
    'ߚ': wall('ߚ', synced_animations['ߚ']),
    'ý': wall('ý', synced_animations['ý']),
    '~': floor('~')

}

// If the animations needs to be shared, they can be preinstanciated here.
var synced_animations = {
    '✶': create_transition_animation("✶✸✷✹✺", 10, [[255,0,255], [255,255,0], [0,255,0], [0,255,255], [0,0,255]].reverse(), [[35,35,35], [0,0,170], [45,45,255]], true, true),
    'ߚ': create_transition_animation("ߚߚߚߚߚ", 10, [[255,255,255],[255,255,255]], [[35,35,35], [0,0,170], [45,45,255]], true, true),
    'ý': create_transition_animation("ýýýýý", 10, [[255,255,255],[255,255,255]], [[35,35,35], [0,0,170], [45,45,255]], true, true)
}

// This function returns the objects genrated by the map shorthand
function get_objects_from_shorthand(symbol, position) {
    return tile_mapping[symbol](position);
}
