migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('expert_proposals')
    col.listRule =
      "@request.auth.id != '' && (request.user = @request.auth.id || @request.auth.is_admin = true)"
    col.viewRule =
      "@request.auth.id != '' && (request.user = @request.auth.id || @request.auth.is_admin = true)"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('expert_proposals')
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    app.save(col)
  },
)
