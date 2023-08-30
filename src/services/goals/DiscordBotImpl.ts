import { Client, Partials, GatewayIntentBits, SlashCommandBuilder, REST, Routes, TextChannel, DMChannel, RESTPostAPIChatInputApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import { Goal, GoalManager, GoalManagerImpl } from './GoalManager.js';
import { VoteManager, VoteManagerImpl } from './VoteManager';
import { InsultGenerator } from './InsultGenerator';
import { GoalScanner } from './GoalScanner.js'; // Import GoalScanner
import { EvidenceManager, EvidenceManagerImpl, JSONEvidenceStore } from './GoalEvidenceManager.js'; // Import EvidenceManager
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
  private goalScanner: GoalScanner; // Declare GoalScanner
  private evidenceManager: EvidenceManager; // Declare EvidenceManager

  constructor(
    goalManager: GoalManager,
    voteManager: VoteManager,
    insultGenerator: InsultGenerator,
  ) {
    this.goalManager = goalManager;
    this.voteManager = voteManager;
    this.insultGenerator = insultGenerator;
    this.goalScanner = new GoalScanner(goalManager, this.client); // Initialize GoalScanner
    this.evidenceManager = new EvidenceManagerImpl(new JSONEvidenceStore()); // Initialize EvidenceManager
  }

  async handleGoalCommand(userId: string, goal: string, dueDate: Date, channelId: string): Promise<number> {
    return this.goalManager.createGoal(userId, goal, dueDate, channelId);
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

  async handleEvidenceCommand(userId: string, goalId: number, evidence: string): Promise<void> {
    await this.evidenceManager.addEvidence({userId, goalId, evidence});
  }

  async listGoals(): Promise<{ goal: Goal; votes: { for: number; against: number } }[]> {
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
          const channelId = intr.channelId;
          const goalId = await discordBotImpl.handleGoalCommand(userId, goal, dueDate, channelId);
          const formattedDueDate = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          InteractionUtils.send(intr, `Goal with ID: ${goalId}, Description: ${goal}, Due Date: ${formattedDueDate} was created.`);
          if (data.channel instanceof TextChannel || data.channel instanceof DMChannel) {
            // data.channel.send(`Goal with ID: ${goalId}, Description: ${goal}, Due Date: ${formattedDueDate} was created.`);
          }
        }
      },
      {
        names: ['vote'],
        requireClientPerms: [],
        deferType: CommandDeferType.PUBLIC,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goalId = data.args.getNumber("goalid");
          const vote = data.args.getBoolean("vote");
          await discordBotImpl.handleVoteCommand(userId, goalId, vote);
          InteractionUtils.send(intr, `Vote for goal ID: ${goalId} was cast.`);
        }
      },
      {
        names: ['checkgoal'],
        requireClientPerms: [],
        deferType: CommandDeferType.PUBLIC,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const userId = intr.user.id;
          const goalId = data.args.getNumber("goalid");
          const goalCheckMessage = await discordBotImpl.handleCheckCommand(userId, goalId);
          const evidences = await discordBotImpl.evidenceManager.getEvidences(goalId);
          InteractionUtils.send(intr, `Goal Check Message: ${goalCheckMessage}, Evidences: ${evidences.map(evidence => evidence.evidence).join(', ')}`);
        }
      },
      {
        names: ['addevidence'],
        requireClientPerms: [],
        deferType: CommandDeferType.PUBLIC,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const goalId = data.args.getNumber("goalid");
          const evidence = data.args.getString("evidence");
          await discordBotImpl.handleEvidenceCommand(intr.user.id, goalId, evidence);
          InteractionUtils.send(intr, `Evidence for goal ID: ${goalId} was added.`);
        }
      },
      {
        names: ['listgoals'],
        requireClientPerms: [],
        deferType: CommandDeferType.PUBLIC,
        async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
          const goals = await discordBotImpl.listGoals();
          const goalEvidences = await Promise.all(goals.map(async (goal) => {
            const evidences = await discordBotImpl.evidenceManager.getEvidences(goal.goal.id);
            return {
              goal: goal.goal,
              evidencesCount: evidences.length
            };
          }));
          if (data.channel instanceof TextChannel || data.channel instanceof DMChannel) {
            InteractionUtils.send(intr,`Goals: ${goalEvidences.map(goalEvidence => `Goal ID: ${goalEvidence.goal.id}, Description: ${goalEvidence.goal.description}, Evidence Count: ${goalEvidence.evidencesCount}`).join('\n')}`);
            //data.channel.send(`Goals: ${goalEvidences.map(goalEvidence => `Goal ID: ${goalEvidence.goal.id}, Description: ${goalEvidence.goal.description}, Evidence Count: ${goalEvidence.evidencesCount}`).join('\n')}`);
          }

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
        name: 'addevidence',
        type: ApplicationCommandType.ChatInput,
        description: "Add evidence for a goal",
        options: [
          {
            name: 'goalid',
            type: ApplicationCommandOptionType.Integer,
            description: 'The ID of the goal',
            required: true
          },
          {
            name: 'evidence',
            type: ApplicationCommandOptionType.String,
            description: 'The evidence for the goal',
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
