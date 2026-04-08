import React from 'react';
import styles from './SidebarTabsLayout.module.css';

export default function TabItem({ tab, isActive, collapsed, onSelect }) {
  return (
    <button
      type="button"
      className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
      onClick={() => onSelect(tab.id)}
      aria-label={tab.label}
      aria-selected={isActive}
      role="tab"
      id={`tab-${tab.id}`}
      aria-controls={`panel-${tab.id}`}
      title={collapsed ? tab.label : undefined}
    >
      <span className={styles.tabIcon} aria-hidden="true">
        {tab.icon}
      </span>
      <span className={`${styles.tabLabel} ${collapsed ? styles.tabLabelHidden : ''}`}>{tab.label}</span>
    </button>
  );
}
