import { describe, expect, it } from "vitest"

import { ANO_FIM, ANO_INICIO } from "@/lib/anos"
import {
  TODOS,
  entraNoRankingDeIncidencia,
  incidencia,
  nivel,
  parcelaForaDaCapital,
  totalDoPeriodo,
  type TotalAno,
} from "@/lib/dengue"

function ano(parcial: Pick<TotalAno, "ano" | "casos" | "populacao">): TotalAno {
  return {
    confirmados: 0,
    alarme: 0,
    graves: 0,
    obitos: 0,
    incidencia: 0,
    ...parcial,
  }
}

describe("contas da dengue", () => {
  it("mede casos por 100 mil habitantes", () => {
    expect(incidencia(100, 100_000)).toBe(100)
    expect(incidencia(65_372, 5_378_921)).toBeCloseTo(1_215.3, 1)
    expect(incidencia(10, 0)).toBe(0)
  })

  it("separa os níveis nos limites de 100 e 300", () => {
    expect(nivel(99.9)).toBe("baixa")
    expect(nivel(100)).toBe("média")
    expect(nivel(299.9)).toBe("média")
    expect(nivel(300)).toBe("alta")
  })

  it("no período completo a incidência é a média anual", () => {
    const totais = [
      ano({ ano: 2000, casos: 100, populacao: 100_000 }),
      ano({ ano: 2001, casos: 300, populacao: 100_000 }),
    ]
    const total = totalDoPeriodo(totais, TODOS)
    expect(total?.casos).toBe(400)
    expect(total?.populacao).toBe(200_000)
    expect(total?.incidencia).toBe(200)
    expect(ANO_FIM - ANO_INICIO + 1).toBe(26)
  })

  it("deixa de fora do ranking de incidência quem tem menos de 100 mil habitantes", () => {
    expect(entraNoRankingDeIncidencia(99_999)).toBe(false)
    expect(entraNoRankingDeIncidencia(100_000)).toBe(true)
  })

  it("calcula a parcela de casos fora da capital", () => {
    expect(parcelaForaDaCapital(1_158_842, 2_939_636)).toBeCloseTo(71.7, 1)
    expect(parcelaForaDaCapital(324_318, 405_328)).toBeCloseTo(55.6, 1)
    expect(parcelaForaDaCapital(0, 0)).toBe(0)
  })
})
