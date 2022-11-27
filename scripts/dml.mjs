function removeFromArray(array, value) {
    const index = array.indexOf(value);
    if(index >= 0) {
        array.splice(index, 1);
        return true;
    }
    return false;
}

class DynamicMacroLink extends Entity {
    static get config() {
        return {
            baseEntity: DynamicMacroLink,
            embeddedEntities: {},
            label: `Entity.DynamicMacroLink`,
            collection: collection,
        };
    }

    get entity() {
        return this.data.entity;
    }

    get macro() {
        const parts = this.macroId.split('.');
        if(parts.length === 1) {
            return game.macros.get(this.macroId);
        } else {
            const [module, key, entityId] = parts;
            return game.packs.get(`${module}.${key}`).getEntity(entityId)
        }
    }

    async getMacro() {
        return await this.macro;
    }

    get macroId() {
        return this.data.macroId;
    }

    get sheet() {
        return {
            render: () => {}
        }
    }

    static updateDML(data) {
        DynamicMacroLink.collection.forEach(function(d) {
            DynamicMacroLink.collection.delete(d.entity);
        });

        DynamicMacroLink.collection.clear();

        data.forEach(function({entity, macroId}) {
            const dml = new DynamicMacroLink({
                entity,
                macroId,
            });
            DynamicMacroLink.collection.set(entity, dml);
        });
    }

    _activate() {
        $('body').on(
            'click',
            `a.entity-link[data-entity=${this.entity}]`,
            function (ev) {
                ev.preventDefault();
                ev.stopPropagation();        
                const target = ev.currentTarget;
                const args = target.dataset.id.split(';');
                this.execute(args);
                return false;
            }.bind(this)
        );
    }

    execute(args) {
        const macro = this.macro;

        function handleMacro(macro) {
            try {
                eval(macro.data.command);
            } catch (err) {
                ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
                console.error(err);
            }
        }

        if(macro instanceof Promise) {
            macro.then(handleMacro);
        } else {
            handleMacro(macro);
        }
    }
}

class DynamicMacroLinkCollection extends Collection {
    get(id) {
        let entry = super.get(id);
        if(entry === null) {
            entry = new DynamicMacroLink({
                _id: id,
            });
        }
        return entry;
    }

    getName(name) {
        let entry = super.getName(name);
        if(entry === null) {
            entry = new DynamicMacroLink({
                _id: name,
            });
        }
        return entry;
    }

    set(name, value) {
        const prev = super.get(name);
        if(prev !== null) {
            this.delete(name);
        }

        const entity = value.entity;

        if(CONST.ENTITY_LINK_TYPES.indexOf(entity) >= 0 || CONST.ENTITY_TYPES.indexOf(entity) >= 0) {
            console.error(`Entity with name "${name}" already exists, cannot use for DML`);
            return;
        }

        CONST.ENTITY_LINK_TYPES.push(entity);
        CONST.ENTITY_TYPES.push(entity);
        CONFIG[entity] = {
            entityClass: DynamicMacroLink,
            collection: DynamicMacroLink.collection,
            sidebarIcon: 'fas fa-play',
        };

        
        if(_ready) {
            value._activate();
        }

        super.set(name, value);
    }

    delete(name) {
        const prev = super.get(name);
        if(prev !== null) {
            delete CONFIG[name];
            removeFromArray(CONST.ENTITY_LINK_TYPES, name);
            removeFromArray(CONST.ENTITY_TYPES, name);

            $("body").off(
                'click',
                `a.entity-link[data-entity=${name}]`,
            );
        }
        super.delete(name);
    }
}

const collection = new DynamicMacroLinkCollection();
let _ready = false;

function onReady() {
    _ready = true;
    DynamicMacroLink.collection.forEach((dml) => {
        dml._activate();
    });
}

export default DynamicMacroLink;
export {
    DynamicMacroLink,
    onReady
}
