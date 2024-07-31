import ReactDOM from 'react-dom';
import CreateDiagramDialog from './components/create-diagram-dialog';
import './styles.css';

const container = document.getElementById('index');
const root = ReactDOM.createRoot(container);
root.render(<CreateDiagramDialog />);
