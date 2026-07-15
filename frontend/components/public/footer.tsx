import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full gradient-primary text-primary-foreground py-8 space-y-8">
      <div className="w-full max-w-7xl mx-auto px-4  flex flex-col gap-4 items-center text-center">
        <div className="grid grid-cols-5 items-start gap-8 font-light text-sm pb-8 border-b border-border/30">
          <div className="text-left w-full col-span-1 space-y-2">
            <h4 className="font-semibold">Prefeitura de Telêmaco Borba</h4>
            <p>Nossa Histório</p>
            <p>Equipe de Governo</p>
            <p>Secretarias</p>
            <p>Conselhos</p>
            <p>Ouvidoria</p>
          </div>
          <div className="text-left w-full col-span-1 space-y-2">
            <h4 className="font-semibold">Serviços para o Cidadão</h4>
            <p>Casa e Moradia</p>
            <p>Inventivo Cultural</p>
            <p>Concursos</p>
            <p>PSS</p>
            <p>Saúde</p>
            <p>Estágios</p>
            <p>Certidões e Guias</p>
            <p>Protocolo</p>
            <p>Cursos</p>
            <p>Vagas de Trabalho</p>
            <p>NF Eletrônica</p>
            <p>Obituário</p>
          </div>
          <div className="text-left w-full col-span-1 space-y-2">
            <h4 className="font-semibold">Serviços para as Enpresas</h4>
            <p>Abertura de Empresa</p>
            <p>Alvará, Certidões e Licenças</p>
            <p>Cadastro</p>
            <p>Impostos e Taxas</p>
            <p>Licitações e Fornecedores</p>
            <p>Consultas, Declarações e Normas</p>
            <p>Legislação</p>
          </div>
          <div className="text-left w-full col-span-1 space-y-2">
            <h4 className="font-semibold">Serviços para o Servidor</h4>
            <p>Portal do Servidor</p>
            <p>PCCV - Estatuto</p>
            <p>Laudos Técnicos - SST</p>
            <p>Capacitação</p>
            <p>Manuais e Procedimentos</p>
            <p>Suporte Técnico</p>
            <p>Webmail</p>
            <p>Ponto Eletrônico</p>
          </div>
          <div className="text-left w-full col-span-1 space-y-2">
            <h4 className="font-medium">Acontece na Cidade</h4>
            <p>Notícias</p>
            <p>Portal da Legislação</p>
            <p>Ata de Registro de Preços</p>
            <p>Download</p>
          </div>
        </div>
        <div className="flex justify-between items-center w-full font-light text-xs">
          <p>
            Praça Horácio Klabin, 34 - Centro - Telêmaco Borba - PR - Cep
            84267-000 - Fone (42) 3127-8004
          </p>
          <div className="flex gap-4">
            <Link href={"/administrator"}>Painel de Controle</Link>
            <p>Mapa do Site</p>
            <p>Plítica de Privacidade</p>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center justify-center">
        <p className="text-sm font-light">
          © 2026 | Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
