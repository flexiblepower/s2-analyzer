import { createRoot } from 'react-dom/client';
import App from './App';

let root = createRoot(document.getElementById('app') as HTMLElement);
root.render(<App />);