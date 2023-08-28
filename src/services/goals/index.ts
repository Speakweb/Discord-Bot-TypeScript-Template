import dotenv from 'dotenv';
dotenv.config();
import { DiscordBotImpl } from "./DiscordBotImpl";
import { GoalManagerImpl, JSONGoalStore } from "./GoalManager";
import { InsultGeneratorImpl } from "./InsultGenerator";
import { JSONVoteStore, VoteManagerImpl } from "./VoteManager";
import { OverdueTaskCheckerImpl } from './OverdueTaskChecker';

const goalManager = new GoalManagerImpl(new JSONGoalStore());
const voteManager = new VoteManagerImpl(new JSONVoteStore());
const insultGenerator = new InsultGeneratorImpl();
export const discordBot = new DiscordBotImpl(
    goalManager, 
    voteManager, 
    insultGenerator,
);

