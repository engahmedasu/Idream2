// Manual mock for react-router-dom
const React = require('react');

const mockNavigate = jest.fn();

module.exports = {
  BrowserRouter: ({ children }) => React.createElement('div', null, children),
  Routes: ({ children }) => React.createElement('div', null, children),
  Route: ({ element }) => element,
  Navigate: ({ to }) => `Navigate to ${to}`,
  Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
  NavLink: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'Outlet'),
  matchPath: jest.fn(),
  matchRoutes: jest.fn(),
  createRoutesFromChildren: jest.fn(),
  generatePath: jest.fn(),
  resolvePath: jest.fn(),
};

