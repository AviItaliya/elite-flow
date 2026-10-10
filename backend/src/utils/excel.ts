import ExcelJS from "exceljs";
import AppError from "./AppError.js";

export async function generateProductExcel(products: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Products");

  worksheet.columns = [
    { header: "Product Name", key: "name", width: 30 },
    { header: "SKU", key: "sku", width: 20 },
    { header: "Category", key: "category", width: 25 },
    { header: "Supplier", key: "supplier", width: 25 },
    { header: "Price", key: "price", width: 15 },
    { header: "Quantity", key: "quantity", width: 15 },
    { header: "Min Stock", key: "minStock", width: 15 },
  ];

  products.forEach((product) => {
    worksheet.addRow({
      name: product.name,
      sku: product.sku,
      category: product.category.name,
      supplier: product.supplier.name,
      price: Number(product.price),
      quantity: product.quantity,
      minStock: product.minStock,
    });
  });

  // Header
  const headerRow = worksheet.getRow(1);

  headerRow.height = 30;

  headerRow.font = {
    bold: true,
    color: { argb: "FFFFFF" },
    size: 12,
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };

    cell.border = {
      top: { style: "thin", color: { argb: "FFFFFF" } },
      bottom: { style: "thin", color: { argb: "FFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFF" } },
    };
  });

  // Data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.height = 22;

    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      cell.border = {
        top: { style: "thin", color: { argb: "D9E2F3" } },
        bottom: { style: "thin", color: { argb: "D9E2F3" } },
        left: { style: "thin", color: { argb: "D9E2F3" } },
        right: { style: "thin", color: { argb: "D9E2F3" } },
      };
    });

    // Alternating row colors
    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "EAF3FF" },
        };
      });
      row.getCell("price").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "EAF3FF" },
      };
      row.getCell("minStock").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "EAF3FF" },
      };
    }

    // Quantity - green
    row.getCell("quantity").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "5fa732" },
    };

    // Low stock - red
    const quantity = Number(row.getCell("quantity").value);
    const minStock = Number(row.getCell("minStock").value);

    if (quantity <= minStock) {
      row.getCell("quantity").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "#f17474" },
      };

      row.getCell("quantity").font = {
        bold: true,
        color: { argb: "9C0006" },
      };
    }
  });

  // Freeze header
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  return workbook;
}

export async function readExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch {
    throw new AppError("The uploaded file is not a valid .xlsx Excel workbook.", 400);
  }
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new AppError("The Excel workbook does not contain a worksheet.", 400);
  }
  const rows: any[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    rows.push({
      name: row.getCell(1).value,
      sku: row.getCell(2).value,
      category: row.getCell(3).value,
      supplier: row.getCell(4).value,
      price: Number(row.getCell(5).value),
      quantity: Number(row.getCell(6).value),
      minStock: Number(row.getCell(7).value),
    });
  });
  return rows;
}

export async function generateProductTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Product Template");
  worksheet.columns = [
    { header: "Product Name", key: "name", width: 30 },
    { header: "SKU", key: "sku", width: 20 },
    { header: "Category", key: "category", width: 25 },
    { header: "Supplier", key: "supplier", width: 25 },
    { header: "Price", key: "price", width: 15 },
    { header: "Quantity", key: "quantity", width: 15 },
    { header: "Min Stock", key: "minStock", width: 15 },
  ];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  worksheet.addRow({
    name: "Wireless Mouse",
    sku: "MOU001",
    category: "Accessories",
    supplier: "Logitech",
    price: 900,
    quantity: 50,
    minStock: 10,
  });

  return workbook;
}

export async function saveProductExcel(products: any[]) {
  const workbook = await generateProductExcel(products);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
