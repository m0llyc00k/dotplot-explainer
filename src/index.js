/* eslint no-undef: "off" */

import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById(`inset-${__UUID__}`);
const app = mount(App, { target, props: {} });

export default app;
