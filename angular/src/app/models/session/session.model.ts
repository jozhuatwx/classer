export interface Session {
  id: string;
  userId: string;
  sessionName: string;
  note: string;
  startDateTime: number;
  lastUpdatedDateTime: number;
}

export class Session implements Session {
  static isSession(obj: any): obj is Session {
    return obj.id !== undefined && obj.userId !== undefined && obj.sessionName !== undefined && obj.note !== undefined && obj.startDateTime !== undefined && obj.lastUpdatedDateTime !== undefined;
  }

  static isSessions(objs: any): objs is Session[] {
    for (const obj of objs) {
      if (obj.id === undefined || obj.userId === undefined || obj.sessionName === undefined || obj.note === undefined || obj.startDateTime === undefined || obj.lastUpdatedDateTime === undefined) {
        return false;
      }
    }
    return true;
  }
}
