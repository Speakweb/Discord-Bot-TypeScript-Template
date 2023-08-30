import { Client, TextChannel } from 'discord.js';
import { GoalManager } from './GoalManager.js';

export class GoalScanner {
  private goalManager: GoalManager;
  private client: Client;

  constructor(goalManager: GoalManager, client: Client) {
    this.goalManager = goalManager;
    this.client = client;
  }

  async scanGoals(): Promise<void> {
    const goals = await this.goalManager.listGoals();
    const now = new Date();
    for (const goal of goals) {
      const formattedDueDate = goal.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (goal.dueDate > now) {
        const channel = this.client.channels.cache.get(goal.channelId) as TextChannel;
        if (channel) {
          channel.send(`Goal with ID: ${goal.id}, description: ${goal.description}, and due date: ${formattedDueDate} is yet to be completed.`);
        }
      } else {
        const channel = this.client.channels.cache.get(goal.channelId) as TextChannel;
        if (channel) {
          channel.send(`Goal with ID: ${goal.id}, description: ${goal.description}, and due date: ${formattedDueDate} is overdue.`);
        }
      }
    }
  }

  startScanning(): void {
    setInterval(() => this.scanGoals(), 600000); // 10 minutes
    this.scanGoals();
  }
}

