import { DiscordBotImpl } from "./DiscordBotImpl";
import { GoalManager, GoalManagerImpl, InMemoryGoalStore } from "./GoalManager";
import { InsultGenerator, InsultGeneratorImpl } from "./InsultGenerator";
import { InMemoryVoteStore, VoteManager, VoteManagerImpl } from "./VoteManager";

describe('DiscordBot', () => {
  let bot: DiscordBotImpl;
  let goalManager: GoalManager;
  let voteManager: VoteManager;
  let insultGenerator: InsultGenerator;

  beforeEach(() => {
    goalManager = new GoalManagerImpl(new InMemoryGoalStore());
    voteManager = new VoteManagerImpl(new InMemoryVoteStore());
    insultGenerator = new InsultGeneratorImpl();
    bot = new DiscordBotImpl(goalManager, voteManager, insultGenerator);
  });

  it('should create a new goal', async () => {
    const goal = 'Test Goal';
    const dueDate = new Date();
    const userId = '123';

    const goalId = await bot.handleGoalCommand(userId, goal, dueDate);

    expect(goalId).toBeDefined();
    expect(await goalManager.getGoal(goalId)).toMatchObject({ userId, description: goal, dueDate });
  });
});
