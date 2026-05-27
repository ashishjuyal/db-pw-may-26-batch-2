import { APIRequestContext, expect } from "@playwright/test";

export class ApiClient {
  private adminToken: string | null = null;

  constructor(private request: APIRequestContext) {}

  async loginAsAdmin(): Promise<void> {
    const res = await this.request.post("/api/auth/login", {
      data: { email: "admin@example.com", password: "Admin123!" },
    });
    expect(res.status()).toBe(200);
    this.adminToken = (await res.json()).token;
  }

  async loginAsUser(): Promise<string> {
    const res = await this.request.post("/api/auth/login", {
      data: { email: "standard_user@example.com", password: "Password123!" },
    });
    expect(res.status()).toBe(200);
    return (await res.json()).token;
  }

  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
  }) {
    const res = await this.request.post("/api/products", {
      headers: { Authorization: `Bearer ${this.adminToken}` },
      data,
    });
    expect(res.status()).toBe(201);
    return (await res.json()).product;
  }

  async updateProduct(
    id: number,
    data: Partial<{ price: number; stock: number }>,
  ) {
    const res = await this.request.patch(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${this.adminToken}` },
      data,
    });
    expect(res.status()).toBe(200);
    return (await res.json()).product;
  }

  async deleteProduct(id: number): Promise<void> {
    const res = await this.request.delete(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${this.adminToken}` },
    });
    expect(res.status()).toBe(204);
  }
}
