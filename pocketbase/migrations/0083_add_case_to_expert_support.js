migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('expert_support_requests')
    const casesCol = app.findCollectionByNameOrId('cases')

    col.fields.add(
      new RelationField({
        name: 'case',
        type: 'relation',
        collectionId: casesCol.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('expert_support_requests')
    col.fields.removeByName('case')
    app.save(col)
  },
)
