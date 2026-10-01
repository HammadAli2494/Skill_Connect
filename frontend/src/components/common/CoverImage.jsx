import { useEffect, useState } from 'react';
import { imageSrc } from '../../services/api';

export function CoverImage({ src, alt, className = 'absolute inset-0 h-full w-full' }) {
  const resolved = imageSrc(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  return (
    <div className={`relative overflow-hidden bg-stone-200 ${className}`}>
      {!resolved || failed ? (
        <div className="flex h-full min-h-16 w-full items-end bg-forest/90 p-3 text-sm font-medium text-white">No photo</div>
      ) : (
        <img
          src={resolved}
          alt={alt || 'Service photo'}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
