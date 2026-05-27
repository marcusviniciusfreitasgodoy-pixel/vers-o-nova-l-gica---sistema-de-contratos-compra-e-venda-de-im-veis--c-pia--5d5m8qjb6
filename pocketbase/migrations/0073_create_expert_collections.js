migrate(
  (app) => {
    const expertSupportRequests = new Collection({
      name: 'expert_support_requests',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.is_admin = true)",
      viewRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.is_admin = true)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.is_admin = true)",
      deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'contract',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('contracts').id,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'received',
            'awaiting_info',
            'screening',
            'analyzing',
            'proposal_issued',
            'awaiting_decision',
            'accepted',
            'refused',
            'reformulating',
            'executing',
            'completed',
            'closed',
          ],
          maxSelect: 1,
        },
        {
          name: 'objective',
          type: 'select',
          required: true,
          values: [
            'technical_doubt',
            'consultative_guidance',
            'doc_analysis',
            'partial_review',
            'full_review',
            'risk_analysis',
            'talk_specialist',
          ],
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true },
        { name: 'negotiation_stage', type: 'text', required: true },
        {
          name: 'urgency',
          type: 'select',
          required: true,
          values: ['low', 'medium', 'high'],
          maxSelect: 1,
        },
        { name: 'operation_value', type: 'number', required: false },
        { name: 'property_type', type: 'text', required: false },
        { name: 'location_city_state', type: 'text', required: false },
        { name: 'critical_deadline', type: 'date', required: false },
        { name: 'notary_pending_issues', type: 'text', required: false },
        { name: 'additional_notes', type: 'text', required: false },
        { name: 'attachments', type: 'file', required: false, maxSelect: 10, maxSize: 15728640 },
        { name: 'sla_deadline', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(expertSupportRequests)

    const expertProposals = new Collection({
      name: 'expert_proposals',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
      fields: [
        {
          name: 'request',
          type: 'relation',
          required: true,
          collectionId: expertSupportRequests.id,
          maxSelect: 1,
        },
        { name: 'scope', type: 'text', required: true },
        { name: 'deadline_days', type: 'number', required: true },
        { name: 'value', type: 'number', required: true },
        {
          name: 'complexity_type',
          type: 'select',
          required: true,
          values: ['standard', 'adjusted', 'personalized'],
          maxSelect: 1,
        },
        {
          name: 'user_response',
          type: 'select',
          required: false,
          values: ['none', 'accepted', 'refused', 'reformulate'],
          maxSelect: 1,
        },
        { name: 'reformulation_notes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(expertProposals)
  },
  (app) => {
    const expertProposals = app.findCollectionByNameOrId('expert_proposals')
    app.delete(expertProposals)

    const expertSupportRequests = app.findCollectionByNameOrId('expert_support_requests')
    app.delete(expertSupportRequests)
  },
)
