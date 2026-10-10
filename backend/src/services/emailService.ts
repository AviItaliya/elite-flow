import transporter from "../config/mail.js";

import categoryRepository from "../repositories/categoryRepository.js";
import productRepository from "../repositories/productRepository.js";
import supplierRepository from "../repositories/supplierRepository.js";

import { saveProductExcel } from "../utils/excel.js";
import { sendEmail } from "../utils/sendEmail.js";

// import fs from "fs/promises";

class EmailService {
  private getAdminEmail(): string {
    const email = process.env.ADMIN_EMAIL;

    if (!email) {
      throw new Error("ADMIN_EMAIL is not configured.");
    }

    return email;
  }

  async sendTestEmail(to: string) {
    await sendEmail({
      to,
      subject: "Test Email from Elite Inventory API",
      html: `
        <h2>Email sent successfully</h2>
        <p>This email confirms that Nodemailer is configured correctly.</p>
        <hr>
        <p><strong>Project:</strong> Elite Inventory API</p>
        <p><strong>Status:</strong> Working</p>
      `,
    });
  }

  async sendLowerStockAlert() {
  const to = this.getAdminEmail();

  const products = await productRepository.findLowStockProducts();

  if (products.length === 0) {
    return;
  }

  const rows = products
    .map(
      (product) => `
        <tr>
          <td
            style="
              padding: 14px 16px;
              border-bottom: 1px solid #e5e7eb;
              color: #111827;
              font-size: 14px;
            "
          >
            <strong>${product.name}</strong>
          </td>

          <td
            style="
              padding: 14px 16px;
              border-bottom: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            "
          >
            ${product.sku}
          </td>

          <td
            style="
              padding: 14px 16px;
              border-bottom: 1px solid #e5e7eb;
              text-align: center;
              color: #dc2626;
              font-size: 14px;
              font-weight: 700;
            "
          >
            ${product.quantity}
          </td>

          <td
            style="
              padding: 14px 16px;
              border-bottom: 1px solid #e5e7eb;
              text-align: center;
              color: #374151;
              font-size: 14px;
            "
          >
            ${product.minStock}
          </td>
        </tr>
      `,
    )
    .join("");

  await sendEmail({
    to,
    subject: "⚠️ Low Stock Alert - Elite Inventory",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Low Stock Alert</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          "
        >
          <div
            style="
              width: 100%;
              padding: 40px 16px;
              box-sizing: border-box;
            "
          >

            <!-- Main Container -->
            <div
              style="
                max-width: 680px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
              "
            >

              <!-- Header -->
              <div
                style="
                  background-color: #2563eb;
                  padding: 28px 32px;
                  text-align: center;
                "
              >
                <h1
                  style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 700;
                  "
                >
                  Elite Inventory
                </h1>

                <p
                  style="
                    margin: 8px 0 0;
                    color: #dbeafe;
                    font-size: 14px;
                  "
                >
                  Inventory Management System
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">

                <!-- Alert -->
                <div
                  style="
                    background-color: #fff7ed;
                    border: 1px solid #fed7aa;
                    border-radius: 10px;
                    padding: 18px 20px;
                    margin-bottom: 24px;
                  "
                >
                  <div
                    style="
                      font-size: 18px;
                      font-weight: 700;
                      color: #c2410c;
                      margin-bottom: 6px;
                    "
                  >
                    ⚠️ Low Stock Alert
                  </div>

                  <p
                    style="
                      margin: 0;
                      color: #7c2d12;
                      font-size: 14px;
                      line-height: 1.6;
                    "
                  >
                    Some products in your inventory have fallen below
                    their minimum stock level and may need to be restocked.
                  </p>
                </div>

                <!-- Summary -->
                <div
                  style="
                    background-color: #f9fafb;
                    border-radius: 10px;
                    padding: 18px 20px;
                    margin-bottom: 24px;
                  "
                >
                  <p
                    style="
                      margin: 0;
                      color: #374151;
                      font-size: 14px;
                      line-height: 1.6;
                    "
                  >
                    <strong>${products.length}</strong>
                    product${
                      products.length !== 1 ? "s" : ""
                    } require attention.
                  </p>
                </div>

                <!-- Table -->
                <div
                  style="
                    width: 100%;
                    overflow-x: auto;
                  "
                >
                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      width: 100%;
                      border-collapse: collapse;
                      border: 1px solid #e5e7eb;
                      border-radius: 8px;
                      overflow: hidden;
                    "
                  >
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th
                          align="left"
                          style="
                            padding: 14px 16px;
                            border-bottom: 1px solid #e5e7eb;
                            color: #374151;
                            font-size: 13px;
                            font-weight: 700;
                          "
                        >
                          Product
                        </th>

                        <th
                          align="left"
                          style="
                            padding: 14px 16px;
                            border-bottom: 1px solid #e5e7eb;
                            color: #374151;
                            font-size: 13px;
                            font-weight: 700;
                          "
                        >
                          SKU
                        </th>

                        <th
                          align="center"
                          style="
                            padding: 14px 16px;
                            border-bottom: 1px solid #e5e7eb;
                            color: #dc2626;
                            font-size: 13px;
                            font-weight: 700;
                          "
                        >
                          Current Qty
                        </th>

                        <th
                          align="center"
                          style="
                            padding: 14px 16px;
                            border-bottom: 1px solid #e5e7eb;
                            color: #374151;
                            font-size: 13px;
                            font-weight: 700;
                          "
                        >
                          Min Stock
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      ${rows}
                    </tbody>
                  </table>
                </div>

                <!-- Note -->
                <div
                  style="
                    margin-top: 24px;
                    padding: 16px 18px;
                    background-color: #ffc0c0;
                    border-left: 4px solid #eb2525;
                    border-radius: 6px;
                  "
                >
                  <p
                    style="
                      margin: 0;
                      color: #8a1e1e;
                      font-size: 13px;
                      line-height: 1.6;
                    "
                  >
                    Please review these products and consider
                    restocking them to maintain healthy inventory levels.
                  </p>
                </div>

              </div>

              <!-- Footer -->
              <div
                style="
                  background-color: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                  padding: 22px 32px;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0 0 6px;
                    color: #374151;
                    font-size: 13px;
                    font-weight: 600;
                  "
                >
                  Elite Inventory
                </p>

                <p
                  style="
                    margin: 0;
                    color: #9ca3af;
                    font-size: 12px;
                    line-height: 1.5;
                  "
                >
                  This is an automated inventory notification.
                  Please do not reply to this email.
                </p>
              </div>

            </div>
          </div>
        </body>
      </html>
    `,
  });
}

  async sendDailyInventorySummary() {
  const to = this.getAdminEmail();

  const totalProducts = await productRepository.countProducts();
  const totalCategories = await categoryRepository.count();
  const totalQuantity = await productRepository.totalInventoryQuantity();
  const totalSuppliers = await supplierRepository.count();
  const lowStockProducts = await productRepository.getLowStockProducts();

  const rows = lowStockProducts
    .map(
      (product) => `
        <tr>
          <td
            style="
              padding: 14px 12px;
              border-bottom: 1px solid #e5e7eb;
              color: #111827;
              font-size: 13px;
            "
          >
            <strong>${product.name}</strong>
          </td>

          <td
            style="
              padding: 14px 12px;
              border-bottom: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 13px;
            "
          >
            ${product.sku}
          </td>

          <td
            style="
              padding: 14px 12px;
              border-bottom: 1px solid #e5e7eb;
              color: #374151;
              font-size: 13px;
            "
          >
            ${product.category.name}
          </td>

          <td
            style="
              padding: 14px 12px;
              border-bottom: 1px solid #e5e7eb;
              color: #374151;
              font-size: 13px;
            "
          >
            ${product.supplier.name}
          </td>

          <td
            style="
              padding: 14px 12px;
              border-bottom: 1px solid #e5e7eb;
              text-align: center;
              color: ${
                product.quantity < product.minStock
                  ? "#dc2626"
                  : "#111827"
              };
              font-size: 13px;
              font-weight: 700;
            "
          >
            ${product.quantity}
          </td>

          <td
            style="
              padding: 14px 12px;
              border-bottom: 1px solid #e5e7eb;
              text-align: center;
              color: #374151;
              font-size: 13px;
            "
          >
            ${product.minStock}
          </td>
        </tr>
      `,
    )
    .join("");

  await sendEmail({
    to,
    subject: "📊 Daily Inventory Summary - Elite Inventory",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Daily Inventory Summary</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          "
        >
          <div
            style="
              width: 100%;
              padding: 40px 16px;
              box-sizing: border-box;
            "
          >

            <!-- Main Card -->
            <div
              style="
                max-width: 720px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
              "
            >

              <!-- Header -->
              <div
                style="
                  background-color: #2563eb;
                  padding: 28px 32px;
                  text-align: center;
                "
              >
                <h1
                  style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 25px;
                    line-height: 1.3;
                  "
                >
                  Elite Inventory
                </h1>

                <p
                  style="
                    margin: 8px 0 0;
                    color: #dbeafe;
                    font-size: 14px;
                  "
                >
                  Inventory Management System
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">

                <h2
                  style="
                    margin: 0 0 8px;
                    color: #111827;
                    font-size: 22px;
                  "
                >
                  Daily Inventory Summary
                </h2>

                <p
                  style="
                    margin: 0 0 28px;
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  Here is the latest overview of your inventory.
                </p>

                <!-- Statistics -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 10px;
                    margin: 0 -10px 20px;
                  "
                >
                  <tr>

                    <!-- Products -->
                    <td
                      width="50%"
                      style="
                        width: 50%;
                        background-color: #eff6ff;
                        border: 1px solid #dbeafe;
                        border-radius: 10px;
                        padding: 18px;
                        text-align: center;
                      "
                    >
                      <div
                        style="
                          color: #2563eb;
                          font-size: 28px;
                          font-weight: 700;
                          line-height: 1;
                        "
                      >
                        ${totalProducts}
                      </div>

                      <div
                        style="
                          margin-top: 8px;
                          color: #475569;
                          font-size: 13px;
                        "
                      >
                        Total Products
                      </div>
                    </td>

                    <!-- Categories -->
                    <td
                      width="50%"
                      style="
                        width: 50%;
                        background-color: #f5f3ff;
                        border: 1px solid #e9d5ff;
                        border-radius: 10px;
                        padding: 18px;
                        text-align: center;
                      "
                    >
                      <div
                        style="
                          color: #7c3aed;
                          font-size: 28px;
                          font-weight: 700;
                          line-height: 1;
                        "
                      >
                        ${totalCategories}
                      </div>

                      <div
                        style="
                          margin-top: 8px;
                          color: #475569;
                          font-size: 13px;
                        "
                      >
                        Categories
                      </div>
                    </td>

                  </tr>

                  <tr>

                    <!-- Suppliers -->
                    <td
                      width="50%"
                      style="
                        width: 50%;
                        background-color: #ecfdf5;
                        border: 1px solid #d1fae5;
                        border-radius: 10px;
                        padding: 18px;
                        text-align: center;
                      "
                    >
                      <div
                        style="
                          color: #059669;
                          font-size: 28px;
                          font-weight: 700;
                          line-height: 1;
                        "
                      >
                        ${totalSuppliers}
                      </div>

                      <div
                        style="
                          margin-top: 8px;
                          color: #475569;
                          font-size: 13px;
                        "
                      >
                        Suppliers
                      </div>
                    </td>

                    <!-- Low Stock -->
                    <td
                      width="50%"
                      style="
                        width: 50%;
                        background-color: #fff7ed;
                        border: 1px solid #fed7aa;
                        border-radius: 10px;
                        padding: 18px;
                        text-align: center;
                      "
                    >
                      <div
                        style="
                          color: #ea580c;
                          font-size: 28px;
                          font-weight: 700;
                          line-height: 1;
                        "
                      >
                        ${lowStockProducts.length}
                      </div>

                      <div
                        style="
                          margin-top: 8px;
                          color: #475569;
                          font-size: 13px;
                        "
                      >
                        Low Stock Products
                      </div>
                    </td>

                  </tr>
                </table>

                <!-- Inventory Quantity -->
                <div
                  style="
                    margin: 20px 0 28px;
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 20px;
                  "
                >
                  <p
                    style="
                      margin: 0 0 6px;
                      color: #6b7280;
                      font-size: 13px;
                    "
                  >
                    Total Inventory Quantity
                  </p>

                  <p
                    style="
                      margin: 0;
                      color: #111827;
                      font-size: 26px;
                      font-weight: 700;
                    "
                  >
                    ${totalQuantity}
                    <span
                      style="
                        color: #6b7280;
                        font-size: 13px;
                        font-weight: 400;
                      "
                    >
                      units
                    </span>
                  </p>
                </div>

                <!-- Low Stock Section -->
                <div
                  style="
                    margin-bottom: 16px;
                  "
                >
                  <h3
                    style="
                      margin: 0 0 6px;
                      color: #111827;
                      font-size: 17px;
                    "
                  >
                    Low Stock Overview
                  </h3>

                  <p
                    style="
                      margin: 0 0 18px;
                      color: #6b7280;
                      font-size: 13px;
                      line-height: 1.5;
                    "
                  >
                    Products currently below their minimum stock level.
                  </p>
                </div>

                ${
                  lowStockProducts.length > 0
                    ? `
                      <div
                        style="
                          width: 100%;
                          overflow-x: auto;
                          margin-bottom: 24px;
                        "
                      >
                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="
                            width: 100%;
                            min-width: 620px;
                            border-collapse: collapse;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            overflow: hidden;
                          "
                        >
                          <thead>
                            <tr style="background-color: #f9fafb;">

                              <th
                                align="left"
                                style="
                                  padding: 13px 12px;
                                  border-bottom: 1px solid #e5e7eb;
                                  color: #374151;
                                  font-size: 12px;
                                  font-weight: 700;
                                "
                              >
                                Product
                              </th>

                              <th
                                align="left"
                                style="
                                  padding: 13px 12px;
                                  border-bottom: 1px solid #e5e7eb;
                                  color: #374151;
                                  font-size: 12px;
                                  font-weight: 700;
                                "
                              >
                                SKU
                              </th>

                              <th
                                align="left"
                                style="
                                  padding: 13px 12px;
                                  border-bottom: 1px solid #e5e7eb;
                                  color: #374151;
                                  font-size: 12px;
                                  font-weight: 700;
                                "
                              >
                                Category
                              </th>

                              <th
                                align="left"
                                style="
                                  padding: 13px 12px;
                                  border-bottom: 1px solid #e5e7eb;
                                  color: #374151;
                                  font-size: 12px;
                                  font-weight: 700;
                                "
                              >
                                Supplier
                              </th>

                              <th
                                align="center"
                                style="
                                  padding: 13px 12px;
                                  border-bottom: 1px solid #e5e7eb;
                                  color: #dc2626;
                                  font-size: 12px;
                                  font-weight: 700;
                                "
                              >
                                Quantity
                              </th>

                              <th
                                align="center"
                                style="
                                  padding: 13px 12px;
                                  border-bottom: 1px solid #e5e7eb;
                                  color: #374151;
                                  font-size: 12px;
                                  font-weight: 700;
                                "
                              >
                                Min Stock
                              </th>

                            </tr>
                          </thead>

                          <tbody>
                            ${rows}
                          </tbody>
                        </table>
                      </div>
                    `
                    : `
                      <div
                        style="
                          background-color: #ecfdf5;
                          border: 1px solid #a7f3d0;
                          border-radius: 8px;
                          padding: 18px;
                          margin-bottom: 24px;
                        "
                      >
                        <p
                          style="
                            margin: 0;
                            color: #047857;
                            font-size: 13px;
                            line-height: 1.5;
                          "
                        >
                          ✓ No low-stock products were found.
                          Your inventory is currently above the
                          configured minimum stock levels.
                        </p>
                      </div>
                    `
                }

                <!-- Bottom Note -->
                <div
                  style="
                    background-color: #eff6ff;
                    border-left: 4px solid #2563eb;
                    border-radius: 6px;
                    padding: 16px 18px;
                  "
                >
                  <p
                    style="
                      margin: 0;
                      color: #1e3a8a;
                      font-size: 13px;
                      line-height: 1.6;
                    "
                  >
                    This summary was generated automatically by
                    Elite Inventory to help you monitor your stock
                    levels and make timely inventory decisions.
                  </p>
                </div>

              </div>

              <!-- Footer -->
              <div
                style="
                  background-color: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                  padding: 22px 32px;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0 0 6px;
                    color: #374151;
                    font-size: 13px;
                    font-weight: 600;
                  "
                >
                  Elite Inventory
                </p>

                <p
                  style="
                    margin: 0;
                    color: #9ca3af;
                    font-size: 12px;
                    line-height: 1.5;
                  "
                >
                  This is an automated inventory summary.
                  Please do not reply to this email.
                </p>
              </div>

            </div>
          </div>
        </body>
      </html>
    `,
  });
}

  async sendWeeklyInventoryReport() {
  const to = this.getAdminEmail();

  const products = await productRepository.exportProducts();

  // const filePath = await saveProductExcel(products);
  const fileBuffer = await saveProductExcel(products);

  // try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: "📊 Weekly Inventory Report - Elite Inventory",

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Weekly Inventory Report</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            "
          >
            <div
              style="
                width: 100%;
                padding: 40px 16px;
                box-sizing: border-box;
              "
            >
              <!-- Main Card -->
              <div
                style="
                  max-width: 680px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
                "
              >

                <!-- Header -->
                <div
                  style="
                    background-color: #2563eb;
                    padding: 30px 32px;
                    text-align: center;
                  "
                >
                  <h1
                    style="
                      margin: 0;
                      color: #ffffff;
                      font-size: 25px;
                      font-weight: 700;
                    "
                  >
                    Elite Inventory
                  </h1>

                  <p
                    style="
                      margin: 8px 0 0;
                      color: #dbeafe;
                      font-size: 14px;
                    "
                  >
                    Inventory Management System
                  </p>
                </div>

                <!-- Content -->
                <div style="padding: 32px;">

                  <h2
                    style="
                      margin: 0 0 10px;
                      color: #111827;
                      font-size: 22px;
                    "
                  >
                    Weekly Inventory Report
                  </h2>

                  <p
                    style="
                      margin: 0 0 24px;
                      color: #4b5563;
                      font-size: 14px;
                      line-height: 1.6;
                    "
                  >
                    Hello Admin,
                  </p>

                  <p
                    style="
                      margin: 0 0 24px;
                      color: #6b7280;
                      font-size: 14px;
                      line-height: 1.7;
                    "
                  >
                    Your weekly inventory report is ready.
                    The complete product inventory has been exported
                    to an Excel file and is attached to this email.
                  </p>

                  <!-- Report Summary -->
                  <div
                    style="
                      background-color: #eff6ff;
                      border: 1px solid #dbeafe;
                      border-radius: 10px;
                      padding: 20px;
                      margin-bottom: 24px;
                    "
                  >
                    <div
                      style="
                        color: #2563eb;
                        font-size: 14px;
                        font-weight: 700;
                        margin-bottom: 8px;
                      "
                    >
                      📎 Report Attached
                    </div>

                    <p
                      style="
                        margin: 0;
                        color: #374151;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      <strong>File:</strong>
                      Weekly-Inventory-Report.xlsx
                    </p>

                    <p
                      style="
                        margin: 6px 0 0;
                        color: #6b7280;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      The attachment contains the latest inventory
                      product data available in the system.
                    </p>
                  </div>

                  <!-- Product Count -->
                  <div
                    style="
                      text-align: center;
                      background-color: #f9fafb;
                      border: 1px solid #e5e7eb;
                      border-radius: 10px;
                      padding: 20px;
                      margin-bottom: 24px;
                    "
                  >
                    <div
                      style="
                        color: #2563eb;
                        font-size: 30px;
                        font-weight: 700;
                        line-height: 1;
                      "
                    >
                      ${products.length}
                    </div>

                    <div
                      style="
                        margin-top: 8px;
                        color: #6b7280;
                        font-size: 13px;
                      "
                    >
                      Products Included in Report
                    </div>
                  </div>

                  <!-- Instruction -->
                  <div
                    style="
                      background-color: #f9fafb;
                      border-left: 4px solid #2563eb;
                      border-radius: 6px;
                      padding: 16px 18px;
                      margin-bottom: 8px;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #374151;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Please download the attached Excel file to
                      review, analyze, or share the weekly inventory data.
                    </p>
                  </div>

                </div>

                <!-- Footer -->
                <div
                  style="
                    background-color: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    padding: 22px 32px;
                    text-align: center;
                  "
                >
                  <p
                    style="
                      margin: 0 0 6px;
                      color: #374151;
                      font-size: 13px;
                      font-weight: 600;
                    "
                  >
                    Elite Inventory
                  </p>

                  <p
                    style="
                      margin: 0;
                      color: #9ca3af;
                      font-size: 12px;
                      line-height: 1.5;
                    "
                  >
                    This is an automated inventory report.
                    Please do not reply to this email.
                  </p>
                </div>

              </div>
            </div>
          </body>
        </html>
      `,

      attachments: [
        {
          filename: "Weekly-Inventory-Report.xlsx",
          content: fileBuffer,
          // path: filePath,
        },
      ],
    });
  } 
  // finally {
  //   await fs.unlink(filePath).catch(() => {});
  // }
  
  
  async sendResetPasswordEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured.");
    }

    const resetUrl = new URL("/reset-password", frontendUrl);
    resetUrl.searchParams.set("token", token);

    // Escape user-provided text before inserting it into HTML.
    const safeName = name.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character] ?? character;
    });

    await sendEmail({
      to,
      subject: "Reset Your Elite Inventory Password",
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Password Reset</title>
          </head>
          <body style="font-family: Arial, sans-serif; color: #1f2937; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto;">
              <h2>Reset your password</h2>

              <p>Hello ${safeName},</p>

              <p>
                We received a request to reset your Elite Inventory password.
                Click the button below to choose a new password.
              </p>

              <p style="margin: 28px 0;">
                <a
                  href="${resetUrl.toString()}"
                  style="
                    display: inline-block;
                    padding: 12px 20px;
                    background: #2563eb;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                  "
                >
                  Reset Password
                </a>
              </p>

              <p>This link expires in 10 minutes.</p>

              <p>
                If you did not request this change, you can ignore this email.
              </p>

              <p style="color: #6b7280; font-size: 12px;">
                Elite Inventory
              </p>
            </div>
          </body>
        </html>
      `,
    });
  }

}
// }

export default new EmailService();