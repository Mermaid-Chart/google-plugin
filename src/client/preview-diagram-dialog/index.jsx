import { createRoot } from 'react-dom/client';
import PreviewDiagramDialog from './components/preview-diagram-dialog';
import './styles.css';

const container = document.getElementById('index');
const root = createRoot(container);
root.render(<PreviewDiagramDialog />);
