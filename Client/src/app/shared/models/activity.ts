import { IAttendee } from './attendee';

export interface IActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  date: Date;
  city: string;
  venue: string;
  attendees?: IAttendee[];
  isHost?: boolean;
  isGoing?: boolean;
}
