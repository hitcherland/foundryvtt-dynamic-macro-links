const entityMacros = {};

let _ready = false;
let unready = [];

class DynamicMacroLinkEntity extends Entity {
    static get config() {
        return {
            baseEntity: DynamicMacroLinkEntity,
            embeddedEntities: {},
            label: `Entity.DynamicMacroLink`,
            collection: pseudoCollection,
        };
    }

    get sheet() {
        return {
            render: () => {}
        }
    }
}

class PseudoCollection {
    get(id) {
        return new DynamicMacroLinkEntity({
            'name': entity,
            _id: id,
        });
    }

    getName(id) { return this.get(id); }
}

const pseudoCollection = new PseudoCollection();


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

    entityMacros[entity] = macro;
    CONST.ENTITY_LINK_TYPES.push(entity);
    CONST.ENTITY_TYPES.push(entity);
    CONFIG[entity] = {
        entityClass: DynamicMacroLinkEntity,
        collection: pseudoCollection,
        sidebarIcon: 'fas fa-play',
    };

    if(_ready) {
        registerEntityMacro(entity);
    } else {
        unready.push(entity);
    }
}

function removeEntityMacro(entity) {
    delete entityMacros[entity];
    delete CONFIG[entity];

    const link_index = CONST.ENTITY_LINK_TYPES.indexOf(entity);
    if(link_index >= 0)
        CONST.ENTITY_LINK_TYPES.splice(link_index, 1);
    const index = CONST.ENTITY_TYPES.indexOf(entity);

    if(index >= 0)
        CONST.ENTITY_TYPES.splice(index, 1);

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

function update(value) {
    const entities = JSON.parse(value);

    Object.keys(entityMacros).forEach((entity) => {
        removeEntityMacro(entity);
    });

    Object.entries(entities).forEach((entry) => {
        const [entity, macro] = entry;
        addEntityMacro(entity, macro);
    });
}

Hooks.once('init', () => {
    game.settings.register("dynamic-macro-links", "macro-entities", {
        name: "Macros",
        hint: "Map of Macro Name to Entity",
        scope: "world",
        config: true,
        default: "{}",
        onChange: update
    });
});

Hooks.once('ready', () => {
    _ready = true;
    unready.forEach((entity) => {
        registerEntityMacro(entity);
    });
    update(game.settings.get('dynamic-macro-links', 'macro-entities'));
});

