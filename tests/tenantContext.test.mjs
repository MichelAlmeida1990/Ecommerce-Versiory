import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";

// Mock de localStorage para ambiente Node
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

// Simular window para evitar erros
global.window = {
  location: {
    hostname: "localhost",
    pathname: "/"
  }
};

// Carregar o módulo após definir os mocks
const {
  getActiveTenantId,
  setSelectedTenant,
  clearSelectedTenant,
  getSelectedTenant,
  DEFAULT_TENANT_ID_LOCAL
} = await import("../services/tenantContext.ts");

function resetState() {
  localStorage.clear();
  global.window.location.pathname = "/";
  global.window.location.hostname = "localhost";
}

describe("tenantContext", () => {
  test("deve retornar DEFAULT_TENANT_ID quando nada está configurado", () => {
    resetState();
    const id = getActiveTenantId();
    assert.strictEqual(id, DEFAULT_TENANT_ID_LOCAL);
  });

  test("deve usar seleção do cliente via localStorage", () => {
    resetState();
    setSelectedTenant("loja-teste");
    const id = getActiveTenantId();
    assert.strictEqual(id, "loja-teste");
  });

  test("deve limpar seleção do cliente", () => {
    resetState();
    setSelectedTenant("loja-teste");
    clearSelectedTenant();
    const id = getActiveTenantId();
    assert.strictEqual(id, DEFAULT_TENANT_ID_LOCAL);
  });

  test("deve recuperar seleção salva", () => {
    resetState();
    setSelectedTenant("minha-loja");
    const saved = getSelectedTenant();
    assert.strictEqual(saved, "minha-loja");
  });

  test("deve extrair tenant do pathname /loja/:slug", () => {
    resetState();
    global.window.location.pathname = "/loja/minha-loja/produto/123";
    const id = getActiveTenantId();
    assert.strictEqual(id, "minha-loja");
  });

  test("deve ignorar pathname que não começa com /loja/", () => {
    resetState();
    global.window.location.pathname = "/produto/123";
    const id = getActiveTenantId();
    assert.strictEqual(id, DEFAULT_TENANT_ID_LOCAL);
  });

  test("impersonation tem prioridade sobre seleção do cliente", () => {
    resetState();
    setSelectedTenant("loja-selecionada");
    localStorage.setItem("versiory_impersonated_tenant", JSON.stringify({ id: "loja-impersonada" }));
    const id = getActiveTenantId();
    assert.strictEqual(id, "loja-impersonada");
  });

  test("seleção do cliente tem prioridade sobre fallback", () => {
    resetState();
    setSelectedTenant("loja-cliente");
    const id = getActiveTenantId();
    assert.strictEqual(id, "loja-cliente");
    assert.notStrictEqual(id, DEFAULT_TENANT_ID_LOCAL);
  });

  test("pathname tem prioridade sobre sessão admin", () => {
    resetState();
    localStorage.setItem("versiory_admin_session", JSON.stringify({ tenantId: "loja-admin", role: "seller" }));
    global.window.location.pathname = "/loja/minha-loja";
    const id = getActiveTenantId();
    assert.strictEqual(id, "minha-loja");
  });
});
