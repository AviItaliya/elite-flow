import prisma from "../config/prisma.js";
import type { Prisma, Product } from "../generated/prisma/client.js";
import { readExcel } from "../utils/excel.js";

class ProductRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({
      data,
      include: {
        category: true,
        supplier: true,
      },
    });
  }

  async findAll(options: {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    stockStatus?: "in-stock" | "low-stock" | "out-of-stock";
    page: number;
    limit: number;
    sortBy:
      | "name"
      | "sku"
      | "price"
      | "quantity"
      | "minStock"
      | "createdAt"
      | "updatedAt";
    order: "asc" | "desc";
  }) {
    const {
      search,
      categoryId,
      supplierId,
      stockStatus,
      page,
      limit,
      sortBy,
      order,
    } = options;

    const where: Prisma.ProductWhereInput = {};

    // Search
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Supplier
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Stock filter
    if (stockStatus === "out-of-stock") {
      where.quantity = 0;
    }

    if (stockStatus === "in-stock") {
      where.quantity = {
        gt: 0,
      };

      // In Stock means quantity > minStock
      where.NOT = {
        quantity: {
          lte: prisma.product.fields.minStock,
        },
      };
    }

    if (stockStatus === "low-stock") {
      where.quantity = {
        gt: 0,
        lte: prisma.product.fields.minStock,
      };
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
      }),

      prisma.product.count({
        where,
      }),
    ]);

    return {
      products,
      total,
    };
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });
  }

  async findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        supplier: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }

  async exportProducts() {
    return prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async bulkCreateProducts(data: Prisma.ProductCreateManyInput[]) {
    return prisma.product.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findCategoryByName(name: string) {
    return prisma.category.findUnique({
      where: {
        name,
      },
    });
  }

  async findSupplierByName(name: string) {
    return prisma.supplier.findFirst({
      where: {
        name,
      },
    });
  }

  async importProducts(filePath: string) {
    const rows = await readExcel(filePath);
    return rows;
  }

  async findLowStockProducts() {
    return prisma.product.findMany({
      where: {
        quantity: {
          lte: prisma.product.fields.minStock,
        },
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        quantity: "asc",
      },
    });
  }

  async countProducts() {
    return prisma.product.count();
  }

  async totalInventoryQuantity() {
    const result = await prisma.product.aggregate({
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity ?? 0;
  }

  async countLowStockProducts() {
    const products = await prisma.product.findMany();

    return products.filter((product) => product.quantity <= product.minStock)
      .length;
  }

  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        quantity: "asc",
      },
    });

    return products.filter((product) => product.quantity <= product.minStock);
  }
}

export default new ProductRepository();
