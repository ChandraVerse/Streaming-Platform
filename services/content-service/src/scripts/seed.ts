import { connectDatabase } from "../config/database.js";
import { ContentModel } from "../models/content.model.js";
import { ChannelModel } from "../models/channel.model.js";
import { ScheduleModel } from "../models/schedule.model.js";

async function seed() {
  await connectDatabase();
  await ContentModel.deleteMany({});
  await ChannelModel.deleteMany({});
  await ScheduleModel.deleteMany({});
  const content = await ContentModel.create([
    {
      title: "City Derby Live",
      slug: "city-derby-live",
      kind: "live",
      description: "Live football derby.",
      genres: ["Sports", "Live"],
      languages: ["en"],
      isPremium: true,
      isKids: false,
      isLive: true,
      liveStartTime: new Date()
    },
    {
      title: "Cooking Hour",
      slug: "cooking-hour",
      kind: "series",
      description: "A weekly cooking show.",
      genres: ["Lifestyle"],
      languages: ["en"],
      isPremium: false,
      isKids: false
    }
  ]);
  const channel = await ChannelModel.create({
    name: "Sports Central",
    slug: "sports-central",
    timezone: "UTC",
    isSports: true
  });
  await ScheduleModel.create({
    channelId: channel.id,
    contentId: content[0].id,
    title: content[0].title,
    startTime: new Date(Date.now() - 10 * 60 * 1000),
    endTime: new Date(Date.now() + 110 * 60 * 1000),
    timezone: "UTC",
    status: "live"
  });
  await ScheduleModel.create({
    channelId: channel.id,
    title: "Post-match analysis",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    timezone: "UTC",
    status: "upcoming"
  });
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    process.stderr.write(`Seed failed: ${String(error)}\n`);
    process.exit(1);
  });
