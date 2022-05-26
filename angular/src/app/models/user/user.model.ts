export interface User {
  id: string;
  name: string;
  email: string;
}

export class User implements User {
  constructor() {
    this.id = '00000000-0000-0000-0000-000000000000';
    this.name = '';
    this.email = '';
  }

  static isUser(obj: any): obj is User {
    return obj.id !== undefined && obj.name !== undefined && obj.email !== undefined;
  }
}
