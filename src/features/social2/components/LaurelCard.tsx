"use client";

interface Props {
  label: string;
  value: string;
  subtitle?: string;
}

export default function LaurelCard({ label, value, subtitle }: Props) {
  return (
    <div className="relative w-[300px] h-[250px] flex flex-col items-center justify-center text-center bg-no-repeat bg-center bg-contain"
      style={{ backgroundImage: 'url("/icons/laurel.png")' }}
    >
      <span className="text-sm text-neutral-500 mb-1">Professional</span>
      <p
        className="text-3xl md:text-xl font-extrabold text-[#263a5c]"
        style={{ fontFamily: "'Black Han Sans', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-xs text-neutral-600 mt-1">Lawyers</p>
      {subtitle && (
        <p className="text-[11px] text-gray-400 mt-1 px-2">{subtitle}</p>
      )}
    </div>
  );
}
