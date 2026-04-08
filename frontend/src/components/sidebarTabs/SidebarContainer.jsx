import React from 'react';
import TabItem from './TabItem';
import { CollapseIcon } from './SidebarIcons';
import styles from './SidebarTabsLayout.module.css';

export default function SidebarContainer({
  tabs,
  activeTab,
  collapsed,
  onToggleCollapse,
  onTabSelect,
}) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <CollapseIcon collapsed={collapsed} />
          <span className={`${styles.collapseLabel} ${collapsed ? styles.tabLabelHidden : ''}`}>
            {collapsed ? 'Expand' : 'Collapse'}
          </span>
        </button>
      </div>

      <nav className={styles.tabNav} role="tablist" aria-orientation="vertical" aria-label="Main sections">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTab}
            collapsed={collapsed}
            onSelect={onTabSelect}
          />
        ))}
      </nav>
    </aside>
  );
}
