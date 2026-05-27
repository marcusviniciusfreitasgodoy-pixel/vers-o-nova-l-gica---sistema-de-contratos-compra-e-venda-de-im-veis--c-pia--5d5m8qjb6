migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new RelationField({
        name: 'company',
        collectionId: app.findCollectionByNameOrId('companies').id,
        maxSelect: 1,
      }),
    )
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('company')
    app.save(users)
  },
)
