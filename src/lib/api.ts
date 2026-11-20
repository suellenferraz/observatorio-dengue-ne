import { useEffect, useState } from "react"

export type LinhaUfAno = {
  sigla: string
  nome: string
  ano: number
  populacao: number
  casos: number
  casosComDuplicatas: number
  confirmados: number
  alarme: number
  graves: number
  obitos: number
}

export type LinhaSazonalidade = {
  sigla: string
  ano: number
  mes: number
  casos: number
}

export type LinhaPerfil = {
  sigla: string
  ano: number
  faixa: string
  sexo: "F" | "M"
  casos: number
}

export type Criterio =
  "laboratorial" | "clinico" | "investigacao" | "naoInformado"

export type LinhaCriterio = {
  sigla: string
  ano: number
  criterio: Criterio
  casos: number
}

export type LinhaInterior = {
  sigla: string
  ano: number
  casosCapital: number
  casosInterior: number
}

export type LinhaMunicipio = {
  codigo: string
  nome: string
  sigla: string
  populacao: number
  pessoasAno: number
  casos: number
}

export type RespostaApi<T> = {
  dados: T | null
  erro: string | null
  carregando: boolean
}

const cache = new Map<string, Promise<unknown>>()

function buscar<T>(caminho: string): Promise<T> {
  let promessa = cache.get(caminho)
  if (!promessa) {
    promessa = fetch(caminho).then(async (resposta) => {
      if (!resposta.ok) {
        throw new Error(`A API respondeu ${resposta.status} em ${caminho}`)
      }
      return resposta.json()
    })
    promessa.catch(() => cache.delete(caminho))
    cache.set(caminho, promessa)
  }
  return promessa as Promise<T>
}

export function useApi<T>(caminho: string): RespostaApi<T> {
  const [estado, setEstado] = useState<{
    caminho: string
    dados: T | null
    erro: string | null
  }>({ caminho: "", dados: null, erro: null })

  useEffect(() => {
    let ativo = true
    buscar<T>(caminho).then(
      (dados) => ativo && setEstado({ caminho, dados, erro: null }),
      (erro: Error) =>
        ativo &&
        setEstado({
          caminho,
          dados: null,
          erro: erro.message.startsWith("A API")
            ? erro.message
            : "Não foi possível falar com a API. Ela está rodando (npm run dev)?",
        })
    )
    return () => {
      ativo = false
    }
  }, [caminho])

  const atual = estado.caminho === caminho
  return {
    dados: atual ? estado.dados : null,
    erro: atual ? estado.erro : null,
    carregando: !atual,
  }
}
