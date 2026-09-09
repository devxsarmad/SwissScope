import { Router } from "express";
import { getCompanies } from "../controllers/companies.controller.js";

export const companiesRouter = Router();

companiesRouter.get("/", getCompanies);
