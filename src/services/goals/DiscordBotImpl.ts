import { Client, Partials, GatewayIntentBits, SlashCommandBuilder, REST, Routes, TextChannel, DMChannel } from 'discord.js';
import { GoalManager, GoalManagerImpl } from './GoalManager.js';
import { VoteManager, VoteManagerImpl } from './VoteManager';
import { InsultGenerator } from './InsultGenerator';
import { ChatInputCommandInteraction } from 'discord.js'; // Import Command related classes
import { Command, CommandDeferType } from '../../commands/index.js';
import { EventData } from '../../models/internal-models.js';
import {parse} from 'date-fns';





export class DiscordBotImpl {
  public client: Client;
  private goalManager: GoalManager;
  private voteManager: VoteManager;
  private insultGenerator: InsultGenerator;

  constructor(
    goalManager: GoalManager,
    voteManager: VoteManager,
    insultGenerator: InsultGenerator,
  ) {
    this.goalManager = goalManager;
    this.voteManager = voteManager;
    this.insultGenerator = insultGenerator;
  }

  async handleGoalCommand(userId: string, goal: string, dueDate: Date): Promise<number> {
    return this.goalManager.createGoal(userId, goal, dueDate);
  }

  async handleVoteCommand(userId: string, goalId: number, vote: boolean): Promise<void> {
    this.voteManager.castVote(userId, goalId, vote);
  }

  async handleCheckCommand(userId: string, goalId: number): Promise<string> {
    const goal = await this.goalManager.getGoal(goalId);
    const [forCount, againstCount] = await this.voteManager.tallyVotes(goalId);
    const result = forCount > againstCount;
    const message = `For: ${forCount}, Against: ${againstCount}`;

    return result ? message : `Vote is not completed. ${message}`;
  }

  async listGoals(): Promise<any> {
    const goals = await this.goalManager.listGoals();
    const goalVotes = await Promise.all(goals.map(async (goal) => {
      const [forCount, againstCount] = await this.voteManager.tallyVotes(goal.id);
      return {
        goal,
        votes: {
          for: forCount,
          against: againstCount
        }
      };
    }));
    return goalVotes;
  }

  commands(): Command[] {
    const discordBotImpl = this;
    return [
      {
        names: ['handleGoalCommand'],
        deferType: CommandDeferType.HIDDEN,
        requireClientPerms: [],
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goal = data.args.getString("goal");
          const dueDate = new Date(data.args.getString("duedate"));
          await discordBotImpl.handleGoalCommand(userId, goal, dueDate);
        }
      },
      {
        names: ['handleVoteCommand'],
        requireClientPerms: [],
        deferType: CommandDeferType.HIDDEN,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goalId = data.args.getNumber("goalId");
          const vote = data.args.getBoolean("vote");
          await discordBotImpl.handleVoteCommand(userId, goalId, vote);
        }
      },
      {
        names: ['handleCheckCommand'],
        requireClientPerms: [],
        deferType: CommandDeferType.HIDDEN,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goalId = data.args.getNumber("goalId");
          await discordBotImpl.handleCheckCommand(userId, goalId);
        }
      },
      {
        names: ['listGoals'],
        requireClientPerms: [],
        deferType: CommandDeferType.HIDDEN,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          await discordBotImpl.listGoals();
        }
      }
    ];
  }
}
