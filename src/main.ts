import { createApp } from "vue";
import "./style.css";
import "primeicons/primeicons.css";
import App from "./App.vue";
import router from "./router";
import pinia from "./stores";
import PrimeVue from "primevue/config";

const app = createApp(App);

app.use(router);
app.use(pinia);
app.use(PrimeVue, {
  unstyled: true,
});

app.mount("#app");
