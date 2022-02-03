import {register as registerDML} from './settings.mjs';
import {swapTextEditors} from './DMLTextEditor.mjs';

Hooks.once('init', registerDML);
Hooks.once('init', swapTextEditors);