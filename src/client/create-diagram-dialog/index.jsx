import { createRoot } from 'react-dom/client';
import CreateDiagramDialog from './components/create-diagram-dialog';
import './styles.css';

const container = document.getElementById('index');
const root = createRoot(container);
root.render(<CreateDiagramDialog />);
