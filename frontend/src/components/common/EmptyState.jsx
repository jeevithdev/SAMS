import { FolderIcon } from '@heroicons/react/24/outline';

export default function EmptyState({ 
  icon: Icon = FolderIcon, 
  title = 'No data found', 
  message = 'There are no items to display.',
  action,
  actionLabel = 'Get started'
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
      <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{message}</p>
      {action && (
        <button
          onClick={action}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
