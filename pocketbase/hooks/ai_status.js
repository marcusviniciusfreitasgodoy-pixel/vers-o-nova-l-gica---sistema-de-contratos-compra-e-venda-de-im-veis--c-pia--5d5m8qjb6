routerAdd(
  'GET',
  '/backend/v1/ai-status',
  (e) => {
    const hasKey = !!(
      $secrets.get('ANTHROPIC_API_KEY') ||
      $secrets.get('OPENAI_API_KEY') ||
      $secrets.get('GEMINI_API_KEY')
    )
    return e.json(200, { hasKey })
  },
  $apis.requireAuth(),
)
