import { createApp } from 'vue'
import App from './App.vue'
import TimeInput from './components/TimeInput.vue'

const app = createApp(App);

if (window.ElementPlus) {
  app.use(window.ElementPlus);
}

app.component('TimeInput', TimeInput);

app.mount('#app');
