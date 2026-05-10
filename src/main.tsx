import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LocaleProvider } from './lib/locale';

createRoot(document.getElementById("root")!).render(
    <LocaleProvider>
        <App />
    </LocaleProvider>
);
