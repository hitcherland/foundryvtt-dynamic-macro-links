const entityMacros = {};
const collection = new Collection();

class EntityMacro {
    constructor(opt={}) {
        let {
            entity,
            macro:macroID
        } = opt;
        this.entity = entity;
        this.macroID = macroID;
        this.macro = game.macros.get(macroID);

        collection.set(entity, macro);
    }
}


function addEntityMacro(entity, macro) {
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
};

function removeEntityMacro(entity) {
    delete entityMacros[entity];
    const index = CONST.ENTITY_LINK_TYPES.indexOf(entity);
    CONST.ENTITY_LINK_TYPES.splice(index, 1);
    delete CONFIG[entity];
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

function registerEntityMacros() {
    let body = $('body');
    Object.keys(entityMacros).forEach(entity => {
        body.on(
            'click',
            `a.entity-link[data-entity=${entity}]`,
            function (ev) {
                event.preventDefault();
                event.stopPropagation();
                callEntityMacro(entity, ev)
                return false;
            }
        );
    });
}

Hooks.once('init', () => {
    game.settings.register("macro-to-del", "macro-entities", {
        name: "macroToDEL.Settings.Macros",
        hint: "macroToDEL.Settings.MacrosHint",
        scope: "world",
        config: true,
        default: {},
    });

    const entities = game.settings.get('macro-to-del', 'macro-entities');

    Object.entries(entities).forEach(function(entry) {
        const [entity, macro] = entry;
        addEntityMacro(entity, macro);
    });
});

Hooks.once('ready', () => {
    registerEntityMacros();
});

