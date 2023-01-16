import React from 'react';
import { createRoot } from 'react-dom/client';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import App from './components/App';
import './styles.css';

const engine = new Styletron();

document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('react-page');
  //@ts-ignore
  const root = createRoot(container);
  root.render(
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>
        <App />
      </BaseProvider>
    </StyletronProvider>
  );
});
