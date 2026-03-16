import { Client } from "@elastic/elasticsearch";
import { env } from "../config/env.js";

export const searchClient = new Client({
  node: env.ELASTICSEARCH_URL
});

export const CONTENT_INDEX = "ott_content";
