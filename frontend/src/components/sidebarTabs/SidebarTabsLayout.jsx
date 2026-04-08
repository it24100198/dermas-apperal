import React, { useMemo, useState } from 'react';
import SidebarContainer from './SidebarContainer';
import ContentPanel from './ContentPanel';
import { tabsData } from './tabsData';
import styles from './SidebarTabsLayout.module.css';

export default function SidebarTabsLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(tabsData[0].id);

  const tabs = useMemo(() => tabsData, []);

  return (
    <div className={styles.layoutRoot}>
      <SidebarContainer
        tabs={tabs}
        activeTab={activeTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onTabSelect={setActiveTab}
      />

      <ContentPanel activeTab={activeTab} tabs={tabs} />
    </div>
  );
}
