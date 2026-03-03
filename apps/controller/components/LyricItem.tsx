import { Lyric } from 'shared';

interface LyricItemProps {
  lyric: Lyric;
  index: number;
  isActive: boolean;
  onEdit: (lyric: Lyric) => void;
  onDelete: (id: string) => void;
}

export default function LyricItem({ lyric, index, isActive, onEdit, onDelete }: LyricItemProps) {
  return (
    <div
      className={`group flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
        isActive
          ? 'bg-purple-50 border-purple-500 shadow-md'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <span
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
          isActive
            ? 'bg-purple-500 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className={`text-lg break-words ${isActive ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
        >
          {lyric.text}
        </p>
        {lyric.notes && (
          <p className="text-sm text-gray-500 mt-1">{lyric.notes}</p>
        )}
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(lyric)}
          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          aria-label="Edit lyric"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        <button
          onClick={() => onDelete(lyric.id)}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete lyric"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg" />
      )}
    </div>
  );
}
