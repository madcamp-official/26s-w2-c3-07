export type Suspect = {
  id: string;
  name: string;
  gender: "남" | "여";
  age: number;
  occupation: string;
};

export type TestimonyEntry = {
  suspectId: string;
  time: string;
  lines: string[];
};

export type ClueStatus = "analyzed" | "unanalyzed";

export type Clue = {
  id: string;
  label: string;
  status: ClueStatus;
};

export type RecordStep = {
  id: number;
  label: string;
};
