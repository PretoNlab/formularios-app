import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Política de Privacidade · formularios.ia",
  description: "Política de Privacidade do formularios.ia — conformidade com a LGPD",
}

export default function PrivacyPage() {
  const updatedAt = "8 de março de 2026"

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm">formularios.ia</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/signup">Criar conta grátis</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl py-16 px-4">
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="text-muted-foreground text-sm">Última atualização: {updatedAt}</p>
          <p className="text-muted-foreground text-sm">
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Controlador dos Dados</h2>
            <p>
              O formularios.ia é responsável pelo tratamento dos dados pessoais coletados por meio
              da plataforma. Para exercer seus direitos ou tirar dúvidas, entre em contato pelo
              e-mail{" "}
              <a href="mailto:privacidade@formularios.ia" className="text-foreground underline underline-offset-4">
                privacidade@formularios.ia
              </a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Dados que Coletamos</h2>
            <p><strong>Dados de criadores de formulários (usuários cadastrados):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Nome e endereço de e-mail (fornecidos no cadastro)</li>
              <li>Dados de uso da plataforma (formulários criados, acessos, configurações)</li>
              <li>Informações de pagamento (processadas por terceiros — não armazenamos dados de cartão)</li>
              <li>Endereço IP e user-agent (para segurança e diagnóstico)</li>
            </ul>
            <p className="mt-2"><strong>Dados de respondentes de formulários:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Respostas fornecidas nos formulários (definidas pelo criador do formulário)</li>
              <li>Hash anonimizado do endereço IP (para prevenção de abuso — não permite identificação)</li>
              <li>User-agent do navegador</li>
              <li>Timestamp de início e conclusão do formulário</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Finalidade e Base Legal</h2>
            <div className="space-y-2">
              <p><strong>Para criadores de formulários:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Execução de contrato: prestação do Serviço contratado</li>
                <li>Legítimo interesse: segurança, prevenção de fraudes e melhoria do Serviço</li>
                <li>Cumprimento de obrigação legal: retenção de dados conforme exigido por lei</li>
              </ul>
              <p className="mt-2"><strong>Para respondentes:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Consentimento: ao preencher o formulário, o respondente consente com a coleta das respostas conforme informado pelo criador do formulário</li>
                <li>Legítimo interesse: hash de IP para prevenção de spam e abuso</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p>Compartilhamos dados apenas com:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Supabase:</strong> infraestrutura de banco de dados e autenticação (dados armazenados no Brasil ou EUA com cláusulas contratuais padrão)</li>
              <li><strong>Vercel:</strong> hospedagem da aplicação</li>
              <li><strong>Resend:</strong> envio de e-mails transacionais</li>
              <li><strong>Autoridades competentes:</strong> quando exigido por lei</li>
            </ul>
            <p className="mt-2">
              Não vendemos dados pessoais. Não compartilhamos dados com terceiros para fins de marketing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Retenção de Dados</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Dados de conta: mantidos enquanto a conta estiver ativa + 30 dias após exclusão</li>
              <li>Dados de respostas: mantidos enquanto o formulário existir</li>
              <li>Logs de segurança: 90 dias</li>
              <li>Dados fiscais: conforme exigido pela legislação brasileira (5 anos)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Seus Direitos (LGPD)</h2>
            <p>Como titular de dados, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Acesso:</strong> obter confirmação e cópia dos dados tratados</li>
              <li><strong>Correção:</strong> solicitar atualização de dados incompletos ou incorretos</li>
              <li><strong>Eliminação:</strong> solicitar exclusão de dados (quando não houver obrigação legal de retenção)</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong>Revogação do consentimento:</strong> a qualquer momento, sem prejuízo da licitude do tratamento anterior</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento baseado em legítimo interesse</li>
              <li><strong>Informação:</strong> saber com quais entidades compartilhamos seus dados</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, entre em contato:{" "}
              <a href="mailto:privacidade@formularios.ia" className="text-foreground underline underline-offset-4">
                privacidade@formularios.ia
              </a>. Responderemos em até 15 dias úteis.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Criptografia em trânsito (TLS/HTTPS) e em repouso</li>
              <li>Acesso restrito aos dados por princípio de menor privilégio</li>
              <li>Hash de IPs para anonimização</li>
              <li>Autenticação segura via Supabase Auth</li>
              <li>Monitoramento de segurança contínuo</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Cookies</h2>
            <p>
              Utilizamos cookies estritamente necessários para autenticação e funcionamento da plataforma.
              Não utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Transferência Internacional</h2>
            <p>
              Alguns de nossos fornecedores de infraestrutura podem armazenar dados fora do Brasil.
              Quando isso ocorre, garantimos que a transferência seja realizada com salvaguardas
              adequadas (cláusulas contratuais padrão ou país com nível de proteção equivalente).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Menores de Idade</h2>
            <p>
              Nosso Serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente
              dados de menores. Se você acredita que coletamos dados de um menor, entre em contato
              para que possamos removê-los imediatamente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. Formulários de Terceiros</h2>
            <p>
              Ao responder um formulário criado por outro usuário, seus dados são tratados tanto pelo
              formularios.ia (para fins de infraestrutura e segurança) quanto pelo criador do
              formulário (para os fins que ele definiu). O criador do formulário é responsável
              por obter seu consentimento e informar o uso dos dados coletados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">12. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política periodicamente. Notificaremos alterações significativas
              por e-mail com 15 dias de antecedência. A versão em vigor é sempre a publicada nesta página.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">13. Encarregado (DPO)</h2>
            <p>
              Nosso Encarregado de Proteção de Dados pode ser contatado pelo e-mail{" "}
              <a href="mailto:privacidade@formularios.ia" className="text-foreground underline underline-offset-4">
                privacidade@formularios.ia
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} formularios.ia</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">Termos</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors font-medium text-foreground">Privacidade</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
