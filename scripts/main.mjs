import {register as registerDML} from './settings.mjs';
import {onReady as onReadyDML} from './dml.mjs';

Hooks.once('init', registerDML);
Hooks.once('ready', onReadyDML);