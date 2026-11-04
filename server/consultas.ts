export const ANO_INICIO = 2000
export const ANO_FIM = 2025

export const consultas = {
  ufAno: `
    with pop as (
      select m.uf_cod, p.ano, sum(p.populacao)::int as populacao
      from populacao_municipio_ano p
      join municipio m using (cod_mun7)
      where m.uf_cod between 21 and 29 and p.ano between $1 and $2
      group by m.uf_cod, p.ano
    ),
    casos as (
      select m.uf_cod, n.ano,
        count(*) filter (where not n.possivel_duplicata)::int as casos,
        count(*)::int as casos_com_duplicatas,
        count(*) filter (where n.caso_confirmado and not n.possivel_duplicata)::int as confirmados,
        count(*) filter (where n.classificacao in ('2', '11') and not n.possivel_duplicata)::int as alarme,
        count(*) filter (where n.classificacao in ('3', '4', '12') and not n.possivel_duplicata)::int as graves,
        count(*) filter (where n.evolucao = '2' and not n.possivel_duplicata)::int as obitos
      from notificacao_dengue_ne n
      join municipio m using (cod_mun7)
      where n.caso_provavel and n.ano between $1 and $2
      group by m.uf_cod, n.ano
    )
    select e.sigla, e.nome, pop.ano, pop.populacao,
      coalesce(c.casos, 0) as casos,
      coalesce(c.casos_com_duplicatas, 0) as "casosComDuplicatas",
      coalesce(c.confirmados, 0) as confirmados,
      coalesce(c.alarme, 0) as alarme,
      coalesce(c.graves, 0) as graves,
      coalesce(c.obitos, 0) as obitos
    from pop
    join estado e using (uf_cod)
    left join casos c using (uf_cod, ano)
    order by pop.ano, e.sigla
  `,
  sazonalidade: `
    select e.sigla, n.ano, n.mes_sintomas as mes, count(*)::int as casos
    from notificacao_dengue_ne n
    join municipio m using (cod_mun7)
    join estado e using (uf_cod)
    where n.caso_provavel and not n.possivel_duplicata
      and n.mes_sintomas is not null and n.ano between $1 and $2
    group by e.sigla, n.ano, n.mes_sintomas
    order by n.ano, e.sigla, n.mes_sintomas
  `,
  perfil: `
    select e.sigla, n.ano,
      case
        when n.idade_anos < 10 then '0-9'
        when n.idade_anos < 20 then '10-19'
        when n.idade_anos < 30 then '20-29'
        when n.idade_anos < 40 then '30-39'
        when n.idade_anos < 50 then '40-49'
        when n.idade_anos < 60 then '50-59'
        when n.idade_anos < 70 then '60-69'
        else '70+'
      end as faixa,
      n.sexo, count(*)::int as casos
    from notificacao_dengue_ne n
    join municipio m using (cod_mun7)
    join estado e using (uf_cod)
    where n.caso_provavel and not n.possivel_duplicata
      and n.idade_anos is not null and n.sexo is not null
      and n.ano between $1 and $2
    group by 1, 2, 3, 4
    order by 2, 1, 3, 4
  `,
  criterio: `
    select e.sigla, n.ano,
      case n.criterio
        when '1' then 'laboratorial'
        when '2' then 'clinico'
        when '3' then 'investigacao'
        else 'naoInformado'
      end as criterio,
      count(*)::int as casos
    from notificacao_dengue_ne n
    join municipio m using (cod_mun7)
    join estado e using (uf_cod)
    where n.caso_provavel and not n.possivel_duplicata and n.ano between $1 and $2
    group by 1, 2, 3
    order by 2, 1, 3
  `,
  municipios: `
    with casos as (
      select cod_mun7, count(*)::int as casos
      from notificacao_dengue_ne
      where caso_provavel and not possivel_duplicata and ano between $1 and $2
      group by cod_mun7
    ),
    pop as (
      select cod_mun7,
        sum(populacao)::int as pessoas_ano,
        max(populacao) filter (where ano = $2) as populacao
      from populacao_municipio_ano
      where ano between $1 and $2
      group by cod_mun7
    )
    select m.cod_mun7 as codigo, m.nome, e.sigla, p.populacao,
      p.pessoas_ano as "pessoasAno", coalesce(c.casos, 0) as casos
    from pop p
    join municipio m using (cod_mun7)
    join estado e using (uf_cod)
    left join casos c using (cod_mun7)
    where m.uf_cod between 21 and 29
    order by m.nome
  `,
} as const
