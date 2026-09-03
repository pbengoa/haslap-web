/** Placeholders de carga, con el mismo tamaño que las tarjetas reales. */
export function EsqueletoEvento() {
  return (
    <div className="tarjeta animate-pulse overflow-hidden">
      <div className="h-40 w-full bg-linea-suave" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 rounded bg-linea-suave" />
        <div className="h-3 w-1/2 rounded bg-linea-suave" />
        <div className="h-3 w-2/3 rounded bg-linea-suave" />
        <div className="mt-4 h-9 w-full rounded-full bg-linea-suave" />
      </div>
    </div>
  );
}

export function EsqueletoClub() {
  return (
    <div className="tarjeta flex animate-pulse items-center gap-4 p-4">
      <div className="h-14 w-14 shrink-0 rounded-ds-md bg-linea-suave" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded bg-linea-suave" />
        <div className="h-3 w-1/3 rounded bg-linea-suave" />
        <div className="h-3 w-2/3 rounded bg-linea-suave" />
      </div>
    </div>
  );
}

export function RejillaEsqueletos({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <EsqueletoEvento key={i} />
      ))}
    </div>
  );
}

export function EstadoVacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="tarjeta grid place-items-center px-6 py-14 text-center">
      <svg viewBox="0 0 32 32" className="mb-4 h-10 w-10 text-verde opacity-30" aria-hidden="true">
        <path d="M11.5 5 7 27h4.6l4.5-22zM23.5 5 19 27h4.6l4.5-22z" fill="currentColor" />
        <path d="M9 13.5h14l-.9 4.5H8.1z" fill="currentColor" />
      </svg>
      <p className="text-[16px] font-bold text-texto">{titulo}</p>
      <p className="mt-1 max-w-sm text-[14px] text-texto-suave">{texto}</p>
    </div>
  );
}
