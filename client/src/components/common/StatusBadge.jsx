import React from "react";

/**
 * Badge de estado para Clientes y Gimnasios
 * @param {'active' | 'expiring_soon' | 'expired' | 'trial' | 'suspended'} status
 * @param {string} label
 */
export default function StatusBadge({ status, label }) {
  const styles = {
    active:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    trial:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
    expiring_soon:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    expired:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
    suspended:
      "bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-800 dark:text-zinc-300",
  };

  const currentStyle = styles[status] || styles.suspended;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}
    >
      {label || status}
    </span>
  );
}
