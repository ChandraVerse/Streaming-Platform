import { Router } from "express";
import { searchContent } from "../search/indexer.js";

const router = Router();

router.get("/", async (request, response) => {
  const q = String(request.query.q ?? "").trim();
  if (!q) {
    response.json({ data: [] });
    return;
  }

  const results = await searchContent(q);
  response.json({ data: results });
});

export const searchRoutes = router;
