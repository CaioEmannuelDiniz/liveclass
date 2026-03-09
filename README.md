# 🏫 LiveClass | Backend Real-Time System 

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" />

## 🌟 Visão Geral

O **LiveClass** é um ecossistema de aprendizagem em tempo real desenvolvido em **Node.js**. O projeto foca na gestão dinâmica de salas de aula, permitindo que professores criem ambientes exclusivos e alunos ingressem instantaneamente através de códigos de acesso únicos via **WebSockets**.

A aplicação rompe o modelo tradicional de requisições HTTP estáticas, utilizando uma arquitetura orientada a eventos para garantir que a interação entre professor e aluno ocorra sem latência percebida.

---

## 🏗️ Arquitetura de Dados (UML)

A estrutura foi desenhada para suportar relacionamentos complexos, garantindo integridade referencial no MongoDB.



### Relacionamentos e Cardinalidade

| Entidade A | Relação | Entidade B | Regra de Negócio |
| :--- | :---: | :--- | :--- |
| **Teacher** | `1 : 1` | **Room** | Um professor possui e gerencia uma única sala ativa por vez. |
| **Teacher** | `1 : N` | **Student** | Uma professor pode estar vinculado a múltiplas alunos. |
| **Student** | `N : N` | **Room** | Um aluno pode estar vinculado a múltiplas salas simultaneamente. |

---

## 🔌 Fluxo de WebSockets (Real-Time)

O coração da aplicação é o módulo de Sockets, que gerencia o ingresso seguro e a comunicação instantânea.



### Fluxo de Evento: `join_with_code`
1. **Emissão**: O cliente (Student) envia o evento com `{ studentId, roomCode }`.
2. **Validação**: O servidor consulta o MongoDB para verificar se o código da sala existe.
3. **Persistência**: O ID do aluno é injetado no array da sala (via `$addToSet`) e a sala é adicionada ao perfil do aluno.
4. **Ingresso**: O servidor executa `socket.join(roomId)`, criando um canal isolado para aquela turma.
5. **Feedback**: O aluno recebe confirmação e os demais membros recebem um alerta de novo integrante.

---

## 💻 Tecnologias Utilizadas

* **Runtime:** Node.js (v18+)
* **Banco de Dados:** MongoDB com **Mongoose** (Modelagem de Dados).
* **Real-time:** **Socket.io** para comunicação bi-direcional.
* **Organização:** Arquitetura modular (Separation of Concerns).

---

## 📁 Estrutura do Projeto

```text
liveclass/
├── models/         # Schemas do Mongoose (Student, Room, Teacher)
├── controllers/    # Lógica de rotas HTTP (REST API)
├── sockets/        # Handlers de eventos em tempo real (roomSocket.js)
├── routes/         # Definição dos endpoints de API
├── services/       # Funções auxiliares (ex: gerador de códigos)
└── server.js       # Inicialização do servidor e integração Socket.io
```

---
## 🛠️ Como Executar Localmente

* **1. Clone o repositório:** 
``` Bash
git clone [https://github.com/seu-usuario/liveclass.git](https://github.com/seu-usuario/liveclass.git)
```
---

* **2. Instale as dependências:** 
``` Bash
npm install
```
---

* **3. Configure o .env:** 
```Snippet de código
MONGO_URI=mongodb+srv://...
PORT=3000
```
---

* **4. Inicie o servidor:** 
```Bash
npm start
```

## 🚀 Como Contribuir
 * Faça o fork do projeto.

 * Crie uma branch para sua feature (git checkout -b feature/NovaFeature).

 * Commit suas mudanças em inglês seguindo o padrão Conventional Commits.

 * Abra um Pull Request.