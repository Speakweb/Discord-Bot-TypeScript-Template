
import { InsultGeneratorImpl } from './InsultGenerator';

describe('InsultGeneratorImpl', () => {
  it('should generate an insult', () => {
    const insultGenerator = new InsultGeneratorImpl();
    const insult = insultGenerator.generateInsult();
    expect(insult).toBeTruthy();
  });
});

