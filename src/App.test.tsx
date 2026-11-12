import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Algions Academy landing page', () => {
  render(<App />);
  expect(screen.getAllByText('ALGIONS ACADEMY').length).toBeGreaterThan(0);
  expect(screen.getByText(/Run your entire school from one calm/i)).toBeInTheDocument();
  expect(screen.getAllByText('Quick demo login').length).toBeGreaterThan(0);
});
