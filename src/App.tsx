import { RouterProvider } from 'react-router';
import { AppProvider } from './store/AppContext';
import { CustomerProvider } from './store/CustomerContext';
import { SettingsProvider } from './store/SettingsContext';
import { ThemeProvider } from './store/ThemeContext';
import { router } from './app/routes';

export default function App() {
  return (
    <ThemeProvider>
    <AppProvider>
      <SettingsProvider>
        <CustomerProvider>
          <RouterProvider router={router} />
        </CustomerProvider>
      </SettingsProvider>
    </AppProvider>
    </ThemeProvider>
  );
}
