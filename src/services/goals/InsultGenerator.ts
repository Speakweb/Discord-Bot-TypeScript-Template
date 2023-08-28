
/**
 * Interface for the InsultGenerator block.
 * This block is responsible for generating insults.
 * It does not have any dependencies.
 */
export interface InsultGenerator {
  generateInsult(): string;
}

export class InsultGeneratorImpl implements InsultGenerator {
  private insults: string[];

  constructor() {
    this.insults = [
      "You're as bright as a black hole, and twice as dense.",
      "I've seen smarter people than you in the zoo.",
      "Your IQ doesn't make a respectable earthquake.",
      "You're a few bytes short of a full byte.",
      "If brains were dynamite, you wouldn't have enough to blow your nose."
    ];
  }

  generateInsult(): string {
    const randomIndex = Math.floor(Math.random() * this.insults.length);
    return this.insults[randomIndex];
  }
}

