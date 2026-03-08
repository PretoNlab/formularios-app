import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Termos de Uso · formularios.ia",
  description: "Termos de Uso do formularios.ia",
}

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold tracking-tight">Termos de Uso</h1>
          <p className="text-muted-foreground text-sm">Última atualização: {updatedAt}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou usar o formularios.ia ("Serviço"), você concorda com estes Termos de Uso.
              Se você não concordar, não utilize o Serviço. Estes termos constituem um contrato legal
              entre você e formularios.ia.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>
              O formularios.ia é uma plataforma online de criação e gerenciamento de formulários.
              Oferecemos ferramentas para construção, publicação e análise de formulários digitais,
              com funcionalidades de lógica condicional, temas personalizáveis e exportação de dados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Elegibilidade</h2>
            <p>
              Você deve ter pelo menos 18 anos para usar o Serviço. Ao aceitar estes termos, você
              declara que tem capacidade legal para firmar contratos. Contas empresariais devem ser
              gerenciadas por representantes legalmente autorizados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Cadastro e Conta</h2>
            <p>
              Você é responsável por manter a confidencialidade de suas credenciais de acesso.
              Notifique-nos imediatamente sobre uso não autorizado da sua conta. Não compartilhe
              sua senha. O formularios.ia não se responsabiliza por danos decorrentes do uso
              não autorizado de sua conta por falha de guarda das credenciais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Uso Aceitável</h2>
            <p>Você concorda em <strong>não</strong> usar o Serviço para:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Coletar dados pessoais sem consentimento explícito dos respondentes</li>
              <li>Criar formulários enganosos, fraudulentos ou para phishing</li>
              <li>Enviar spam ou comunicações não solicitadas</li>
              <li>Violar leis aplicáveis, incluindo a LGPD (Lei 13.709/2018)</li>
              <li>Automatizar envios em massa sem autorização</li>
              <li>Armazenar dados sensíveis como senhas, cartões de crédito ou dados de saúde sem as devidas proteções</li>
              <li>Tentar comprometer a segurança ou estabilidade da plataforma</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Propriedade Intelectual</h2>
            <p>
              O formularios.ia e seus conteúdos (design, código, marca, textos) são protegidos por
              direitos autorais e outros direitos de propriedade intelectual. Você recebe uma licença
              limitada, não exclusiva e intransferível para usar o Serviço. Os dados e formulários
              que você cria permanecem de sua propriedade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Planos e Pagamentos</h2>
            <p>
              O Serviço oferece planos gratuitos e pagos. Os preços são exibidos na página de preços e
              podem ser alterados mediante aviso prévio de 30 dias. Cobranças são processadas antecipadamente
              para o período contratado. Cancelamentos encerram o serviço ao fim do período já pago,
              sem reembolso proporcional, exceto quando exigido por lei.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>
              O Serviço é fornecido "como está". O formularios.ia não se responsabiliza por danos
              indiretos, incidentais, especiais ou consequentes decorrentes do uso ou impossibilidade
              de uso do Serviço. Nossa responsabilidade total é limitada ao valor pago pelo Serviço
              nos 3 meses anteriores ao evento que originou o dano.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Disponibilidade</h2>
            <p>
              Nos esforçamos para manter o Serviço disponível, mas não garantimos disponibilidade
              ininterrupta. Manutenções programadas serão comunicadas com antecedência sempre que possível.
              Não somos responsáveis por interrupções causadas por terceiros (provedores de infraestrutura,
              internet, etc.).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta se você violar estes Termos. Você pode encerrar
              sua conta a qualquer momento pelo painel de configurações. Após o encerramento, seus dados
              serão retidos por 30 dias e então excluídos, exceto quando a retenção for exigida por lei.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. Lei Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas
              serão resolvidas no foro da comarca de São Paulo/SP, com renúncia a qualquer outro,
              por mais privilegiado que seja.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">12. Alterações</h2>
            <p>
              Podemos atualizar estes Termos periodicamente. Notificaremos alterações significativas
              por e-mail ou aviso na plataforma com 15 dias de antecedência. O uso continuado após a
              vigência das alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">13. Contato</h2>
            <p>
              Dúvidas sobre estes Termos? Entre em contato:{" "}
              <a href="mailto:contato@formularios.ia" className="text-foreground underline underline-offset-4">
                contato@formularios.ia
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} formularios.ia</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors font-medium text-foreground">Termos</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
