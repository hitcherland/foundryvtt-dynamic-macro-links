class DMLTextEditor extends TextEditor {
    static enrichHTML(content, { secrets = false, documents = true, links = true, rolls = true, rollData, ...options } = {}) {

        // Create the HTML element
        const html = document.createElement("div");
        html.innerHTML = String(content || "");

        // Remove secret blocks
        if (!secrets) {
            let elements = html.querySelectorAll("section.secret");
            elements.forEach(e => e.parentNode.removeChild(e));
        }

        // Plan text content replacements
        let updateTextArray = true;
        let text = [];

        // Replace document links
        if (options.entities) {
            console.warn("The 'entities' option for TextEditor.enrichHTML is deprecated. Please use 'documents' instead.");
            documents = options.entities;
        }

        if (documents) {
            if (updateTextArray) text = this._getTextNodes(html);
            const macroNames = game.settings.get('dynamic-macro-links', 'dml-pairs').map(x => x.document);
            const documentTypes = CONST.DOCUMENT_LINK_TYPES.concat("Compendium", ...macroNames);
            const rgx = new RegExp(`@(${documentTypes.join("|")})\\[([^\\]]+)\\](?:{([^}]+)})?`, 'g');
            updateTextArray = this._replaceTextContent(text, rgx, this._createContentLink);
        }

        // Replace hyperlinks
        if (links) {
            if (updateTextArray) text = this._getTextNodes(html);
            const rgx = /(https?:\/\/)(www\.)?([^\s<]+)/gi;
            updateTextArray = this._replaceTextContent(text, rgx, this._createHyperlink);
        }

        // Replace inline rolls
        if (rolls) {
            rollData = rollData instanceof Function ? rollData() : (rollData || {});
            if (updateTextArray) text = this._getTextNodes(html);
            const rgx = /\[\[(\/[a-zA-Z]+\s)?(.*?)([\]]{2,3})(?:{([^}]+)})?/gi;
            updateTextArray = this._replaceTextContent(text, rgx, (...args) => this._createInlineRoll(...args, rollData));
        }

        // Return the enriched HTML
        return html.innerHTML;
    };


    static _createContentLink(match, type, target, name) {
        // Prepare replacement data
        const data = {
            cls: ["entity-link", "content-link"],
            icon: null,
            dataset: {},
            name: name
        };
        let broken = false;
        const macros = game.settings.get('dynamic-macro-links', 'dml-pairs');
        const macroDict = Object.assign({}, ...macros.map(x => ({[x.document]: x.macroId})));

        if (macroDict[type] === undefined) {
            return super._createContentLink(match, type, target, name);
        }

        // Construct the formed link
        const a = document.createElement('a');
        a.classList.add(...data.cls);
        a.draggable = true;

        a.dataset.macroId = macroDict[type];
        a.dataset.id = target;
        a.innerHTML = `<i class="${data.icon}"></i> ${data.name}`;
        return a;
    }

    static async _onClickContentLink(event) {
        event.preventDefault();
        const a = event.currentTarget;
        let id = a.dataset.id;

        if (a.dataset.macroId === undefined) {
            return super._onClickContentLink(event);
        }

        const macro = await fromUuid(a.dataset.macroId);
        const args = id.split(';');

        function handleMacro(macro) {
            try {
                eval(macro.data.command);
            } catch (err) {
                ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
                console.error(err);
            }
        }

        if(macro instanceof Promise) {
            return macro.then(handleMacro);
        } else {
            return handleMacro(macro);
        }

    }
}

function swapTextEditors() {
    console.warn("Swapping TextEditors");
    window.TextEditor = DMLTextEditor;
    globalThis.TextEditor = DMLTextEditor;
    TextEditor = DMLTextEditor;
}

export {
    swapTextEditors
}