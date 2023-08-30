import fs from 'fs';
// The EvidenceStore interface defines the methods for storing and retrieving evidences.
// Each evidence is associated with a goal by its unique ID.
export interface EvidenceStore {
  save(evidence: Evidence): Promise<void>;
  getEvidences(goalId: number): Promise<Evidence[]>;
}

// The InMemoryEvidenceStore class is an implementation of the EvidenceStore interface that stores evidences in memory.
// This is a simple storage solution suitable for testing or small-scale applications.
export class InMemoryEvidenceStore implements EvidenceStore {
  private evidences: Evidence[] = [];

  // The save method stores an evidence in memory.
  async save(evidence: Evidence): Promise<void> {
    this.evidences.push(evidence);
  }

  // The getEvidences method retrieves all evidences associated with a specific goal.
  async getEvidences(goalId: number): Promise<Evidence[]> {
    return this.evidences.filter(evidence => evidence.goalId === goalId);
  }
}

// The JSONEvidenceStore class is an implementation of the EvidenceStore interface that stores evidences in a JSON file.
// This is a more persistent storage solution suitable for larger-scale applications.
export class JSONEvidenceStore implements EvidenceStore {
  private evidences: Evidence[] = [];
  private jsonFile = 'evidences.json';

  // The constructor checks if the JSON file exists and loads the evidences from it if it does.
  constructor() {
    if (fs.existsSync(this.jsonFile)) {
      this.evidences = JSON.parse(fs.readFileSync(this.jsonFile).toString('utf-8'));
    }
  }

  // The save method stores an evidence in the JSON file.
  async save(evidence: Evidence): Promise<void> {
    this.evidences.push(evidence);
    fs.writeFileSync(this.jsonFile, JSON.stringify(this.evidences));
  }

  // The getEvidences method retrieves all evidences associated with a specific goal from the JSON file.
  async getEvidences(goalId: number): Promise<Evidence[]> {
    return this.evidences.filter(evidence => evidence.goalId === goalId);
  }
}

// The EvidenceManager interface defines the methods for adding and retrieving evidences.
// It uses an EvidenceStore to persist the evidences.
export interface EvidenceManager {
  addEvidence(params: {userId: string, goalId: number, evidence: string}): Promise<void>;
  getEvidences(goalId: number): Promise<Evidence[]>;
}

// The EvidenceManagerImpl class is an implementation of the EvidenceManager interface.
// It uses an EvidenceStore to persist the evidences.
export class EvidenceManagerImpl implements EvidenceManager {
  constructor(private evidenceStore: EvidenceStore) {}

  // The addEvidence method allows a user to add an evidence for a specific goal.
  async addEvidence({userId, goalId, evidence}: {userId: string, goalId: number, evidence: string}): Promise<void> {
    const evidenceObj = {userId, goalId, evidence};
    await this.evidenceStore.save(evidenceObj);
  }

  // The getEvidences method retrieves all evidences for a specific goal.
  async getEvidences(goalId: number): Promise<Evidence[]> {
    return await this.evidenceStore.getEvidences(goalId);
  }
}

// The Evidence interface represents an evidence in the application.
// It includes the user's ID, the goal ID, and the evidence.
export interface Evidence {
  userId: string;
  goalId: number;
  evidence: string;
}
