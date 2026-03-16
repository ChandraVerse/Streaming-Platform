import { Video } from "@mux/mux-node";
import { env } from "../config/env.js";

const muxTokenId = env.MUX_TOKEN_ID;
const muxTokenSecret = env.MUX_TOKEN_SECRET;

export const muxVideo = muxTokenId && muxTokenSecret ? new Video({ tokenId: muxTokenId, tokenSecret: muxTokenSecret }) : undefined;

