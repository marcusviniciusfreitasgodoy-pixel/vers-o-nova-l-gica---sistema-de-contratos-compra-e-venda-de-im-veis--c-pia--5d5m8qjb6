migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!col.fields.getByName('is_admin')) {
      col.fields.add(
        new BoolField({
          name: 'is_admin',
          required: false,
          hidden: false,
          presentable: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (col.fields.getByName('is_admin')) {
      col.fields.removeByName('is_admin')
    }
    app.save(col)
  },
)
