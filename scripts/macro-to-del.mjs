const entityMacros = {};
const collection = new Collection();

let _ready = false;
let unready = [];

function addEntityMacro(entity, macroID) {
    const macro = game.macros.get(macroID);
    if(macro === null) {
        console.err(`Macro with ID "${macroID}" not found for entity "${entity}"`);
        return;
    }
    if(macro.data.type !== 'script') {
        console.err('Argument "macro" must be a Script Macro');
        return;
    }

    entityMacros[entity] = macro;
    CONST.ENTITY_LINK_TYPES.push(entity);
    CONFIG[name] = {
        entityClass: Macro,
        collection: Macro,
        sidebarIcon: 'fas fa-play',
    };

    if(_ready) {
        registerEntityMacro(entity);
    } else {
        unready.push(entity);
    }
};

function removeEntityMacro(entity) {
    delete entityMacros[entity];
    const index = CONST.ENTITY_LINK_TYPES.indexOf(entity);
    CONST.ENTITY_LINK_TYPES.splice(index, 1);
    delete CONFIG[entity];
    $("body").off(
        'click',
        `a.entity-link[data-entity=${entity}]`,
    );
}

function callEntityMacro(entity, ev) {
    const macro = entityMacros[entity];

    if(macro === undefined) {
        console.err(`Unexpected entity "${entity}"`);
        return;
    }

    const speaker = ChatMessage.getSpeaker();
    const actor = game.actors.get(speaker.actor);
    const token = canvas.tokens.get(speaker.token);
    const character = game.user.character;
    const args = [ev];
    
    try {
      eval(command);
    } catch (err) {
      ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
      console.error(err);
    }
}

function registerEntityMacro(entity) {
    $('body').on(
        'click',
        `a.entity-link[data-entity=${entity}]`,
        function (ev) {
            event.preventDefault();
            event.stopPropagation();
            callEntityMacro(entity, ev)
            return false;
        }
    );
}

function onChange(value) {
    const entities = JSON.parse(
        game.settings.get('macro-to-del', 'macro-entities')
    );

    Object.entries(value).forEach((entry) => {
        const [entity, macro] = entry;
        addEntityMacro(entity, macro);
    });
}

Hooks.once('init', () => {
    game.settings.register("macro-to-del", "macro-entities", {
        name: "Macros",
        hint: "Map of Macro Name to Entity",
        scope: "world",
        config: true,
        default: "{}",
        onChange: onChange
    });
    onChange(game.settings.get('macro-to-del', 'macro-entities'));
});

Hooks.once('ready', () => {
    _ready = true;
    unready.forEach((entity) => {
        registerEntityMacro(entity);
    });
});

