export function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-beige ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-25 text-espresso"
      >
        <rect x="8" y="8" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="22" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M8 44L20 32L30 42L42 28L56 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
