import { BookOpen } from 'lucide-react';

interface BookCardProps {
  name: string;
  imageUrl?: string;
}

export function BookCard({ name, imageUrl }: BookCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<svg class="w-16 h-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
            }}
          />
        ) : (
          <BookOpen className="w-16 h-16 text-gray-400" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{name}</h3>
      </div>
    </div>
  );
}
