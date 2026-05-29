migrate(
  (app) => {
    const cases = app.findCollectionByNameOrId('cases')

    if (!cases.fields.getByName('parecer_juridico_file')) {
      cases.fields.add(
        new FileField({ name: 'parecer_juridico_file', maxSelect: 1, maxSize: 52428800 }),
      )
    }
    if (!cases.fields.getByName('data_aprovacao')) {
      cases.fields.add(new DateField({ name: 'data_aprovacao' }))
    }
    if (!cases.fields.getByName('motivo_bloqueio')) {
      cases.fields.add(new TextField({ name: 'motivo_bloqueio' }))
    }

    app.save(cases)
  },
  (app) => {
    const cases = app.findCollectionByNameOrId('cases')
    cases.fields.removeByName('parecer_juridico_file')
    cases.fields.removeByName('data_aprovacao')
    cases.fields.removeByName('motivo_bloqueio')
    app.save(cases)
  },
)
