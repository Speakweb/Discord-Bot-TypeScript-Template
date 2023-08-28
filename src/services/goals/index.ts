import dotenv from 'dotenv';
dotenv.config();
import { DiscordBotImpl } from "./DiscordBotImpl.js";
import { GoalManagerImpl, JSONGoalStore } from "./GoalManager.js";
import { InsultGeneratorImpl } from "./InsultGenerator.js";
import { JSONVoteStore, VoteManagerImpl } from "./VoteManager.js";
import { OverdueTaskCheckerImpl } from './OverdueTaskChecker.js';

const goalManager = new GoalManagerImpl(new JSONGoalStore());
const voteManager = new VoteManagerImpl(new JSONVoteStore());
const insultGenerator = new InsultGeneratorImpl();
export const discordBot = new DiscordBotImpl(
    goalManager, 
    voteManager, 
    insultGenerator,
);

