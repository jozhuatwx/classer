import { Emotion } from './emotion.model';

export interface Snapshot {
  id: string;
  sessionId: string;
  dateTime: number;
  perceivedEmotion: Emotion;
}

export class Snapshot implements Snapshot {
  static isSnapshot(obj: any): obj is Snapshot {
    return obj.id !== undefined && obj.sessionId !== undefined && obj.dateTime !== undefined && obj.perceivedEmotion !== undefined;
  }

  static isSnapshots(objs: any): objs is Snapshot[] {
    for (const obj of objs) {
      if (obj.id === undefined || obj.sessionId === undefined || obj.dateTime === undefined || obj.perceivedEmotion === undefined) {
        return false;
      }
    }
    return true;
  }
}
