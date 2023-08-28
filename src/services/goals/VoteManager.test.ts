import { InMemoryVoteStore, VoteManager, VoteManagerImpl, VoteStore } from './VoteManager';

describe('VoteManager', () => {
  let voteStore: VoteStore;
  let voteManager: VoteManager;

  beforeEach(() => {
    voteStore = new InMemoryVoteStore();
    voteManager = new VoteManagerImpl(voteStore);
  });

  it('should cast votes and tally them correctly', async () => {
    await voteManager.castVote('user1', 1, true);
    await voteManager.castVote('user2', 1, false);
    await voteManager.castVote('user3', 1, true);

    const tally = await voteManager.tallyVotes(1);
    expect(tally).toEqual([ 2, 1 ]);
  });
});
