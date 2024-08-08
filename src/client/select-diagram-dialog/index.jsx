import { createRoot } from 'react-dom/client';
import SelectDiagramDialog from './components/select-diagram-dialog';
import './styles.css';

const container = document.getElementById('index');
const root = createRoot(container);
root.render(<SelectDiagramDialog />);
