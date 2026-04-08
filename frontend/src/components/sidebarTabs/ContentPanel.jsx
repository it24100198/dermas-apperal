import React from 'react';
import styles from './SidebarTabsLayout.module.css';

export default function ContentPanel({ activeTab, tabs }) {
  const selected = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <section className={styles.contentWrap}>
      <div
        key={selected.id}
        role="tabpanel"
        id={`panel-${selected.id}`}
        aria-labelledby={`tab-${selected.id}`}
        tabIndex={0}
        className={styles.contentPanel}
      >
        <header className={styles.contentHeader}>
          <h2>{selected.label}</h2>
          <p>{selected.description}</p>
        </header>

        <div className={styles.cardGrid}>
          {selected.cards.map((card) => (
            <article key={card.title} className={styles.infoCard}>
              <h3>{card.title}</h3>
              <p>{card.value}</p>
              <small>{card.helper}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
