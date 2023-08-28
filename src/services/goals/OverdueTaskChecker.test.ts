import { GoalManager, GoalManagerImpl, InMemoryGoalStore } from './GoalManager';
import { DiscordBotImpl } from './DiscordBotImpl';
import { OverdueTaskCheckerImpl } from './OverdueTaskChecker';
import { InMemoryVoteStore, VoteManagerImpl } from './VoteManager';
import { InsultGeneratorImpl } from './InsultGenerator';
import { jest } from '@jest/globals';

describe('OverdueTaskCheckerImpl', () => {
  let goalManager: GoalManager;
  let discordBot: DiscordBotImpl;
  let checker: OverdueTaskCheckerImpl;

  beforeEach(() => {
    goalManager = new GoalManagerImpl(new InMemoryGoalStore());
    discordBot = new DiscordBotImpl(goalManager, new VoteManagerImpl(new InMemoryVoteStore()), new InsultGeneratorImpl());
    checker = new OverdueTaskCheckerImpl(goalManager, discordBot);
  });

  it('should start and stop checking', async () => {
    // TODO make jest capable of spying on setInterval
    // await checker.startChecking();
    // expect(setInterval).toHaveBeenCalled();
    // await checker.stopChecking();
    // expect(clearInterval).toHaveBeenCalled();
  });
});
