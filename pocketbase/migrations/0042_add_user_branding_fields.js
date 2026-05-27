migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('header_content')) {
      users.fields.add(new TextField({ name: 'header_content' }))
    }
    if (!users.fields.getByName('footer_content')) {
      users.fields.add(new TextField({ name: 'footer_content' }))
    }
    if (!users.fields.getByName('imobiliaria_logo')) {
      users.fields.add(
        new FileField({
          name: 'imobiliaria_logo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
        }),
      )
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('header_content')
    users.fields.removeByName('footer_content')
    users.fields.removeByName('imobiliaria_logo')
    app.save(users)
  },
)
