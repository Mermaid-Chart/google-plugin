import { createRoot } from 'react-dom/client';
import EditDiagramDialog from './components/edit-diagram-dialog';
import './styles.css';

const container = document.getElementById('index');
const root = createRoot(container);
root.render(<EditDiagramDialog />);
