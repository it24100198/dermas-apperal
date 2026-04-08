import React from 'react';
import {
  FinanceIcon,
  InventoryIcon,
  ProductionIcon,
  SalesIcon,
  SystemIcon,
} from './SidebarIcons';

export const tabsData = [
  {
    id: 'finance',
    label: 'Finance',
    icon: <FinanceIcon />,
    description: 'Track payables, receivables, and operating margin with quick daily metrics.',
    cards: [
      { title: 'Cash Flow', value: '$124,900', helper: '+12.3% vs last month' },
      { title: 'Open Invoices', value: '38', helper: '6 overdue, 32 pending' },
      { title: 'Expense Ratio', value: '24.8%', helper: 'Within target threshold' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <InventoryIcon />,
    description: 'Monitor stock health and replenishment priorities across all warehouses.',
    cards: [
      { title: 'Items In Stock', value: '4,862', helper: '142 low-stock alerts' },
      { title: 'Turnover Rate', value: '5.6x', helper: 'Quarter-to-date average' },
      { title: 'Backorder Risk', value: 'Medium', helper: '17 SKUs need reorder' },
    ],
  },
  {
    id: 'production',
    label: 'Production',
    icon: <ProductionIcon />,
    description: 'Live status of manufacturing throughput, bottlenecks, and completion.',
    cards: [
      { title: 'Active Lines', value: '12', helper: '2 lines in setup mode' },
      { title: 'Output Today', value: '7,940 units', helper: '94.2% of target reached' },
      { title: 'Defect Rate', value: '1.1%', helper: 'Improved from 1.5%' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <SalesIcon />,
    description: 'Pipeline and fulfillment overview with conversion performance highlights.',
    cards: [
      { title: 'Revenue MTD', value: '$412,300', helper: '+8.7% month-over-month' },
      { title: 'Orders Today', value: '216', helper: '13 priority shipments' },
      { title: 'Win Rate', value: '42%', helper: 'Up from 37% previous cycle' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: <SystemIcon />,
    description: 'System health, role access status, and automation service reliability.',
    cards: [
      { title: 'API Uptime', value: '99.96%', helper: 'Last 30 days' },
      { title: 'Queue Latency', value: '182 ms', helper: 'Within SLA limit' },
      { title: 'Failed Jobs', value: '2', helper: 'Auto-retry enabled' },
    ],
  },
];
