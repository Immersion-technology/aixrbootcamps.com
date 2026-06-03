import mongoose, { Schema, Model } from "mongoose";

export interface ICounter {
  key: string;
  value: number;
}

const CounterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Number, default: 0 },
});

export const Counter: Model<ICounter> =
  (mongoose.models.Counter as Model<ICounter>) || mongoose.model<ICounter>("Counter", CounterSchema);

// Atomic increment: used to generate sequential registration IDs.
export async function nextSeq(key: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  ).lean<ICounter | null>();
  return doc!.value;
}
