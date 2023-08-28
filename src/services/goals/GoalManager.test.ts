
import { GoalManagerImpl, GoalStore, Goal, InMemoryGoalStore } from './GoalManager';

describe('GoalManager', () => {
  let goalStore: GoalStore;
  let goalManager: GoalManagerImpl;

  beforeEach(() => {
    goalStore = new InMemoryGoalStore();
    goalManager = new GoalManagerImpl(goalStore);
  });

  it('should create a goal', async () => {
    const goalId = await goalManager.createGoal('user1', 'goal1', new Date());
    const goal = await goalStore.get(goalId);
    expect(goal).toEqual({userId: 'user1', description: 'goal1', dueDate: expect.any(Date), id: goalId});
  });

  it('should delete a goal', async () => {
    const goalId = await goalManager.createGoal('user1', 'goal1', new Date());
    await goalManager.deleteGoal(goalId);
    const goal = await goalStore.get(goalId);
    expect(goal).toBeNull();
  });

  it('should get a goal', async () => {
    const goalId = await goalManager.createGoal('user1', 'goal1', new Date());
    const goal = await goalManager.getGoal(goalId);
    expect(goal).toEqual({userId: 'user1', description: 'goal1', dueDate: expect.any(Date), id: goalId});
  });
});

