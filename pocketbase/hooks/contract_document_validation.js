onRecordUpdate((e) => {
  const tipo_documento = e.record.getString('tipo_documento')

  // Skip strict validations (including financing check relaxation) for specific document types
  if (
    [
      'recibo_sinal',
      'autorizacao_intermediacao',
      'distrato',
      'ficha_cadastral',
      'checklist_documental',
      'termo_entrega_chaves',
      'termo_posse',
      'declaracoes_complementares',
    ].includes(tipo_documento)
  ) {
    return e.next()
  }

  const originalMatricula = e.record.original().getString('matricula_file')
  const currentMatricula = e.record.getString('matricula_file')
  const originalIptu = e.record.original().getString('iptu_file')
  const currentIptu = e.record.getString('iptu_file')

  const isMatriculaChanged = currentMatricula !== originalMatricula
  const isIptuChanged = currentIptu !== originalIptu

  if (!isMatriculaChanged && !isIptuChanged) {
    return e.next()
  }

  const hasMatricula = !!currentMatricula
  const hasIptu = !!currentIptu

  const currentChecklist = e.record.get('compliance_checklist') || {}
  const compliance_checklist = JSON.parse(JSON.stringify(currentChecklist))
  compliance_checklist['matricula'] = hasMatricula
  compliance_checklist['iptu'] = hasIptu
  e.record.set('compliance_checklist', compliance_checklist)

  if (currentMatricula || currentIptu) {
    const reportCollection = $app.findCollectionByNameOrId('analysis_reports')
    const report = new Record(reportCollection)
    report.set('user', e.record.get('user'))
    report.set('contract', e.record.id)
    report.set('file_name', 'Documentos Anexados (Lei 7.433/85)')

    let risk_level = 'baixo'
    let summary = 'Documentos validados conforme a Lei 7.433/85.'
    let missing = []
    let found = []

    if (hasMatricula) {
      found.push('Certidão de Matrícula (Atualizada)')
    } else {
      missing.push('Certidão de Matrícula (Atualizada)')
      risk_level = 'alto'
      summary = 'A Certidão de Matrícula é obrigatória por lei para a lavratura da escritura.'
    }

    if (hasIptu) {
      found.push('Certidão de Quitação Fiscal (IPTU)')
    } else {
      missing.push('Certidão de Quitação Fiscal (IPTU)')
      if (risk_level !== 'alto') risk_level = 'medio'
      summary =
        'Faltam certidões fiscais (IPTU). A ausência pode gerar responsabilização tributária ao comprador.'
    }

    const analysis_result = {
      conformidade: {
        status: risk_level === 'baixo' ? 'conforme' : risk_level === 'medio' ? 'risco' : 'critico',
        clausulasEncontradas: found,
        clausulasFaltando: missing,
      },
      riscos: missing.map((m) => ({
        titulo: `Ausência de ${m}`,
        descricao: `Documento exigido pela Lei 7.433/85 não foi encontrado ou está desatualizado.`,
        severidade: 'ALTO',
        embasamento: 'Lei 7.433/85, Art. 1º, § 2º',
      })),
      omissoes: [],
      clausulasAbusivas: [],
      recomendacoes: {
        imediatas: missing.map((m) => `Providenciar ${m} atualizada.`),
        recomendadas: ['Verificar validade das certidões (normalmente 30 dias).'],
      },
      rag_sources: [
        {
          titulo: 'Lei 7.433/85 - Requisitos para Escritura Pública',
          categoria: 'checklist_documental',
        },
      ],
    }

    report.set('analysis_result', analysis_result)
    report.set('summary', summary)
    report.set('risk_level', risk_level)

    $app.saveNoValidate(report)
  }

  return e.next()
}, 'contracts')
