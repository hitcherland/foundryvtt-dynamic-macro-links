# Dynamic Macro Links

This is a module for Foundry Virtual Tabletop, that allows users to add Dynamic Entity Links that call a macro.
This is going to be mostly useful for journal entries that need a bit more interactivity, for example GM Notes that change the scene or start a playlist.

This module is inspired by Foundry VTT's own Dynamic Entity Links and [Forien's Scene Navigator](https://github.com/Forien/foundryvtt-forien-scene-navigator).

# Installation

Open Foundry VTT, and enter the module management tab. Import a new module with the tab `https://raw.githubusercontent.com/hitcherland/foundryvtt-dynamic-macro-links/main/module.json`, and enable it in the game.

# Usage

Three Dynamic Macro Links are setup by default:

* *ActivateScene* - activates a scene when passed a scene id
* *PlayPlaylist* - plays a playlist when passed a playlist id
* *PlayOnlyPlaylist* - turns off all playing playlists and plays the playlist with the passed id

For example, to use `ActivateScene`, you would open a journal entry in edit mode, drag and drag a scene into the editor.
At this point, you should see something like 

    @Scene[0Mib4ysc99LwTpAa]{My Scene}


Replace the entity name `Scene` with our Dynamic Macro Link entity name `ActivateScene`:

    @ActivateScene[0Mib4ysc99LwTpAa]{My Scene}

When we exit edit mode, we can click on the "My Scene" button and the scene should transition.

# Writing a Dynamic Macro Link

It is simple to create a Dynamic Macro Link. First, create a new macro that performs the action
you require.

For example, the macro command for `ActivateScene` is:

    const [id] = args;

    const scene = game.scenes.get(id);
    if(scene !== null) {
        scene.activate();
    }

The variable `args` is a special environment variable that is defined when the Dynamic Macro Link is clicked.
It contains an array produced by splitting the id by a semicolon, i.e. `0Mib4ysc99LwTpAa;test` => `['0Mib4ysc99LwTpAa', test']`.

Once you've created your new macro, open up the settings tab and click "Configure Settings" followed by "Module Settings". Here we can see the 
Dynamic Macro Links settings group. Click "Open Editor" here, and a new window should open up. Simply drag your newly created macro onto the box that says
"Drag Macros Here", and new entry will be added. Make sure to add an Entity Name (e.g. `ActivateScene` from earlier). Click `Submit` and everything should be ready
to go.

Note: This module won't allow overlap of Entity Names with existing entity names (e.g. "Playlist", "Scene" or "Macro"), as this would overwrite existing behaviour and could break some functionality.

# Future Work:

* Allow users to define a custom Font Awesome icon for their Dynamic Module Link buttons.
