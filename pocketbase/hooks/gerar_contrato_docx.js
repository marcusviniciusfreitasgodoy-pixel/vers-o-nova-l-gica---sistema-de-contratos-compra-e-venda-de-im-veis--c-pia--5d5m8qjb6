routerAdd(
  'POST',
  '/backend/v1/gerar-contrato-docx',
  (e) => {
    try {
      const body = e.requestInfo().body
      if (!body) return e.badRequestError('Dados do contrato não fornecidos.')

      const formatCurrency = (val) => {
        if (val == null || val === '') return 'R$ 0,00'
        const num = Number(val)
        if (isNaN(num)) return 'R$ 0,00'
        const parts = num.toFixed(2).split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        return 'R$ ' + parts.join(',')
      }

      const formatDate = (dateStr) => {
        if (!dateStr) return '[data]'
        try {
          const d = new Date(dateStr)
          if (isNaN(d.getTime())) return '[data]'
          const day = String(d.getUTCDate()).padStart(2, '0')
          const month = String(d.getUTCMonth() + 1).padStart(2, '0')
          const year = d.getUTCFullYear()
          return `${day}/${month}/${year}`
        } catch {
          return '[data]'
        }
      }

      let {
        tipo,
        template_id,
        tipo_documento,
        minuta_texto,
        minuta_html,
        header_content,
        footer_content,
        nome_vendedor,
        nome_comprador,
        cpf_vendedor,
        cpf_comprador,
        rg_vendedor,
        rg_comprador,
        orgao_emissor_vendedor,
        orgao_emissor_comprador,
        nacionalidade_vendedor,
        nacionalidade_comprador,
        estado_civil_vendedor,
        estado_civil_comprador,
        profissao_vendedor,
        profissao_comprador,
        endereco_vendedor,
        endereco_comprador,
        email_vendedor,
        email_comprador,
        telefone_vendedor,
        telefone_comprador,
        endereco_imovel,
        matricula_imovel,
        rgi_imovel,
        inscricao_municipal,
        area_total,
        vagas_garagem,
        valor_total,
        valor_sinal,
        valor_saldo,
        comissao,
        valor_reforco,
        valor_complemento,
        valor_financiado,
        instituicao_financeira,
        data_pagamento_saldo,
        permuta_imovel_endereco,
        permuta_imovel_matricula,
        permuta_imovel_valor,
        permuta_imovel_detalhes,
        vendedor_banco,
        vendedor_agencia,
        vendedor_conta,
        vendedor_pix,
        user_details,
        imovel_locado,
        imovel_inventario,
        uso_fgts,
        vendedor_casado,
        nome_conjuge,
        regime_bens,
      } = body

      if (template_id) {
        try {
          const tpl = $app.findRecordById('contract_templates', template_id)
          const tplData = tpl.get('template_data') || {}
          if (!header_content && tplData.header_content) header_content = tplData.header_content
          if (!footer_content && tplData.footer_content) footer_content = tplData.footer_content
          if (!minuta_html && tplData.minuta_html) minuta_html = tplData.minuta_html
          if (!minuta_texto && tplData.minuta_texto) minuta_texto = tplData.minuta_texto
        } catch (e) {
          // ignore
        }
      }

      const hojeDate = new Date()
      const hojeDay = String(hojeDate.getUTCDate()).padStart(2, '0')
      const hojeMonth = String(hojeDate.getUTCMonth() + 1).padStart(2, '0')
      const hojeYear = hojeDate.getUTCFullYear()
      const hoje = `${hojeDay}/${hojeMonth}/${hojeYear}`

      let bodyContent = ''

      if (minuta_html) {
        bodyContent = minuta_html
      } else if (minuta_texto) {
        if (
          minuta_texto.includes('<p>') ||
          minuta_texto.includes('<h1>') ||
          minuta_texto.includes('<table>')
        ) {
          bodyContent = minuta_texto
        } else {
          bodyContent = minuta_texto
            .split('\n')
            .map((line) =>
              line.trim() === '' ? '<br>' : `<p style="margin: 0 0 10px 0;">${line}</p>`,
            )
            .join('')
        }
      } else {
        const pgtoHTML =
          tipo === 'a_vista'
            ? `
          <ul>
            <li>Sinal: ${formatCurrency(valor_sinal)} (por extenso).</li>
            ${valor_reforco && Number(valor_reforco) > 0 ? `<li>Reforço de Sinal: ${formatCurrency(valor_reforco)} (por extenso).</li>` : ''}
            ${valor_complemento && Number(valor_complemento) > 0 ? `<li>Complemento: ${formatCurrency(valor_complemento)} (por extenso).</li>` : ''}
            ${valor_saldo && Number(valor_saldo) > 0 ? `<li>Saldo: ${formatCurrency(valor_saldo)} (por extenso), com vencimento em ${formatDate(data_pagamento_saldo)}.</li>` : ''}
            ${permuta_imovel_valor && Number(permuta_imovel_valor) > 0 ? `<li>Da Permuta/Dação: ${formatCurrency(permuta_imovel_valor)} (por extenso), correspondente ao imóvel da matrícula ${permuta_imovel_matricula}, localizado em ${permuta_imovel_endereco}.</li>` : ''}
            <li>Comissão: ${formatCurrency(comissao)} (por extenso).</li>
          </ul>
        `
            : `        <ul>
          <li>Sinal: ${formatCurrency(valor_sinal)} (por extenso).</li>
          <li>Reforço de Sinal: ${formatCurrency(valor_reforco)} (por extenso).</li>
          <li>Complemento: ${formatCurrency(valor_complemento)} (por extenso).</li>
          <li>Valor Financiado: ${formatCurrency(valor_financiado)} (por extenso)${instituicao_financeira ? `, através da instituição financeira ${instituicao_financeira}` : ''}.</li>
          ${permuta_imovel_valor && Number(permuta_imovel_valor) > 0 ? `<li>Da Permuta/Dação: ${formatCurrency(permuta_imovel_valor)} (por extenso), correspondente ao imóvel da matrícula ${permuta_imovel_matricula}, localizado em ${permuta_imovel_endereco}.</li>` : ''}
          <li>Comissão: ${formatCurrency(comissao)} (por extenso).</li>
        </ul>
      `

        const sellerBankInfo = vendedor_banco
          ? `
        <p>Os pagamentos devidos ao VENDEDOR deverão ser efetuados na seguinte conta bancária:</p>
        <p>Banco: ${vendedor_banco}, Agência: ${vendedor_agencia}, Conta: ${vendedor_conta}, Chave Pix: ${vendedor_pix}.</p>
      `
          : ''

        const user = user_details || {}
        const brokerBankInfo = user.banco_nome
          ? `
        <p>O pagamento da comissão de corretagem deverá ser depositado na conta bancária de titularidade de ${user.imobiliaria_nome || user.name || 'Imobiliária'}, CPF/CNPJ: ${user.imobiliaria_documento || ''}, CRECI: ${user.creci || ''}.</p>
        <p>Banco: ${user.banco_nome}, Agência: ${user.agencia}, Conta: ${user.conta}, Chave Pix: ${user.chave_pix}.</p>
      `
          : ''

        let clauseNum = 4
        const financiamentoClause =
          valor_financiado && Number(valor_financiado) > 0
            ? `
        <h3>Cláusula ${clauseNum++}ª - Do Financiamento Bancário</h3>
        <p>Sendo parte do pagamento realizada através de financiamento bancário, estabelece-se que:</p>
        <p>a) O COMPRADOR é o único e exclusivo responsável pela obtenção, aprovação e liberação do crédito junto à instituição financeira;</p>
        <p>b) Em caso de negativa de crédito por restrições no CPF/nome do COMPRADOR ou por insuficiência de renda, este deverá quitar o saldo devedor com recursos próprios no prazo máximo de 30 (trinta) dias, sob pena de rescisão contratual por sua culpa exclusiva, com a retenção do sinal pago;</p>
        <p>c) Eventuais atrasos no repasse dos valores decorrentes de entraves burocráticos no banco não isentam o COMPRADOR das responsabilidades assumidas, salvo se o atraso for comprovadamente causado por pendências na documentação do VENDEDOR ou do imóvel;</p>
        <p>d) O VENDEDOR obriga-se a fornecer toda a documentação pessoal e do imóvel exigida pelo agente financeiro no prazo assinalado pelo banco.</p>
        <br>
      `
            : ''

        const documentacaoClause = `
        <h3>Cláusula ${clauseNum++}ª - Da Documentação</h3>
        <p>As partes obrigam-se a apresentar as seguintes certidões e documentos no prazo de 10 (dez) dias corridos:</p>
        <p><strong>I - VENDEDOR:</strong></p>
        <p>a) Cópia do RG e CPF;</p>
        <p>b) Certidão de Casamento/Nascimento atualizada;</p>
        <p>c) Comprovante de residência atualizado;</p>
        <p>d) Certidão Negativa de Débitos Trabalhistas (CNDT);</p>
        <p>e) Certidões de Feitos Ajuizados (Justiça Federal, Justiça Estadual Cível e Criminal, Justiça do Trabalho);</p>
        <p>f) Certidão de Objeto e Pé (caso haja apontamentos nas certidões anteriores);</p>
        <p>g) Certidão de Protestos da comarca de domicílio do VENDEDOR e da localização do imóvel;</p>
        <br>
        <p><strong>II - IMÓVEL:</strong></p>
        <p>a) Certidão de Ônus Reais atualizada (com validade de 30 dias);</p>
        <p>b) Certidão de Quitação Fiscal/IPTU;</p>
        <p>c) Certidão de Quitação Condominial assinada pelo síndico, com cópia da ata de eleição;</p>
        <p>d) Certidão Negativa de Débitos de Taxa de Incêndio (se aplicável).</p>
        <br>
      `

        const pldftClause = `
        <h3>Cláusula ${clauseNum++}ª - Da Prevenção à Lavagem de Dinheiro (PLD-FT)</h3>
        <p>Em estrito atendimento ao Provimento CNJ nº 88/2019, o COMPRADOR declara expressamente, sob as penas da lei civil e penal, que os recursos utilizados para o pagamento do preço ajustado neste instrumento têm origem lícita e não são provenientes de qualquer infração penal. As partes declaram-se cientes de que a presente operação poderá ser comunicada ao Conselho de Controle de Atividades Financeiras (COAF) pelos notários e registradores caso se enquadre nas hipóteses de obrigatoriedade legal.</p>
        <br>
      `

        const obrigacoesClause = `
        <h3>Cláusula ${clauseNum++}ª - Das Obrigações</h3>
        <p>O VENDEDOR obriga-se a transferir o domínio, garantir a habitabilidade e quitar impostos e taxas que recaiam sobre o imóvel até a data da imissão na posse. O COMPRADOR obriga-se ao pagamento integral do preço ajustado, suportar os custos com a lavratura da escritura pública, registro imobiliário, imposto de transmissão (ITBI) e demais encargos exigíveis para a transferência da propriedade.</p>
        <br>
      `

        const posseClause = `
        <h3>Cláusula ${clauseNum++}ª - Da Posse</h3>
        <p>A posse direta do imóvel será transferida ao COMPRADOR com a efetiva entrega das chaves, o que ocorrerá no ato da assinatura da escritura pública definitiva e quitação integral do preço. Em caso de atraso na desocupação ou na entrega das chaves por culpa do VENDEDOR, este ficará sujeito ao pagamento de multa diária de R$ 300,00 (trezentos reais).</p>
        <br>
      `

        const penalidadesClause = `
        <h3>Cláusula ${clauseNum++}ª - Das Penalidades</h3>
        <p>Em caso de arrependimento ou rescisão por culpa exclusiva do COMPRADOR, este perderá em favor do VENDEDOR o valor dado a título de sinal (arras). Caso a culpa seja do VENDEDOR, este deverá devolver o sinal recebido em dobro, acrescido de atualização monetária. Em caso de mora ou atraso no pagamento de qualquer parcela, incidirá multa moratória de 2% (dois por cento) e juros de mora de 1% (um por cento) ao mês, pro rata die.</p>
        <br>
      `

        const rescisaoClause = `
        <h3>Cláusula ${clauseNum++}ª - Da Rescisão</h3>
        <p>Caso qualquer das partes descumpra o estipulado neste instrumento, a parte inocente poderá notificar a infratora, concedendo prazo de 15 (quinze) dias para sanar a falha, sob pena de rescisão de pleno direito, arcando a parte culpada com as perdas e danos e multas contratuais.</p>
        <br>
      `

        const legislacaoClause = `
        <h3>Cláusula ${clauseNum++}ª - Da Legislação</h3>
        <p>Este contrato é regido pelo Código Civil Brasileiro e demais legislações aplicáveis à espécie, declarando as partes que compreendem e aceitam seus termos, os quais refletem a real expressão de suas vontades.</p>
        <br>
      `

        const foroClause = `
        <h3>Cláusula ${clauseNum++}ª - Do Foro</h3>
        <p>Fica eleito o Foro da Comarca do Rio de Janeiro para dirimir quaisquer dúvidas oriundas deste contrato, renunciando a qualquer outro por mais privilegiado que seja.</p>
        <br>
      `

        let headerLogoHtml = `<h1 style="text-align: center; font-size: 28px; color: #0C2340;">${user?.imobiliaria_nome || 'GODOY PRIME REALTY'}</h1>`

        const nome = user?.imobiliaria_nome || 'GODOY PRIME REALTY'
        if (nome.toUpperCase().includes('GODOY PRIME REALTY') && !nome.includes('■')) {
          headerLogoHtml = `
          <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 32px; letter-spacing: 10px; color: #0C2340; margin-bottom: 5px;">GODOY</div>
            <div style="font-size: 14px; letter-spacing: 6px; color: #0C2340;">PRIME REALTY</div>
          </div>
        `
        }

        bodyContent = `
        ${headerLogoHtml}
        <p style="text-align: center; color: #0C2340;">═══════════════════════════════════════════════════════════════════════════</p>
        <br>
        <h2 style="text-align: center; font-size: 24px;">INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA</h2>
        <p>Por este instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Promessa de Compra e Venda, mediante as cláusulas e condições a seguir estabelecidas:</p>
        <br>
        
        <h3>Cláusula 1ª - Das Partes</h3>
        <p><strong>VENDEDOR:</strong> ${nome_vendedor || ''}, nacionalidade: ${nacionalidade_vendedor || ''}, estado civil: ${estado_civil_vendedor || ''}, profissão: ${profissao_vendedor || ''}, portador do RG nº ${rg_vendedor || ''} expedido por ${orgao_emissor_vendedor || ''}, inscrito no CPF sob o nº ${cpf_vendedor || ''}, residente e domiciliado em ${endereco_vendedor || ''}. E-mail: ${email_vendedor || ''}, Telefone: ${telefone_vendedor || ''}.</p>
        ${vendedor_casado ? `<p><strong>ANUENTE (Cônjuge):</strong> ${nome_conjuge || '[Nome do Cônjuge]'}, casados sob o regime de ${regime_bens || '[Regime]'}.</p>` : ''}
        <p><strong>COMPRADOR:</strong> ${nome_comprador || ''}, nacionalidade: ${nacionalidade_comprador || ''}, estado civil: ${estado_civil_comprador || ''}, profissão: ${profissao_comprador || ''}, portador do RG nº ${rg_comprador || ''} expedido por ${orgao_emissor_comprador || ''}, inscrito no CPF sob o nº ${cpf_comprador || ''}, residente e domiciliado em ${endereco_comprador || ''}. E-mail: ${email_comprador || ''}, Telefone: ${telefone_comprador || ''}.</p>
        <br>

        <h3>Cláusula 2ª - Do Objeto</h3>
        <p>O objeto do presente contrato é o imóvel (tipo: padrão), situado em ${endereco_imovel || ''}, bairro não informado, CEP não informado, Matrícula nº ${matricula_imovel || ''}, registrado no RGI de ${rgi_imovel || ''}, Inscrição Municipal nº ${inscricao_municipal || ''}, possuindo área total de ${area_total || ''} m², área construída não informada e ${vagas_garagem || ''} vaga(s) de garagem.</p>
        <br>

        <h3>Cláusula 3ª - Do Preço e Condições de Pagamento</h3>
        <p>O preço certo e ajustado para a presente compra e venda é de ${formatCurrency(valor_total)} (por extenso), que será pago da seguinte forma:</p>
        ${pgtoHTML}
        ${sellerBankInfo}
        ${brokerBankInfo}
        <br>
        
        ${financiamentoClause}
        ${documentacaoClause}
        ${pldftClause}
        ${imovel_locado ? `<h3>Cláusula ${clauseNum++}ª - Da Locação</h3><p>O imóvel encontra-se locado, tendo sido assegurado o direito de preferência nos moldes legais.</p><br>` : ''}
        ${imovel_inventario ? `<h3>Cláusula ${clauseNum++}ª - Do Inventário</h3><p>O imóvel encontra-se em processo de inventário, ficando a escritura condicionada à expedição do formal de partilha.</p><br>` : ''}
        ${obrigacoesClause}
        ${posseClause}
        ${penalidadesClause}
        ${rescisaoClause}
        ${legislacaoClause}
        ${foroClause}
        <p style="text-align: center;">═══════════════════════════════════════════════════════════════════════════</p>
        <br><br>

        <p>Rio de Janeiro, ${hoje}</p>
        <p>Foro: Comarca do Rio de Janeiro</p>
        <br><br>
        
        <p>_________________________________________________</p>
        <p>VENDEDOR: ${nome_vendedor || ''}</p>
        <br><br>
        
        <p>_________________________________________________</p>
        <p>COMPRADOR: ${nome_comprador || ''}</p>
        <br><br>
        
        <p>_________________________________________________</p>
        <p>TESTEMUNHA 1 (Nome e CPF):</p>
        <br><br>
        
        <p>_________________________________________________</p>
        <p>TESTEMUNHA 2 (Nome e CPF):</p>
      `
      }

      const getDocumentTitle = (tipo) => {
        if (!tipo) return 'MINUTA DE CONTRATO'
        const t = {
          ficha_cadastral: 'FICHA CADASTRAL',
          checklist_documental: 'CHECKLIST DOCUMENTAL',
          recibo_sinal: 'RECIBO DE SINAL',
          termo_entrega_chaves: 'TERMO DE ENTREGA DE CHAVES',
          termo_posse: 'TERMO DE POSSE',
          declaracoes_complementares: 'DECLARAÇÕES COMPLEMENTARES',
          autorizacao_intermediacao: 'AUTORIZAÇÃO DE INTERMEDIAÇÃO',
          promessa_compra_venda: 'MINUTA DE CONTRATO',
          contrato_particular: 'MINUTA DE CONTRATO',
          distrato: 'MINUTA DE CONTRATO',
        }
        return t[tipo] || 'MINUTA DE CONTRATO'
      }
      const docTitle = getDocumentTitle(tipo_documento)

      const isContractType = ['promessa_compra_venda', 'contrato_particular', 'distrato'].includes(
        tipo_documento,
      )

      let finalHtml = bodyContent
      if (!isContractType) {
        finalHtml = finalHtml.replace(/<p[^>]*>\s*MINUTA DE CONTRATO(?: - [^<]+)?\s*<\/p>/gi, '')
        finalHtml = finalHtml.replace(/MINUTA DE CONTRATO(?: - [^\n<]+)?/gi, '')
        finalHtml =
          `<div style="text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 16px; color: #0C2340;">${docTitle}</div>` +
          finalHtml
      }

      if (header_content) {
        const sanitizedHeader = header_content.replace(/Assessoria Jurídica Imobiliária/gi, '')
        finalHtml =
          `<div style="text-align: center; margin-bottom: 30px; font-weight: bold; color: #555;">${sanitizedHeader.replace(/\n/g, '<br>')}</div>` +
          finalHtml
      }

      if (footer_content) {
        const sanitizedFooter = footer_content.replace(/Assessoria Jurídica Imobiliária/gi, '')
        finalHtml =
          finalHtml +
          `<div style="text-align: center; margin-top: 50px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #777;">${sanitizedFooter.replace(/\n/g, '<br>')}</div>`
      }

      // Cleanup markdown in case it was missed
      finalHtml = finalHtml
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

      const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Contrato</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; text-align: justify; }
      h1 { font-size: 16pt; font-weight: bold; text-align: center; }
      h2 { font-size: 14pt; font-weight: bold; text-align: center; }
      h3 { font-size: 12pt; font-weight: bold; }
      p { margin: 0 0 12pt 0; text-align: justify; }
      strong, b { font-weight: bold; }
      ul, ol { margin-top: 0; margin-bottom: 12pt; }
      li { margin-bottom: 6pt; }
    </style>
    </head>
    <body>
      ${finalHtml}
    </body>
    </html>
  `

      const sanitizeFilename = (str) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]/g, '_')
      }

      let baseName = 'Documento'
      const namePart = nome_comprador || nome_vendedor || ''

      if (docTitle) {
        baseName = sanitizeFilename(docTitle)
      }

      if (namePart) {
        baseName = `${baseName}_${sanitizeFilename(namePart)}`
      }

      const filename = `${baseName}.docx`
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/_\./g, '.')

      return e.json(200, { filename, html })
    } catch (err) {
      if (err.name === 'Error' && err.message.includes('ApiError')) throw err
      try {
        const errorLog = new Record($app.findCollectionByNameOrId('system_error_logs'))
        errorLog.set('error_message', err.message || 'Unknown error')
        errorLog.set('stack_trace', err.stack || '')
        errorLog.set('component', 'gerar_contrato_docx')
        errorLog.set('route', '/backend/v1/gerar-contrato-docx')
        errorLog.set('severity', 'critical')
        errorLog.set('context_data', e.requestInfo().body || {})
        if (e.auth && e.auth.id) {
          errorLog.set('user', e.auth.id)
        }
        $app.save(errorLog)
      } catch (logErr) {
        $app.logger().error('Failed to log system error', 'error', logErr.message)
      }
      return e.internalServerError('Erro interno: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
