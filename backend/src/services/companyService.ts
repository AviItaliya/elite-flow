import { findCompanyByEmail, findCompanyById, updateCompany } from "../repositories/companyRepository.js";
import { UpdateCompanyInput } from "../validators/companyValidator.js";

export const getCurrentCompany = async (companyId: string) => {
  const company = await findCompanyById(companyId);

  if (!company) {
    throw new Error("Company not found");
  }

  return {
    id: company.id,
    name: company.name,
    email: company.email,
    phone: company.phone,
    address: company.address,
    isActive: company.isActive,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
};

export const updateCurrentCompany = async (companyId: string, data: UpdateCompanyInput) => {
  const existingCompany = await findCompanyById(companyId);
  if (!existingCompany) {
    throw new Error("Company not found");
  }
  if (data.email && data.email !== existingCompany.email) {
    const emailCompany = await findCompanyByEmail(data.email);
    if (emailCompany && emailCompany.id !== companyId) {
      throw new Error(
        "A company with this email already exists"
      );
    }
  }

  const company = await updateCompany(companyId, data);
  return {
    id: company.id,
    name: company.name,
    email: company.email,
    phone: company.phone,
    address: company.address,
    isActive: company.isActive,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
};

