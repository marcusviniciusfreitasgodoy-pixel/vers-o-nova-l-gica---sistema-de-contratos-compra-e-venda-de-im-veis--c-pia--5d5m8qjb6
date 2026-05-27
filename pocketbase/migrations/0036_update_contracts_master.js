migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')

    const newFields = [
      { name: 'data_nascimento_comprador', type: 'date' },
      { name: 'data_nascimento_vendedor', type: 'date' },
      { name: 'cep_comprador', type: 'text' },
      { name: 'cep_vendedor', type: 'text' },
      { name: 'nome_conjuge_comprador', type: 'text' },
      { name: 'cpf_conjuge_comprador', type: 'text' },
      { name: 'rg_conjuge_comprador', type: 'text' },
      { name: 'cpf_conjuge_vendedor', type: 'text' },
      { name: 'rg_conjuge_vendedor', type: 'text' },
      { name: 'cpf_procurador_comprador', type: 'text' },
      { name: 'instrumento_procurador_comprador', type: 'text' },
      { name: 'cpf_procurador_vendedor', type: 'text' },
      { name: 'instrumento_procurador_vendedor', type: 'text' },
      { name: 'bairro_imovel', type: 'text' },
      { name: 'cidade_imovel', type: 'text' },
      { name: 'estado_imovel', type: 'text' },
      { name: 'cep_imovel', type: 'text' },
      { name: 'numero_imovel', type: 'text' },
      { name: 'complemento_imovel', type: 'text' },
      { name: 'quartos', type: 'number' },
      { name: 'suites', type: 'number' },
      { name: 'acoes_judiciais', type: 'bool' },
      { name: 'vistoria_obrigatoria', type: 'bool' },
      { name: 'data_assinatura', type: 'date' },
      { name: 'data_quitacao', type: 'date' },
    ]

    for (const f of newFields) {
      if (!col.fields.getByName(f.name)) {
        if (f.type === 'text') col.fields.add(new TextField({ name: f.name }))
        if (f.type === 'number') col.fields.add(new NumberField({ name: f.name }))
        if (f.type === 'bool') col.fields.add(new BoolField({ name: f.name }))
        if (f.type === 'date') col.fields.add(new DateField({ name: f.name }))
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contracts')
    const newFields = [
      'data_nascimento_comprador',
      'data_nascimento_vendedor',
      'cep_comprador',
      'cep_vendedor',
      'nome_conjuge_comprador',
      'cpf_conjuge_comprador',
      'rg_conjuge_comprador',
      'cpf_conjuge_vendedor',
      'rg_conjuge_vendedor',
      'cpf_procurador_comprador',
      'instrumento_procurador_comprador',
      'cpf_procurador_vendedor',
      'instrumento_procurador_vendedor',
      'bairro_imovel',
      'cidade_imovel',
      'estado_imovel',
      'cep_imovel',
      'numero_imovel',
      'complemento_imovel',
      'quartos',
      'suites',
      'acoes_judiciais',
      'vistoria_obrigatoria',
      'data_assinatura',
      'data_quitacao',
    ]
    for (const name of newFields) {
      col.fields.removeByName(name)
    }
    app.save(col)
  },
)
