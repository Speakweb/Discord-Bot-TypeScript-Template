// The Goal interface represents a user's goal in the application.
// It includes the user's ID, a description of the goal, the due date for the goal, and a unique ID for the goal.
export interface Goal {
  userId: string;
  description: string;
  dueDate: Date;
  id: number;
}

// The GoalStore interface defines the methods that any goal storage implementation must provide.
// This allows for different storage implementations (e.g., in-memory, JSON file) to be used interchangeably.
export interface GoalStore {
  save(goal: Goal): Promise<number>;
  delete(id: number): Promise<void>;
  get(id: number): Promise<Goal | null>;
  getAll(): Promise<Goal[]>; // Added method to get all goals
}

// The InMemoryGoalStore class is an implementation of the GoalStore interface that stores goals in memory.
// This is a simple storage solution suitable for testing or small-scale applications.
export class InMemoryGoalStore implements GoalStore {
  private store: Map<number, Goal> = new Map();

  async save(goal: Goal): Promise<number> {
    this.store.set(goal.id, goal);
    return goal.id;
  }

  async delete(id: number): Promise<void> {
    this.store.delete(id);
  }

  async get(id: number): Promise<Goal | null> {
    return this.store.get(id) || null;
  }

  async getAll(): Promise<Goal[]> { // Added method to get all goals
    return Array.from(this.store.values());
  }
}

// The JSONGoalStore class is an implementation of the GoalStore interface that stores goals in a JSON file.
// This provides a simple way to persist goals between application runs.
export class JSONGoalStore implements GoalStore {
  private store: Goal[] = [];
  private fs = require('fs');
  private jsonFile = 'goals.json';

  constructor() {
    // If the JSON file exists when the store is created, load the goals from the file.
    if (this.fs.existsSync(this.jsonFile)) {
      this.store = JSON.parse(this.fs.readFileSync(this.jsonFile));
    }
  }

  async save(goal: Goal): Promise<number> {
    this.store.push(goal);
    // After a goal is saved, write the entire store to the JSON file.
    this.fs.writeFileSync(this.jsonFile, JSON.stringify(this.store));
    return goal.id;
  }

  async delete(id: number): Promise<void> {
    this.store = this.store.filter(goal => goal.id !== id);
    // After a goal is deleted, write the entire store to the JSON file.
    this.fs.writeFileSync(this.jsonFile, JSON.stringify(this.store));
  }

  async get(id: number): Promise<Goal | null> {
    const goal = this.store.find(goal => goal.id === id);
    return goal || null;
  }

  async getAll(): Promise<Goal[]> { // Added method to get all goals
    return this.store;
  }
}
// The GoalManager interface defines the methods that the application uses to interact with goals.
// This allows the application to create, delete, and retrieve goals without knowing how they are stored.
export interface GoalManager {
  createGoal(userId: string, goal: string, dueDate: Date): Promise<number>;
  deleteGoal(goalId: number): Promise<void>;
  getGoal(goalId: number): Promise<Goal | null>;
  listGoals(): Promise<Goal[]>; // Added method to get all goals
}

// The GoalManagerImpl class is an implementation of the GoalManager interface.
// It uses a GoalStore to handle the storage of goals.
export class GoalManagerImpl implements GoalManager {
  constructor(private goalStore: GoalStore) {}

  async createGoal(userId: string, goal: string, dueDate: Date): Promise<number> {
    // When a goal is created, it is given a random ID.
    // This is a simple way to generate unique IDs, but in a real application a more robust method would be used.
    const id = Math.floor(Math.random() * 10000);
    const newGoal = {userId, dueDate, id, description: goal};
    return this.goalStore.save(newGoal);
  }

  deleteGoal(goalId: number): Promise<void> {
    return this.goalStore.delete(goalId);
  }

  getGoal(goalId: number): Promise<Goal | null> {
    return this.goalStore.get(goalId);
  }

  listGoals(): Promise<Goal[]> { // Added method to get all goals
    return this.goalStore.getAll();
  }
}


