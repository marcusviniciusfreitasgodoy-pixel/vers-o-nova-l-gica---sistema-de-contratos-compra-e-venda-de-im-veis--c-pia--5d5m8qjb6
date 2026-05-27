migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('legal_knowledge')

    const seeds = [
      {
        title: 'Padrão Godoy Prime Realty - Documentação Exaustiva (Prazo de 10 dias)',
        content:
          'Em todos os contratos de compra e venda elaborados sob o padrão Godoy Prime Realty, a Cláusula de Documentação deve exigir obrigatoriamente e de forma explícita que os documentos sejam apresentados no prazo de 10 (dez) dias corridos. A lista exaustiva é composta por: VENDEDOR (Cópia do RG e CPF, Certidão de Casamento/Nascimento atualizada, Comprovante de residência atualizado, Certidão Negativa de Débitos Trabalhistas - CNDT, Certidões de Feitos Ajuizados da Justiça Federal, Estadual e do Trabalho, Certidão de Objeto e Pé, e Certidão de Protestos da comarca de domicílio do VENDEDOR e da localização do imóvel); IMÓVEL (Certidão de Ônus Reais atualizada, Certidão de Quitação Fiscal/IPTU, Certidão de Quitação Condominial assinada pelo síndico com ata de eleição, e Certidão Negativa de Débitos de Taxa de Incêndio se aplicável). Contratos contendo exatamente esta lista e o prazo de 10 dias estão 100% em conformidade documental.',
        category: 'boas_praticas',
      },
      {
        title: 'Padrão Godoy Prime Realty - Cláusula de Financiamento',
        content:
          "A Cláusula de Financiamento padrão da Godoy Prime Realty determina que: a) O COMPRADOR é o único e exclusivo responsável pela obtenção do crédito; b) Em caso de negativa de crédito por qualquer motivo (restrições ou insuficiência de renda), este deverá quitar o saldo devedor com recursos próprios no prazo máximo de 30 (trinta) dias, sob pena de rescisão por sua culpa exclusiva, com retenção do sinal; c) Atrasos burocráticos do banco não isentam o COMPRADOR das responsabilidades assumidas, salvo se o atraso for causado por pendências do VENDEDOR; d) O VENDEDOR deve fornecer a documentação exigida no prazo do banco. Quando o contrato apresentar esta cláusula exatamente com estes itens, não há omissões ou riscos em relação à forma de pagamento, e o status de conformidade deve ser 'conforme'.",
        category: 'boas_praticas',
      },
    ]

    for (const seed of seeds) {
      try {
        app.findFirstRecordByData('legal_knowledge', 'title', seed.title)
      } catch (_) {
        const record = new Record(col)
        record.set('title', seed.title)
        record.set('content', seed.content)
        record.set('category', seed.category)
        app.save(record)
      }
    }
  },
  (app) => {
    const titles = [
      'Padrão Godoy Prime Realty - Documentação Exaustiva (Prazo de 10 dias)',
      'Padrão Godoy Prime Realty - Cláusula de Financiamento',
    ]
    for (const t of titles) {
      try {
        const record = app.findFirstRecordByData('legal_knowledge', 'title', t)
        app.delete(record)
      } catch (_) {}
    }
  },
)
