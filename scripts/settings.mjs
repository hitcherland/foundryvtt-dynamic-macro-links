import DynamicMacroLink from './dml.mjs';

const module_name = "dynamic-macro-links";

const default_dml = [{
    entity: "ActivateScene",
    macroId: "dynamic-macro-links.dml-macros.QEkDw8G6LHzENtt4"
}, {
    entity: "PlayPlaylist",
    macroId: "dynamic-macro-links.dml-macros.YOWUSenN4K2mM2LF"
}, {
    entity: "PlayOnlyPlaylist",
    macroId: "dynamic-macro-links.dml-macros.8YQe4mFPekNR4yGa"
}];

class DMLSettingsApplication extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/${module_name}/templates/DMLSettings.html`,
            resizable: true,
            classes: ["dml"],
            title: "DML Editor",
            closeOnSubmit: true,
            dragDrop: [{
                dragSelector: '.macro',
                dropSelector: '.dml-list',
            }]
        });
    }

    activateListeners(html) {
        super.activateListeners(html);        
        html.find('a.dml-remove').click(this._onDMLRemove.bind(this));
        html.find('button[data-type="cancel"]').click(() => {this.close({submit: false})});
        html.find('button[data-type="submit"]').click(this._onSubmit.bind(this));
    }

    _onDMLCreate({entity, macroId}) {
        if(this.object.changes === undefined) {
            this.object.changes = [];
        }

        this.object.changes.push({
            type: "add",
            entity,
            macroId,
        });
        
        this.render(true);
    }

    _onDMLRemove(ev) {
        const dmlItemElement = ev.currentTarget.parentElement;
        const index = parseInt(dmlItemElement.dataset.index);
        if(this.object.changes === undefined) {
            this.object.changes = [];
        }

        this.object.changes.push({
            type: "remove",
            index,
        });

        this.render(true);
    }

    async getData(options) {
        const current = await game.settings.get(module_name, "dml-pairs");
        const dmlItems = current.map(dml => {
            return new DynamicMacroLink({
                entity: dml.entity,
                macroId: dml.macroId
            })
        });

        const changes = this.object.changes || [];

        changes.forEach(({type, index, entity, macroId}) => {
            switch(type) {
                case "add":
                    dmlItems.push(new DynamicMacroLink({
                        entity,
                        macroId
                    }));
                    break;
                case "remove":
                    dmlItems.splice(index, 1);
                    break;
                case "modify":
                    if(entity !== undefined)
                        dmlItems[index].data.entity = entity;

                    if(macroId !== undefined)
                        dmlItems[index].data.macroID = macroId;
                    break;
                default:
                    break;
            }
        });

        const macros = await Promise.all(dmlItems.map(x => x.macro));
        const items = dmlItems.map((dml, i) => {
            return {
                entity: dml.entity,
                macroId: dml.macroId,
                macro: macros[i],
            };
        });

        return {
            dmlItems: items
        };
    }

    async _updateObject(ev, formData) {
        const data = await this.getData();
        const dmlItems = data.dmlItems;
        if(this.object.changes === undefined || this.object.changes.length === 0) {
            return;
        }
        DynamicMacroLink.updateDML(dmlItems);
        game.settings.set(module_name, "dml-pairs", DynamicMacroLink.collection.map(({entity, macroId}) => {
            return {
                entity,
                macroId,
            };
        }));
    }

    _onChangeInput(event) {
        const el = event.target;
        const dataset = el.dataset;
        const index = dataset.index;
        const change = el.name;
        const value = el.value;

        if(this.object.changes === undefined) {
            this.object.changes = [];
        }

        const data = {
            type: "modify",
            index,
        };

        data[change] = value;

        this.object.changes.push(data);
    }

    _onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const {
            type,
            pack,
            id
        } = data;

        if(type !== "Macro") {
            return;
        }

        if(pack !== undefined) {
            this._onDMLCreate({
                entity: "",
                macroId: `${pack}.${id}`,
            });
        } else {
            this._onDMLCreate({
                entity: "",
                macroId: id,
            });
        }
    }
}

function register() {
    DynamicMacroLink.updateDML(default_dml);
    game.settings.register(module_name, "dml-pairs", {
        name: "DML Pairs",
        scope: "world",
        default: default_dml,
        type: Object,
        config: false,
        onChange: (v) => {
            DynamicMacroLink.updateDML(v);
        },
    });

    game.settings.registerMenu(module_name, "dml-pairs", {
        name: "Modify DML",
        label: "Open Editor",
        hint: "Adjust entity names that call macros",
        icon: "fas fa-bars",
        type: DMLSettingsApplication,
        restricted: true,
    });
}

export default register;
export {
    DMLSettingsApplication,
    register
}