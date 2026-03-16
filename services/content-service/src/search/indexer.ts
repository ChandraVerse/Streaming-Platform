import type { ContentDocument } from "../models/content.model.js";
import { CONTENT_INDEX, searchClient } from "./client.js";

export async function indexContent(content: ContentDocument) {
  await searchClient.index({
    index: CONTENT_INDEX,
    id: content.id,
    document: {
      title: content.title,
      description: content.description,
      genres: content.genres,
      languages: content.languages,
      ageRating: content.ageRating,
      isKids: content.isKids
    }
  });
}

export async function searchContent(query: string) {
  const response = await searchClient.search({
    index: CONTENT_INDEX,
    query: {
      multi_match: {
        query,
        fields: ["title^3", "description", "genres", "languages"]
      }
    }
  });

  return response.hits.hits.map((hit) => ({
    id: hit._id,
    ...(hit._source as Record<string, unknown>)
  }));
}
