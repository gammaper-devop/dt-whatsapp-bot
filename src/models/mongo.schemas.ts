import mongoose, { Schema, Document } from 'mongoose';

// Interfaz para TypeScript del Usuario
export interface IUser extends Document {
  phone: string;
  name: string;
  locura: number;
  email?: string;
  equipoFavorito?: string;
  lastActive: number;
}

// Interfaz para TypeScript de la Predicción Humana
export interface IPrediction extends Document {
  phone: string;
  partidoId: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  puntosGanados?: number;
  timestamp: number;
}

const UserSchema: Schema = new Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: null },
  locura: { type: Number, default: 50 },
  equipoFavorito: { type: String },
  lastActive: { type: Number, default: Date.now },
  active: { type: Boolean, default: true }
});

const PredictionSchema: Schema = new Schema({
  phone: { type: String, required: true },
  partidoId: { type: String, required: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  score1: { type: Number, required: true },
  score2: { type: Number, required: true },
  puntosGanados: { type: Number, default: null },
  timestamp: { type: Number, default: Date.now }
});

export const MongoUser = mongoose.model<IUser>('User', UserSchema);
export const MongoPrediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);