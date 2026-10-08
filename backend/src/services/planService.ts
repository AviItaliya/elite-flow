import {createPlan, findAllPlans, findPlanById, findPlanByName, updatePlan, updatePlanStatus} from "../repositories/planRepository.js";
import type {CreatePlanInput, UpdatePlanInput} from "../validators/planValidator.js";

export const createNewPlan = async (data: CreatePlanInput) => {
  const existingPlan = await findPlanByName(data.name);
  if (existingPlan) {
    throw new Error("A plan with this name already exists");
  }
  return createPlan(data);
};

export const getAllPlans = async () => {
  return findAllPlans();
};

export const getPlan = async (planId: string) => {
  const plan = await findPlanById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }
  return plan;
};

export const editPlan = async (planId: string, data: UpdatePlanInput) => {
  const existingPlan = await findPlanById(planId);
  if (!existingPlan) {
    throw new Error("Plan not found");
  }
  if (data.name && data.name !== existingPlan.name) {
    const planWithSameName = await findPlanByName(data.name);
    if (planWithSameName) {
      throw new Error("A plan with this name already exists");
    }
  }
  return updatePlan(planId, data);
};

export const changePlanStatus = async (planId: string, isActive: boolean) => {
  const existingPlan = await findPlanById(planId);
  if (!existingPlan) {
    throw new Error("Plan not found");
  }
  return updatePlanStatus(planId, isActive);
};