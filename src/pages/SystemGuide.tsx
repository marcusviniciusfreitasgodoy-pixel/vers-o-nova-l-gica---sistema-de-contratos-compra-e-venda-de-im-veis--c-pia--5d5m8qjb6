import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { BookOpen, Map, Scale, HelpCircle } from 'lucide-react'

export default function SystemGuide() {
  return (
    <div className="container mx-auto p-6 max-w-5xl animate-in fade-in space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Guia do Sistema</h1>
        <p className="text-lg text-slate-600">
          Aprenda a utilizar o novo fluxo de negociações e a lógica jurídica por trás de cada etapa.
        </p>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="visao-geral" className="flex items-center justify-center gap-2 py-3">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="fluxo" className="flex items-center justify-center gap-2 py-3">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Fluxo de Negociação</span>
            <span className="sm:hidden">Fluxo</span>
          </TabsTrigger>
          <TabsTrigger value="logica" className="flex items-center justify-center gap-2 py-3">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Lógica Jurídica</span>
            <span className="sm:hidden">Jurídico</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center justify-center gap-2 py-3">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
            <span className="sm:hidden">FAQ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo ao novo sistema de negociações</CardTitle>
              <CardDescription>Entenda o propósito e as vantagens do novo fluxo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                O sistema evoluiu de um mero gerador de documentos para uma{' '}
                <strong>plataforma de gestão de negociações por fases</strong>. Isso significa que
                agora o sistema acompanha a evolução real do seu negócio imobiliário.
              </p>
              <p>
                Ao invés de gerar um contrato isolado, você cria um{' '}
                <strong>Caso de Negociação</strong>, que passa por 4 fases fundamentais. Em cada
                fase, o sistema coleta os dados necessários e sugere ou gera automaticamente os
                documentos e checklists pertinentes, garantindo a segurança jurídica e reduzindo
                riscos.
              </p>
              <h3 className="font-semibold text-slate-900 mt-6">
                Por que mudar para o novo fluxo?
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Segurança (Compliance):</strong> Documentos gerados com base na evolução
                  dos dados confirmados.
                </li>
                <li>
                  <strong>Organização:</strong> Todas as informações das partes, imóveis e termos do
                  negócio ficam centralizadas em um único caso.
                </li>
                <li>
                  <strong>Agilidade:</strong> Preenchimento progressivo evita a necessidade de
                  redigitar dados.
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>As 4 Fases da Transação</CardTitle>
              <CardDescription>
                Como funciona cada etapa do novo fluxo de negociação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="fase1">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Fase 1: Qualificação e Viabilidade
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 space-y-3 pt-2">
                    <p>
                      O início do negócio. Aqui você insere as informações básicas das partes e do
                      imóvel.
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Cadastro de Partes (Comprador, Vendedor).</li>
                      <li>Cadastro do Imóvel (Matrícula, IPTU).</li>
                      <li>Geração da Ficha Cadastral e Autorização de Intermediação.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="fase2">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Fase 2: Proposta e Sinal
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 space-y-3 pt-2">
                    <p>Formalização da intenção de compra e travamento do negócio.</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Registro das condições da proposta (valor, forma de pagamento).</li>
                      <li>Pagamento de Sinal (Arras).</li>
                      <li>Geração do Recibo de Sinal com a correta tipificação.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="fase3">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Fase 3: Promessa e Financiamento
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 space-y-3 pt-2">
                    <p>A fase principal, onde o compromisso irrevogável é firmado.</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Geração da Promessa de Compra e Venda (documento mais importante).</li>
                      <li>
                        Inclusão de cláusulas resolutivas ou suspensivas (ex: aprovação de
                        financiamento).
                      </li>
                      <li>Acompanhamento de prazos e condições acordadas.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="fase4">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Fase 4: Encerramento e Posse
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 space-y-3 pt-2">
                    <p>Finalização da transação com a entrega das chaves e escritura.</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Geração do Termo de Posse e Entrega de Chaves.</li>
                      <li>Minuta de Escritura ou Contrato com Força de Escritura.</li>
                      <li>Geração do Distrato (caso a negociação seja cancelada).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logica" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lógica Jurídica Aplicada</CardTitle>
              <CardDescription>
                Como o sistema protege sua transação automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="arras">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Arras: Confirmatórias vs Penitenciais
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 space-y-3 pt-2">
                    <p>
                      O sistema sugere a base legal correta dependendo do tipo de sinal escolhido:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Confirmatórias (Regra Geral):</strong> Não permite direito de
                        arrependimento. Se o comprador desistir, perde o sinal. Se o vendedor
                        desistir, devolve em dobro. O sistema aplica os Artigos 418 e 419 do Código
                        Civil.
                      </li>
                      <li>
                        <strong>Penitenciais:</strong> Permite o direito de arrependimento,
                        funcionando como uma "multa" pré-fixada. O sistema aplica o Artigo 420 do
                        Código Civil.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="distrato">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Cálculo de Retenção no Distrato
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 space-y-3 pt-2">
                    <p>
                      Quando um negócio não prossegue, o sistema auxilia na rescisão aplicando a Lei
                      do Distrato (Lei 13.786/18) e jurisprudência (Súmula 543 do STJ).
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Facilita o cálculo dos valores a serem devolvidos ou retidos.</li>
                      <li>
                        Considera retenções permitidas (geralmente entre 10% a 25% dos valores
                        pagos, dependendo da culpa).
                      </li>
                      <li>
                        Gera o instrumento de Distrato com quitação mútua para evitar passivos
                        judiciais futuros.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="compliance">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Checklist de Compliance
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 space-y-3 pt-2">
                    <p>
                      O sistema vincula a exigência de certidões negativas e diligências de acordo
                      com o risco da operação, garantindo a boa-fé objetiva (Art. 422 CC) e evitando
                      alegações de fraude à execução ou contra credores.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
              <CardDescription>Dúvidas comuns sobre a utilização do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq1">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    Como gero um documento no novo fluxo?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 pt-2">
                    Diferente das ferramentas legadas onde você gerava um documento avulso, no novo
                    fluxo você deve acessar o seu "Caso", navegar até a aba da Fase correspondente
                    (ex: Fase 3 para Promessa) e clicar no botão para gerar o documento respectivo.
                    O sistema já trará os dados previamente cadastrados de forma automática.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq2">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    Como funciona a integração com assinatura digital?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 pt-2">
                    Ao configurar e gerar documentos como a Promessa de Compra e Venda, o sistema
                    prevê a coleta de dados de assinatura (como nome e e-mail). A versão gerada
                    estará pronta para ser exportada e inserida em plataformas como Clicksign ou
                    DocuSign.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq3">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    Posso pular alguma fase?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 pt-2">
                    O sistema permite certa flexibilidade para acomodar negociações mais simples,
                    porém é fortemente recomendado que as etapas de Sinal e Promessa de Compra e
                    Venda não sejam ignoradas, pois elas formam a base das garantias jurídicas.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq4">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    Como acessar meus contratos antigos?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 pt-2">
                    Os contratos gerados através do menu antigo continuam perfeitamente acessíveis
                    na opção "Ferramentas Legadas &gt; Meus Documentos" (ou através da aba antiga de
                    Contratos). Para novos negócios, inicie sempre pelo botão "Nova Negociação".
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
