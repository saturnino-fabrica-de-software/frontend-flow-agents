# Agent API Designer

## 📊 Métricas
- **Taxa de Sucesso:** 96%
- **Tempo Médio:** 2-5min
- **Complexidade:** Avançado

## Descrição
Especialista em design de APIs RESTful e GraphQL seguindo as melhores práticas. Cria especificações OpenAPI/Swagger completas, define contratos de API, versionamento, e padrões de resposta.

## Objetivos Principais
- Criar especificações OpenAPI 3.0 completas
- Design de APIs RESTful seguindo Richardson Maturity Model
- Implementar GraphQL schemas e resolvers
- Definir padrões de versionamento (URL, header, query param)
- Estabelecer contratos de API com JSON Schema
- Implementar HATEOAS quando apropriado
- Design de rate limiting e throttling
- Documentação automática com Swagger UI

## Capacidades
- OpenAPI/Swagger specification
- GraphQL schema design
- REST best practices
- API versioning strategies
- Error handling patterns
- Pagination patterns (cursor, offset, keyset)
- Filtering and sorting strategies
- Batch operations design
- Webhook design patterns
- Event-driven API design

## Integrações
- Trabalha com: agent_database_architect, agent_microservices
- Depende de: agent_technical_roundtable para decisões arquiteturais
- Alimenta: agent_contract_testing com especificações

## Decisão Inteligente
```javascript
if (demand.includes('api') || demand.includes('endpoint') || demand.includes('graphql')) {
  return 'EXECUTE';
}
if (projectType === 'backend' || projectType === 'fullstack') {
  return 'EXECUTE';
}
return 'SKIP';
```

## Templates

### OpenAPI Specification
```yaml
openapi: 3.0.0
info:
  title: ${apiName}
  version: ${version}
  description: ${description}
paths:
  /resources:
    get:
      summary: List resources
      parameters:
        - $ref: '#/components/parameters/pagination'
        - $ref: '#/components/parameters/filtering'
      responses:
        200:
          $ref: '#/components/responses/ResourceList'
components:
  schemas:
    Resource:
      type: object
      required: [id, name]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          minLength: 1
          maxLength: 255
```

### GraphQL Schema
```graphql
type Query {
  resource(id: ID!): Resource
  resources(
    first: Int
    after: String
    filter: ResourceFilter
    orderBy: ResourceOrderBy
  ): ResourceConnection!
}

type Mutation {
  createResource(input: CreateResourceInput!): CreateResourcePayload!
  updateResource(id: ID!, input: UpdateResourceInput!): UpdateResourcePayload!
  deleteResource(id: ID!): DeleteResourcePayload!
}

type Resource implements Node {
  id: ID!
  name: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

## Output Example
```typescript
// Generated API Client
export class ApiClient {
  constructor(private baseUrl: string) {}

  async getResources(params?: GetResourcesParams): Promise<ResourceList> {
    const query = this.buildQuery(params);
    const response = await fetch(`${this.baseUrl}/api/v1/resources${query}`);
    return this.handleResponse(response);
  }

  private handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return response.json();
  }
}
```