import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {createProductSchema, updateProductSchema} from "../validators/productValidation.js";
import productService from "../services/productService.js";
import { sendResponse } from "../utils/response.js";
import AppError from "../utils/AppError.js";
import fs from "node:fs/promises";
import { productQuerySchema } from "../validators/productQueryValidation.js";

class ProductController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = createProductSchema.parse(req.body);
    const product = await productService.create(data, req.user!.id);
    return sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Product created successfully.",
      data: product,
    });
  });

  findAll = asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query);
    const result = await productService.findAll(query);
    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Products fetched successfully.",
      data: result,
    });
  });

  findById = asyncHandler(async (req, res) => {
    const product = await productService.findById(req.params.id as string);
    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product fetched successfully.",
      data: product,
    });
  });

  update = asyncHandler(async (req, res) => {
    const data = updateProductSchema.parse(req.body);

    const product = await productService.update(
      req.params.id as string,
      data,
      req.user!.id,
    );

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product updated successfully.",
      data: product,
    });
  });

  delete = asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new AppError("Invalid product ID.", 400);
    }

    await productService.delete(id, req.user!.id);
    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product deleted successfully.",
    });
  });

  exportProducts = asyncHandler(async (req, res) => {
    const workbook = await productService.exportProducts();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products.xlsx"',
    );
    await workbook.xlsx.write(res);
    return res.end();
  });

  
  importProducts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("Excel file is required.", 400);
    }  
    try {
      const result = await productService.importProducts(req.file.path);
      return sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Products imported successfully.",
        data: result,
      });
    } finally {
      await fs.unlink(req.file.path).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          console.error("Failed to remove temporary upload:", error);
        }
      });
    }
  });


  downloadTemplate = asyncHandler(async (req, res) => {
    const workbook = await productService.downloadTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename = "product-template.xlsx"',
    );
    await workbook.xlsx.write(res);
    return res.end();
  });
}
export default new ProductController();
