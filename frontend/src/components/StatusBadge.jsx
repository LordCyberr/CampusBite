import React from 'react';
import {
  Clock,
  Check,
  Flame,
  Package,
  UserCheck,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

const STATUS_CONFIG = {
  PLACED: {
    label: 'Placed',
    icon: Clock,
    className: 'badge-placed',
  },
  ACCEPTED: {
    label: 'Accepted',
    icon: Check,
    className: 'badge-accepted',
  },
  PREPARING: {
    label: 'Preparing',
    icon: Flame,
    className: 'badge-preparing',
  },
  READY: {
    label: 'Ready for Pickup',
    icon: Package,
    className: 'badge-ready',
  },
  ASSIGNED: {
    label: 'Courier Assigned',
    icon: UserCheck,
    className: 'badge-assigned',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    icon: Truck,
    className: 'badge-out_for_delivery',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle2,
    className: 'badge-delivered',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'badge-cancelled',
  },
  REFUNDED: {
    label: 'Refunded',
    icon: RotateCcw,
    className: 'badge-refunded',
  },
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();
  const config = STATUS_CONFIG[normalized] || {
    label: status,
    icon: Clock,
    className: 'badge-placed',
  };
  const Icon = config.icon;

  return (
    <span className={`badge ${config.className}`}>
      <Icon size={12} aria-hidden="true" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
