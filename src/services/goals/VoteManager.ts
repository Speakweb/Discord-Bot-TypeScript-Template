// The VoteStore interface defines the methods for storing and retrieving votes.
// Each vote is associated with a goal by its unique ID.
export interface VoteStore {
  save(vote: Vote): Promise<void>;
  getVotes(goalId: number): Promise<Vote[]>;
}

// The InMemoryVoteStore class is an implementation of the VoteStore interface that stores votes in memory.
// This is a simple storage solution suitable for testing or small-scale applications.
export class InMemoryVoteStore implements VoteStore {
  private votes: Vote[] = [];

  // The save method stores a vote in memory.
  async save(vote: Vote): Promise<void> {
    this.votes.push(vote);
  }

  // The getVotes method retrieves all votes associated with a specific goal.
  async getVotes(goalId: number): Promise<Vote[]> {
    return this.votes.filter(vote => vote.goalId === goalId);
  }
}

// The JSONVoteStore class is an implementation of the VoteStore interface that stores votes in a JSON file.
// This is a more persistent storage solution suitable for larger-scale applications.
export class JSONVoteStore implements VoteStore {
  private votes: Vote[] = [];
  private fs = require('fs');
  private jsonFile = 'votes.json';

  // The constructor checks if the JSON file exists and loads the votes from it if it does.
  constructor() {
    if (this.fs.existsSync(this.jsonFile)) {
      this.votes = JSON.parse(this.fs.readFileSync(this.jsonFile));
    }
  }

  // The save method stores a vote in the JSON file.
  async save(vote: Vote): Promise<void> {
    this.votes.push(vote);
    this.fs.writeFileSync(this.jsonFile, JSON.stringify(this.votes));
  }

  // The getVotes method retrieves all votes associated with a specific goal from the JSON file.
  async getVotes(goalId: number): Promise<Vote[]> {
    return this.votes.filter(vote => vote.goalId === goalId);
  }
}

// The VoteManager interface defines the methods for casting and tallying votes.
// It uses a VoteStore to persist the votes.
export interface VoteManager {
  castVote(userId: string, goalId: number, vote: boolean): Promise<void>;
  tallyVotes(goalId: number): Promise<[number, number]>;
}

// The VoteManagerImpl class is an implementation of the VoteManager interface.
// It uses a VoteStore to persist the votes.
export class VoteManagerImpl implements VoteManager {
  constructor(private voteStore: VoteStore) {}

  // The castVote method allows a user to cast a vote for a specific goal.
  async castVote(userId: string, goalId: number, vote: boolean): Promise<void> {
    const voteObj = {userId, goalId, vote};
    await this.voteStore.save(voteObj);
  }

  // The tallyVotes method retrieves all votes for a specific goal and returns the number of positive and negative votes.
  async tallyVotes(goalId: number): Promise<[number, number]> {
    const votes = await this.voteStore.getVotes(goalId);
    return [votes.filter(vote => vote.vote).length, votes.filter(vote => !vote.vote).length];
  }
}

// The Vote interface represents a vote in the application.
// It includes the user's ID, the goal ID, and the vote (true for sufficient, false for insufficient).
export interface Vote {
  userId: string;
  goalId: number;
  vote: boolean;
}