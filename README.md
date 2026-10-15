# Excursões — plataforma de venda de excursões

Plataforma web para venda de excursões a festivais, shows, Carnaval e Réveillon, com transporte de ida e volta e grupo organizado. O projeto inclui o site público, o checkout com pagamento, a área do cliente e um painel administrativo completo.

🔗 **Demo ao vivo:** https://excursoes-portfolio.vercel.app
🧩 **API (backend):** https://github.com/araujohjessica/excursoes-api *(em breve)*

> Esta é uma **versão de demonstração**. Todos os dados são fictícios e nenhum pagamento é realizado. O backend é simulado no próprio navegador, então o projeto roda sem servidor.

![Página inicial](docs/home.png)

## Funcionalidades

**Site público**
- Vitrine de excursões com busca e filtros
- Página de detalhes de cada excursão
- Checkout com reserva de vagas
- Pagamento via Pix (QR Code) e cartão de crédito
- Contato direto pelo WhatsApp

**Área do cliente**
- Login do cliente
- Acompanhamento de reservas e pagamentos
- Troca de mensagens com a organização

**Painel administrativo** (`/#/admin`)
- Cadastro, edição e exclusão de excursões
- Gestão de pedidos e participantes por evento
- Central de mensagens com os clientes
- Situação dos pagamentos sincronizada com o gateway (Asaas)
- Configurações do site: contato, redes sociais, rodapé e links

## Testando a demo

| Área | Como acessar |
|---|---|
| Site público | Página inicial |
| Painel admin | [/#/admin/login](https://excursoes-portfolio.vercel.app/#/admin/login) com **qualquer e-mail e senha** |

## Tecnologias

- **React** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- Context API para estado global (excursões, cliente, tema e configurações)
- Camada de serviços com backend simulado para o modo demonstração
- Atualizações em tempo real na versão de produção

## Arquitetura

```
src/
├── pages/          # páginas públicas, área do cliente e painel admin
├── components/     # componentes reutilizáveis
├── store/          # contextos (AppContext, CustomerContext, Settings, Theme)
├── services/
│   ├── api.ts      # cliente HTTP; desvia para o demo quando ativo
│   ├── demo.ts     # backend simulado com dados fictícios
│   └── realtime.ts # conexão em tempo real (produção)
└── types.ts        # tipos compartilhados
```

O frontend fala com a API por uma única função `request` em `services/api.ts`. No modo demonstração, essa função responde com dados de `services/demo.ts`, e nenhuma página precisa saber se está falando com o servidor real ou com o simulado.

## Como executar

```bash
git clone https://github.com/araujohjessica/excursoes-portfolio.git
cd excursoes-portfolio
npm install
npm run dev
```

O modo demonstração vem ativado por padrão. Para usar uma API real:

```bash
VITE_DEMO=false VITE_API_URL=http://localhost:4001/api npm run dev
```

## Autora

**Jessica Helena Araujo**, engenheira da computação, JA Developers

- GitHub: https://github.com/araujohjessica
- LinkedIn: https://linkedin.com/in/jessica-araujo-89b328279/
