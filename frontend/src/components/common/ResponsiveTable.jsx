// Wrapper for tables that need horizontal scroll on mobile
export default function ResponsiveTable({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        {children}
      </div>
    </div>
  );
}
