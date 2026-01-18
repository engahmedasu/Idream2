import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiGrid,
  FiShield,
  FiKey,
  FiFileText,
  FiDollarSign,
  FiLogOut,
  FiMenu,
  FiX,
  FiShare2,
  FiShoppingCart,
  FiList,
  FiChevronDown,
  FiChevronRight,
  FiVideo,
  FiMail,
  FiInbox,
  FiZap,
  FiBriefcase,
  FiImage
} from 'react-icons/fi';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Sidebar configuration with a User Management group
  const menuConfig = [
    {
      type: 'item',
      path: '/',
      icon: FiHome,
      label: 'Dashboard',
      roles: ['superAdmin', 'mallAdmin', 'shopAdmin']
    },
    {
      type: 'group',
      label: 'User Management',
      icon: FiUsers,
      roles: ['superAdmin'],
      children: [
        { path: '/users', label: 'Users', icon: FiUsers, roles: ['superAdmin'] },
        { path: '/roles', label: 'Roles', icon: FiShield, roles: ['superAdmin'] },
        { path: '/permissions', label: 'Permissions', icon: FiKey, roles: ['superAdmin'] }
      ]
    },
    {
      type: 'group',
      label: 'Pages',
      icon: FiFileText,
      roles: ['superAdmin'],
      children: [
        { path: '/pages', label: 'Pages', icon: FiFileText, roles: ['superAdmin'] },
        { path: '/contact-requests', label: 'Contact Requests', icon: FiMail, roles: ['superAdmin'] }
      ]
    },
    {
      type: 'group',
      label: 'Requests',
      icon: FiInbox,
      roles: ['superAdmin'],
      children: [
        { path: '/requests/join-our-team', label: 'Join Our Team', icon: FiUsers, roles: ['superAdmin'] },
        { path: '/requests/new-ideas', label: 'New Ideas', icon: FiZap, roles: ['superAdmin'] },
        { path: '/requests/hire-expert', label: 'Hire Expert', icon: FiBriefcase, roles: ['superAdmin'] }
      ]
    },
    {
      type: 'item',
      path: '/categories',
      icon: FiGrid,
      label: 'Categories',
      roles: ['superAdmin']
    },
    {
      type: 'item',
      path: '/videos',
      icon: FiVideo,
      label: 'Videos',
      roles: ['superAdmin']
    },
    {
      type: 'item',
      path: '/advertisements',
      icon: FiImage,
      label: 'Advertisements',
      roles: ['superAdmin']
    },
    {
      type: 'item',
      path: '/shops',
      icon: FiShoppingBag,
      label: 'Shops',
      roles: ['superAdmin', 'mallAdmin', 'Sales']
    },
    {
      type: 'item',
      path: '/subscription-plans',
      icon: FiDollarSign,
      label: 'Subscription Plans',
      roles: ['superAdmin']
    },
    {
      type: 'item',
      path: '/products',
      icon: FiPackage,
      label: 'Products',
      roles: ['superAdmin', 'mallAdmin', 'shopAdmin']
    },
    {
      type: 'group',
      label: 'Reports',
      icon: FiFileText,
      roles: ['superAdmin', 'mallAdmin', 'shopAdmin', 'Finance'],
      children: [
        { path: '/reports/products', label: 'Products', icon: FiPackage, roles: ['superAdmin', 'mallAdmin', 'shopAdmin', 'Finance'] },
        { path: '/reports/shares', label: 'Sharing', icon: FiShare2, roles: ['superAdmin', 'mallAdmin', 'Finance'] },
        { path: '/reports/orders', label: 'Orders', icon: FiShoppingCart, roles: ['superAdmin', 'mallAdmin', 'Finance'] },
        { path: '/reports/subscription-logs', label: 'Subscription Logs', icon: FiList, roles: ['superAdmin', 'Finance'] }
      ]
    }
  ];

  const getUserRole = () => {
    if (!user) return null;
    return user.role?.name || user.role;
  };

  const userRole = getUserRole();

  const isAllowed = (roles) => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const visibleMenuConfig = menuConfig
    .map(section => {
      if (section.type === 'item') {
        return isAllowed(section.roles) ? section : null;
      }
      if (section.type === 'group') {
        const visibleChildren = section.children.filter(child => isAllowed(child.roles));
        if (visibleChildren.length === 0) return null;
        return { ...section, children: visibleChildren };
      }
      return null;
    })
    .filter(Boolean);

  // Flatten all items (including group children) for header title lookup
  const flatMenuItems = visibleMenuConfig.reduce((acc, section) => {
    if (section.type === 'item') {
      acc.push(section);
    } else if (section.type === 'group') {
      acc.push(...section.children);
    }
    return acc;
  }, []);

  // Initialize collapsed state: expand all groups by default
  useEffect(() => {
    setCollapsedGroups(prev => {
      // Only initialize if keys don't exist yet (initial load)
      const hasAnyKeys = Object.keys(prev).length > 0;
      if (hasAnyKeys) {
        // If location changes, ensure groups with active children are expanded
        const updated = { ...prev };
        visibleMenuConfig.forEach(section => {
          if (section.type === 'group') {
            const hasActiveChild = section.children.some(child => location.pathname === child.path);
            if (hasActiveChild) {
              updated[section.label] = false; // Expand if has active child
            }
          }
        });
        return updated;
      }
      
      // Initialize all groups as expanded (false = expanded, true = collapsed)
      const initialCollapsed = {};
      visibleMenuConfig.forEach(section => {
        if (section.type === 'group') {
          initialCollapsed[section.label] = false; // false = expanded
        }
      });
      return initialCollapsed;
    });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (groupLabel) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.svg" alt="iDREAM" className="sidebar-logo" />
            <span className="admin-text">Admin</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>
        <nav className="sidebar-nav">
          {visibleMenuConfig.map(section => {
            if (section.type === 'item') {
              const Icon = section.icon;
              const isActive = location.pathname === section.path;
              return (
                <Link
                  key={section.path}
                  to={section.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon />
                  <span>{section.label}</span>
                </Link>
              );
            }

            if (section.type === 'group') {
              const GroupIcon = section.icon;
              const isCollapsed = collapsedGroups[section.label];
              const ChevronIcon = isCollapsed ? FiChevronRight : FiChevronDown;
              return (
                <div key={section.label} className="nav-group">
                  <button
                    className="nav-group-label"
                    onClick={() => toggleGroup(section.label)}
                    type="button"
                  >
                    <GroupIcon />
                    <span>{section.label}</span>
                    <ChevronIcon className="nav-group-chevron" />
                  </button>
                  {!isCollapsed && (
                    <div className="nav-group-children">
                      {section.children.map(child => {
                        const ChildIcon = child.icon;
                        const isActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`nav-item nav-item-child ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <ChildIcon />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <p>{user?.name || user?.fullName || user?.email}</p>
            <p className="user-role">{user?.role?.name || user?.role}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut />
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <h1>{
            (() => {
              const menuItem = flatMenuItems.find(item => item.path === location.pathname);
              if (menuItem) return menuItem.label;
              // Handle reports pages
              if (location.pathname.includes('/reports/')) {
                if (location.pathname.includes('/subscription-logs')) return 'Subscription Logs';
                if (location.pathname.includes('/shares')) return 'Sharing';
                if (location.pathname.includes('/orders')) return 'Orders';
                if (location.pathname.includes('/products')) return 'Products';
                return 'Reports';
              }
              // Handle requests pages
              if (location.pathname.includes('/requests/')) {
                if (location.pathname.includes('/join-our-team')) return 'Join Our Team';
                if (location.pathname.includes('/new-ideas')) return 'New Ideas';
                if (location.pathname.includes('/hire-expert')) return 'Hire Expert';
                return 'Requests';
              }
              return 'Dashboard';
            })()
          }</h1>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

