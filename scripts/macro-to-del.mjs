const entityMacros = {};

let _ready = false;
let unready = [];

function MacroProxyFactory(entity, macro) {
    class MacroProxy extends Entity {
        static get config() {
            return {
                baseEntity: MacroProxy,
                embeddedEntities: {},
                label: `Entity.${Entity}Proxy`,
                collection: pseudoCollection,
            };
        }

        get sheet() {
            return {
                render() {};
            }
        }
    }

    class PseudoCollection {
        get(id) {
            return new MacroProxy({
                'name': entity
            }, {
                id,
            });
        }

        getName(id) { return this.get(id); }
    }

    const pseudoCollection = new PseudoCollection();
    return [MacroProxy, pseudoCollection];
}


function addEntityMacro(entity, macroID) {
    const macro = game.macros.get(macroID);
    if(macro === null) {
        console.error(`Macro with ID "${macroID}" not found for entity "${entity}"`);
        return;
    }
    if(macro.data.type !== 'script') {
        console.error('Argument "macro" must be a Script Macro');
        return;
    }

    const [cls, collection] = MacroProxyFactory(macro);

    entityMacros[entity] = macro;
    CONST.ENTITY_LINK_TYPES.push(entity);
    CONST.ENTITY_TYPES.push(entity);
    CONFIG[entity] = {
        entityClass: cls,
        collection: collection,
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
    const link_index = CONST.ENTITY_LINK_TYPES.indexOf(entity);
    CONST.ENTITY_LINK_TYPES.splice(link_index, 1);
    const index = CONST.ENTITY_TYPES.indexOf(entity);
    CONST.ENTITY_TYPES.splice(index, 1);
    delete CONFIG[entity];
    $("body").off(
        'click',
        `a.entity-link[data-entity=${entity}]`,
    );
}

function callEntityMacro(entity, ev) {
    const macro = entityMacros[entity];

    if(macro === undefined) {
        console.error(`Unexpected entity "${entity}"`);
        return;
    }

    const speaker = ChatMessage.getSpeaker();
    const actor = game.actors.get(speaker.actor);
    const token = canvas.tokens.get(speaker.token);
    const character = game.user.character;
    const command = macro.data.command;
    const target = ev.currentTarget;
    const args = [target.dataset.id];
    
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
    const entities = JSON.parse(value);

    Object.entries(entities).forEach((entry) => {
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
});

Hooks.once('ready', () => {
    _ready = true;
    unready.forEach((entity) => {
        registerEntityMacro(entity);
    });
    onChange(game.settings.get('macro-to-del', 'macro-entities'));
});

