# Agent CI/CD Pipeline

## 📊 Métricas
- **Taxa de Sucesso:** 95%
- **Tempo Médio:** 5-10min
- **Complexidade:** Intermediário

## Descrição
Especialista em configuração de pipelines CI/CD para GitHub Actions, GitLab CI, Jenkins e CircleCI. Implementa builds automatizados, testes, análise de código e deployments.

## Objetivos Principais
- Criar pipelines multi-stage (build, test, deploy)
- Configurar matrix builds para múltiplas versões
- Implementar cache de dependências
- Setup de ambientes (dev, staging, production)
- Configurar secrets e variáveis de ambiente
- Implementar quality gates
- Setup de notificações (Slack, Discord, email)
- Configurar artifact storage
- Implementar rollback automático
- Setup de deployment strategies (blue-green, canary)

## Templates

### GitHub Actions Complete Pipeline
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  NODE_VERSION: '18'
  DOCKER_REGISTRY: ghcr.io

jobs:
  # Quality checks
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run typecheck

      - name: Code Quality
        uses: super-linter/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Testing
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          flags: unittests
          fail_ci_if_error: true

  # Security scanning
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'app'
          path: '.'
          format: 'HTML'

  # Build and push Docker image
  build:
    name: Build & Push Docker
    runs-on: ubuntu-latest
    needs: [quality, test, security]
    if: github.event_name != 'pull_request'
    outputs:
      version: ${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # Deploy to staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/staging/
          images: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}:${{ needs.build.outputs.version }}
          strategy: canary
          percentage: 20

  # Deploy to production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'release'
    environment:
      name: production
      url: https://app.example.com
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/production/
          images: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}:${{ needs.build.outputs.version }}
          strategy: blue-green

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ needs.build.outputs.version }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### GitLab CI Pipeline
```yaml
stages:
  - build
  - test
  - security
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  CONTAINER_TEST_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
  CONTAINER_RELEASE_IMAGE: $CI_REGISTRY_IMAGE:latest

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

build:
  stage: build
  image: node:18
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

test:unit:
  stage: test
  image: node:18
  coverage: '/Coverage: \d+\.\d+%/'
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run test:coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

security:sast:
  stage: security
  include:
    - template: Security/SAST.gitlab-ci.yml

security:dependency:
  stage: security
  include:
    - template: Security/Dependency-Scanning.gitlab-ci.yml

deploy:staging:
  stage: deploy
  image: alpine/helm:latest
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop
  script:
    - helm upgrade --install app ./charts/app
      --namespace staging
      --set image.tag=$CI_COMMIT_SHA
      --values ./charts/app/values.staging.yaml

deploy:production:
  stage: deploy
  image: alpine/helm:latest
  environment:
    name: production
    url: https://app.example.com
  only:
    - tags
  when: manual
  script:
    - helm upgrade --install app ./charts/app
      --namespace production
      --set image.tag=$CI_COMMIT_TAG
      --values ./charts/app/values.production.yaml
```