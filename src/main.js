import { createApp } from 'vue'
import App from './App.vue'
import TimeInput from './components/TimeInput.vue'

const app = createApp(App);

// 1. Register ElementPlus (Plugin)
if (window.ElementPlus) {
  app.use(window.ElementPlus);
}

// 2. Register Global Components
app.component('TimeInput', TimeInput);

app.mount('#app');
