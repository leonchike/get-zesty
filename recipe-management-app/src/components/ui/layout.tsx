export function WidthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[160rem] m-auto">
      <div className="mx-4 md:mx-8">{children}</div>
    </div>
  );
}
