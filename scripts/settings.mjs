const module_name = "dynamic-macro-links";

const default_dml = [{
    document: "ActivateScene",
    macroId: "Compendium.dynamic-macro-links.dml-macros.QEkDw8G6LHzENtt4"
}, {
    document: "PlayPlaylist",
    macroId: "Compendium.dynamic-macro-links.dml-macros.YOWUSenN4K2mM2LF"
}, {
    document: "PlayOnlyPlaylist",
    macroId: "Compendium.dynamic-macro-links.dml-macros.8YQe4mFPekNR4yGa"
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

    _onDMLCreate({document, macroId}) {
        if(this.object.changes === undefined) {
            this.object.changes = [];
        }

        this.object.changes.push({
            type: "add",
            document,
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
        const dmlPairs = game.settings.get(module_name, "dml-pairs");

        const changes = this.object.changes || [];

        changes.forEach(({type, index, document, macroId}) => {
            switch(type) {
                case "add":
                    dmlPairs.push({
                        document,
                        macroId
                    });
                    break;
                case "remove":
                    dmlPairs.splice(index, 1);
                    break;
                case "modify":
                    if(document !== undefined)
                        dmlPairs[index].document = document;

                    if(macroId !== undefined)
                        dmlPairs[index].macroID = macroId;
                    break;
                default:
                    break;
            }
        });

        const macros = await Promise.all(dmlPairs.map(x => fromUuidSync(x.macroId)));
        const items = dmlPairs.map((dml, i) => {
            return {
                document: dml.document,
                macroId: dml.macroId,
                macro: macros[i],
            };
        });

        return {
            dmlPairs: items
        };
    }

    async _updateObject(ev, formData) {
        const data = await this.getData();
        const dmlPairs = data.dmlPairs;
        if(this.object.changes === undefined || this.object.changes.length === 0) {
            return;
        }
        game.settings.set(module_name, "dml-pairs", dmlPairs);
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

    async _onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const {
			type,
            // pack,
            id,
			slot
        } = await data;
		// console.log(data);
        if(type !== "Macro") {
            return;
        }

        // let macroId = `Macro.${id}`;
		let macroId = data.uuid;
        // if(pack !== undefined)
        //     macroId = `Compendium.${pack}.${id}`;
        const macro = await fromUuidSync(macroId);
        this._onDMLCreate({
            document: macro.name,
            macroId,
        });
    }
}

function register() {
    game.settings.register(module_name, "dml-pairs", {
        name: "DML Pairs",
        scope: "world",
        default: default_dml,
        type: Object,
        config: false,
    });

    game.settings.registerMenu(module_name, "dml-pairs", {
        name: "Modify DML",
        label: "Open Editor",
        hint: "Adjust document names that call macros",
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
