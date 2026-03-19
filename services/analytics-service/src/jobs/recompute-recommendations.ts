import { connectDatabase } from "../config/database.js";
import { EventModel } from "../models/event.model.js";
import { RecommendationModel } from "../models/recommendation.model.js";

async function recompute() {
  await connectDatabase();
  const users = await EventModel.distinct("userId", { userId: { $exists: true, $ne: null } });
  for (const userId of users) {
    const watched = await EventModel.distinct("contentId", {
      userId,
      contentId: { $exists: true, $ne: null },
      kind: { $in: ["play", "complete"] }
    });
    if (watched.length === 0) {
      continue;
    }
    const recs = await EventModel.aggregate([
      {
        $match: {
          contentId: { $in: watched },
          userId: { $ne: userId }
        }
      },
      { $group: { _id: "$userId" } },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "userId",
          as: "events"
        }
      },
      { $unwind: "$events" },
      {
        $match: {
          "events.contentId": { $nin: watched },
          "events.kind": { $in: ["play", "complete"] }
        }
      },
      { $group: { _id: "$events.contentId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    const contentIds = recs.map((entry) => entry._id as string).filter(Boolean);
    await RecommendationModel.updateOne({ userId }, { userId, contentIds }, { upsert: true });
  }
}

recompute()
  .then(() => process.exit(0))
  .catch((error) => {
    process.stderr.write(`Failed to recompute recommendations: ${String(error)}\n`);
    process.exit(1);
  });
