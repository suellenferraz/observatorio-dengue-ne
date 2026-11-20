export const CAPITAIS: Record<string, { codigo: string; nome: string }> = {
  MA: { codigo: "2111300", nome: "São Luís" },
  PI: { codigo: "2211001", nome: "Teresina" },
  CE: { codigo: "2304400", nome: "Fortaleza" },
  RN: { codigo: "2408102", nome: "Natal" },
  PB: { codigo: "2507507", nome: "João Pessoa" },
  PE: { codigo: "2611606", nome: "Recife" },
  AL: { codigo: "2704302", nome: "Maceió" },
  SE: { codigo: "2800308", nome: "Aracaju" },
  BA: { codigo: "2927408", nome: "Salvador" },
}

export const CODIGOS_CAPITAIS = Object.values(CAPITAIS).map((c) => c.codigo)
