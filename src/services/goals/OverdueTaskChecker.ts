import { GoalManager } from './GoalManager';
import { DiscordBotImpl } from './DiscordBotImpl';

/**
 * Interface for the OverdueTaskChecker block.
 * This block is responsible for periodically checking for overdue goals and triggering the appropriate actions in the DiscordBot.
 * It depends on a GoalManager to retrieve the goals and a DiscordBot to handle the actions.
 * 
 * The startChecking method should start the task checker. It should periodically retrieve all goals from the GoalManager, identify any overdue goals, and call the appropriate methods on the DiscordBot.
 * 
 * The stopChecking method should stop the task checker.
 */
export interface OverdueTaskChecker {
  startChecking(): Promise<void>;
  stopChecking(): Promise<void>;
}

export class OverdueTaskCheckerImpl implements OverdueTaskChecker {
  private intervalId: NodeJS.Timeout | null = null;
  constructor(private goalManager: GoalManager, private discordBot: DiscordBotImpl) {}

  async startChecking(): Promise<void> {
    this.intervalId = setInterval(async () => {
      const goals = await this.goalManager.listGoals();
      const overdueGoals = goals.filter(goal => goal.dueDate < new Date());
      overdueGoals.forEach(goal => {
        this.discordBot.handleGoalCommand(goal.userId, goal.description, goal.dueDate);
      });
    }, 1000); // Check every second
  }

  async stopChecking(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
