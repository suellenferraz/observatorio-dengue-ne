import { useEffect, useRef, useState, type ReactNode } from "react"

export function QuandoVisivel({
  children,
  reserva,
}: {
  children: ReactNode
  reserva: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento || visivel) return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) setVisivel(true)
      },
      { rootMargin: "200px" }
    )
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [visivel])

  return <div ref={ref}>{visivel ? children : <div className={reserva} />}</div>
}
