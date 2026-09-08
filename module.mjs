// @ts-check
import { module } from "@prisma/composer";
import ghostAiService from "./service.mjs";

export default module("ghost-ai", ({ provision }) => {
  provision(ghostAiService, { id: "ghostai" });
});
