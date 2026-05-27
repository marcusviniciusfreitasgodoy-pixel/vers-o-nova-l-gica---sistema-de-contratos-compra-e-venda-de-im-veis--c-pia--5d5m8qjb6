migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    const newFields = [
      {
        name: 'regime_bens_comprador',
        type: 'select',
        values: [
          'Comunhão Parcial',
          'Comunhão Universal',
          'Separação Total',
          'Participação Final',
          'Não se aplica',
        ],
      },
      { name: 'possui_procurador_comprador', type: 'bool' },
      { name: 'nome_procurador_comprador', type: 'text' },
      { name: 'financiamento_comprador', type: 'bool' },
      { name: 'fgts_comprador', type: 'bool' },
      {
        name: 'regime_bens_vendedor',
        type: 'select',
        values: [
          'Comunhão Parcial',
          'Comunhão Universal',
          'Separação Total',
          'Participação Final',
          'Não se aplica',
        ],
      },
      { name: 'conjuge_vendedor', type: 'text' },
      { name: 'procurador_vendedor', type: 'bool' },
      { name: 'vendedor_pj', type: 'bool' },
      { name: 'cartorio_imovel', type: 'text' },
      { name: 'inscricao_iptu', type: 'text' },
      { name: 'area_privativa', type: 'number' },
      { name: 'possui_box', type: 'bool' },
      {
        name: 'tipo_imovel',
        type: 'select',
        values: ['Apartamento', 'Casa', 'Terreno', 'Comercial'],
      },
      { name: 'possui_usufruto', type: 'bool' },
      { name: 'valor_financiamento', type: 'number' },
      { name: 'quantidade_parcelas', type: 'number' },
      { name: 'valor_parcela', type: 'number' },
      { name: 'data_pagamento_sinal', type: 'date' },
      { name: 'prazo_financiamento', type: 'number' },
      { name: 'multa_inadimplencia', type: 'number' },
      { name: 'posse_imediata', type: 'bool' },
      { name: 'multa_desocupacao', type: 'number' },
      { name: 'entrega_chaves', type: 'date' },
      { name: 'percentual_comissao', type: 'number' },
      { name: 'valor_comissao', type: 'number' },
      { name: 'data_pagamento_comissao', type: 'date' },
      { name: 'comissao_garantida', type: 'bool' },
      { name: 'assinatura_eletronica', type: 'bool' },
      {
        name: 'plataforma_assinatura',
        type: 'select',
        values: ['Clicksign', 'ZapSign', 'Docusign', 'Autentique'],
      },
      { name: 'clausula_lgpd', type: 'bool' },
      { name: 'foro_comarca', type: 'text' },
      { name: 'arbitragem', type: 'bool' },
      { name: 'mediacao', type: 'bool' },
    ]

    for (const f of newFields) {
      if (!col.fields.getByName(f.name)) {
        if (f.type === 'select') {
          col.fields.add(new SelectField({ name: f.name, values: f.values, maxSelect: 1 }))
        } else if (f.type === 'bool') {
          col.fields.add(new BoolField({ name: f.name }))
        } else if (f.type === 'text') {
          col.fields.add(new TextField({ name: f.name }))
        } else if (f.type === 'number') {
          col.fields.add(new NumberField({ name: f.name }))
        } else if (f.type === 'date') {
          col.fields.add(new DateField({ name: f.name }))
        }
      }
    }

    app.save(col)
  },
  (app) => {},
)
