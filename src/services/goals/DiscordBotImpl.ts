import { Client, Partials, GatewayIntentBits, SlashCommandBuilder, REST, Routes, TextChannel, DMChannel, RESTPostAPIChatInputApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import { GoalManager, GoalManagerImpl } from './GoalManager.js';
import { VoteManager, VoteManagerImpl } from './VoteManager';
import { InsultGenerator } from './InsultGenerator';
import { ChatInputCommandInteraction } from 'discord.js'; // Import Command related classes
import { Command, CommandDeferType } from '../../commands/index.js';
import { EventData } from '../../models/internal-models.js';
import {parse} from 'date-fns';
import { InteractionUtils } from '../../utils/index.js';

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
        names: ['creategoal'],
        deferType: CommandDeferType.HIDDEN,
        requireClientPerms: [],
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goal = data.args.getString("goal");
          const dueDate = new Date(data.args.getString("duedate"));
          const goalId = await discordBotImpl.handleGoalCommand(userId, goal, dueDate);
          InteractionUtils.send(intr, `Goal with ID: ${goalId} was created.`);
          if (data.channel instanceof TextChannel || data.channel instanceof DMChannel) {
            data.channel.send(`Goal with ID: ${goalId} was created.`);
          }
        }

      },
      {
        names: ['vote'],
        requireClientPerms: [],
        deferType: CommandDeferType.HIDDEN,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goalId = data.args.getNumber("goalid");
          const vote = data.args.getBoolean("vote");
          InteractionUtils.send(intr, JSON.stringify(await discordBotImpl.handleVoteCommand(userId, goalId, vote)));
        }
      },
      {
        names: ['checkgoal'],
        requireClientPerms: [],
        deferType: CommandDeferType.HIDDEN,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goalId = data.args.getNumber("goalid");
          InteractionUtils.send(intr, JSON.stringify(await discordBotImpl.handleCheckCommand(userId, goalId)));
        }
      },
      {
        names: ['listgoals'],
        requireClientPerms: [],
        deferType: CommandDeferType.HIDDEN,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          await InteractionUtils.send(intr, JSON.stringify(await discordBotImpl.listGoals()));
        }
      }
    ];
  }

  commandMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return [
      {
        name: 'creategoal',
        type: ApplicationCommandType.ChatInput,
        description: "Create a goal",
        options: [
          {
            name: 'goal',
            type: ApplicationCommandOptionType.String,
            description: 'The goal to be created',
            required: true
          },
          {
            name: 'duedate',
            type: ApplicationCommandOptionType.String,
            description: 'The due date for the goal',
            required: true
          }
        ]
      },
      {
        name: 'vote',
        type: ApplicationCommandType.ChatInput,
        description: "Vote on whether a goal has been completed",
        options: [
          {
            name: 'goalid',
            type: ApplicationCommandOptionType.Integer,
            description: 'The ID of the goal',
            required: true
          },
          {
            name: 'vote',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Your vote',
            required: true
          }
        ]
      },
      {
        name: 'checkgoal',
        type: ApplicationCommandType.ChatInput,
        description: "Check whether a goal has been completed",
        options: [
          {
            name: 'goalid',
            type: ApplicationCommandOptionType.Integer,
            description: 'The ID of the goal',
            required: true
          }
        ]
      },
      {
        name: 'listgoals',
        type: ApplicationCommandType.ChatInput,
        description: "List all the goals (TODO: in progress)"
      }
    ];
  }
}


